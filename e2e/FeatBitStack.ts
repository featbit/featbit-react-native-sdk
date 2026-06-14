import { randomUUID } from 'crypto';
import { GenericContainer, Network, StartedNetwork, StartedTestContainer, Wait } from 'testcontainers';

/**
 * Spins up a real FeatBit stack (Postgres + api-server + evaluation-server) with Testcontainers
 * and seeds a known feature flag, so the React Native SDK can be exercised against a real
 * evaluation server over both polling and streaming.
 *
 * This is a TypeScript port of the harness used by the Fluent Health Android SDK. The management
 * API flow (login -> discover workspace/org -> onboarding -> create flag) was derived empirically
 * against the live server. The Postgres init SQL under `e2e/initdb/` is vendored from
 * `featbit/featbit` (Apache-2.0).
 */

const API_PORT = 5000;
const EVAL_PORT = 5100;
const FLAG_KEY = 'e2e-bool-flag';
const PG_CONN =
  'Host=postgresql;Port=5432;Username=postgres;Password=please_change_me;Database=featbit';

// Postgres runs *.sql in /docker-entrypoint-initdb.d alphabetically (v0.0.0 first).
const INIT_SCRIPTS = [
  'v0.0.0.sql', 'v5.0.4.sql', 'v5.0.5.sql', 'v5.1.0.sql',
  'v5.2.0.sql', 'v5.2.1.sql', 'v5.3.0.sql', 'v5.3.2.sql', 'v5.4.0.sql',
];

export interface SeedResult {
  evaluationBaseUrl: string; // http://host:port
  clientSecret: string;
  flagKey: string;
}

export class FeatBitStack {
  private network!: StartedNetwork;
  private postgres!: StartedTestContainer;
  private apiServer!: StartedTestContainer;
  private evaluationServer!: StartedTestContainer;

  private apiBase = '';
  private token = '';
  private workspaceId = '';
  private organizationId = '';
  private envId = '';

  async start(): Promise<void> {
    this.network = await new Network().start();

    const initFiles = INIT_SCRIPTS.map((name) => ({
      source: `${__dirname}/initdb/${name}`,
      target: `/docker-entrypoint-initdb.d/${name}`,
    }));

    this.postgres = await new GenericContainer('postgres:15.10')
      .withNetwork(this.network)
      .withNetworkAliases('postgresql')
      .withEnvironment({ POSTGRES_USER: 'postgres', POSTGRES_PASSWORD: 'please_change_me' })
      .withCopyFilesToContainer(initFiles)
      .withStartupTimeout(120_000)
      .withWaitStrategy(Wait.forLogMessage(/database system is ready to accept connections/, 2))
      .start();

    const commonEnv = {
      DbProvider: 'Postgres',
      MqProvider: 'Postgres',
      CacheProvider: 'None',
      Postgres__ConnectionString: PG_CONN,
    };

    [this.apiServer, this.evaluationServer] = await Promise.all([
      new GenericContainer('featbit/featbit-api-server:latest')
        .withNetwork(this.network)
        .withEnvironment({
          ...commonEnv,
          OLAP__ServiceHost: 'http://da-server',
          Jwt__Algorithm: 'HS256',
          Jwt__Key: 'please_change_me_to_a_secure_secret_key',
        })
        .withExposedPorts(API_PORT)
        .withWaitStrategy(Wait.forListeningPorts())
        .withStartupTimeout(240_000)
        .start(),
      new GenericContainer('featbit/featbit-evaluation-server:latest')
        .withNetwork(this.network)
        .withEnvironment(commonEnv)
        .withExposedPorts(EVAL_PORT)
        .withWaitStrategy(Wait.forListeningPorts())
        .withStartupTimeout(240_000)
        .start(),
    ]);

    this.apiBase = `http://${this.apiServer.getHost()}:${this.apiServer.getMappedPort(API_PORT)}`;
  }

  /** Logs in, discovers the workspace/org, onboards a project, and creates an enabled boolean flag. */
  async seed(): Promise<SeedResult> {
    this.token = await this.retryForToken();
    this.workspaceId = this.firstId(await this.get('/api/v1/user/workspaces'));
    this.organizationId = this.firstId(
      await this.get('/api/v1/organizations', this.workspaceId),
    );

    await this.post(
      '/api/v1/organizations/onboarding',
      {
        organizationName: 'playground', organizationKey: 'playground',
        projectName: 'e2e', projectKey: 'e2e', environments: ['prod'],
      },
      this.workspaceId, this.organizationId,
    );

    const { envId, clientSecret } = await this.readEnvAndClientSecret();
    this.envId = envId;
    await this.createBooleanFlag(FLAG_KEY);

    const evalBase = `http://${this.evaluationServer.getHost()}:${this.evaluationServer.getMappedPort(EVAL_PORT)}`;
    return { evaluationBaseUrl: evalBase, clientSecret, flagKey: FLAG_KEY };
  }

  /** Toggles the seeded flag on/off via the management API (drives change-detection tests). */
  async toggleFlag(enabled: boolean): Promise<void> {
    await this.put(
      `/api/v1/envs/${this.envId}/feature-flags/${FLAG_KEY}/toggle/${enabled}`,
      this.workspaceId, this.organizationId,
    );
  }

  async close(): Promise<void> {
    await this.evaluationServer?.stop().catch(() => undefined);
    await this.apiServer?.stop().catch(() => undefined);
    await this.postgres?.stop().catch(() => undefined);
    await this.network?.stop().catch(() => undefined);
  }

  // --- management API helpers ---------------------------------------------

  /** Single login attempt; never retries on auth (it is what mints the token). */
  private async login(): Promise<string> {
    const body = await this.request(
      'POST', '/api/v1/identity/login-by-email',
      { email: 'test@featbit.com', password: '123456' },
      undefined, undefined, /* retryOnAuth */ false,
    );
    this.token = body.data.token as string;
    return this.token;
  }

  /** Retries login until the api-server is ready (it starts before it can serve requests). */
  private async retryForToken(): Promise<string> {
    const deadline = Date.now() + 180_000;
    let last: unknown;
    while (Date.now() < deadline) {
      try {
        return await this.login();
      } catch (e) {
        last = e;
        await sleep(3000);
      }
    }
    throw new Error(`api-server did not become ready in time: ${String(last)}`);
  }

  private async createBooleanFlag(key: string): Promise<void> {
    const trueId = randomUUID();
    const falseId = randomUUID();
    await this.post(
      `/api/v1/envs/${this.envId}/feature-flags`,
      {
        name: key, key, isEnabled: true, description: '', variationType: 'boolean',
        variations: [
          { id: trueId, name: 'true', value: 'true' },
          { id: falseId, name: 'false', value: 'false' },
        ],
        enabledVariationId: trueId, disabledVariationId: falseId, tags: [],
      },
      this.workspaceId, this.organizationId,
    );
  }

  private async readEnvAndClientSecret(): Promise<{ envId: string; clientSecret: string }> {
    const body = await this.get('/api/v1/projects', this.workspaceId, this.organizationId);
    const env = body.data[0].environments[0];
    const clientSecret = env.secrets.find((s: { type: string }) => s.type === 'client').value;
    return { envId: env.id as string, clientSecret: clientSecret as string };
  }

  private firstId(body: { data: Array<{ id: string }> }): string {
    return body.data[0].id;
  }

  private get(path: string, workspace?: string, organization?: string) {
    return this.request('GET', path, undefined, workspace, organization);
  }

  private post(path: string, json: unknown, workspace?: string, organization?: string) {
    return this.request('POST', path, json, workspace, organization);
  }

  private put(path: string, workspace?: string, organization?: string) {
    return this.request('PUT', path, {}, workspace, organization);
  }

  private async request(
    method: string, path: string, json?: unknown,
    workspace?: string, organization?: string, retryOnAuth = true,
  ): Promise<any> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.token) headers.Authorization = `Bearer ${this.token}`;
    if (workspace) headers.Workspace = workspace;
    if (organization) headers.Organization = organization;

    const res = await fetch(`${this.apiBase}${path}`, {
      method, headers, body: json === undefined ? undefined : JSON.stringify(json),
    });
    const text = await res.text();

    // The management-API JWT is short-lived; on expiry, re-login once and retry.
    if (res.status === 401 && retryOnAuth) {
      await this.login();
      return this.request(method, path, json, workspace, organization, false);
    }

    if (!res.ok) throw new Error(`HTTP ${res.status} for ${path}: ${text}`);
    const parsed = text ? JSON.parse(text) : {};
    if (parsed.success === false) throw new Error(`FeatBit API error for ${path}: ${text}`);
    return parsed;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
