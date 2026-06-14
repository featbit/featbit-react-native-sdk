import { FbClientBuilder, DataSyncModeEnum, IFbClient } from '@featbit/react-client-sdk';
import { buildConfig } from '../src/build-config';
import { FeatBitStack, SeedResult } from './FeatBitStack';
// Relative import resolves to the same module the SDK gets via the `react-native`
// moduleNameMapper, so listeners are shared and __emitAppState drives the real wrapper.
import { __emitAppState } from './mocks/react-native';

/**
 * Full-stack end-to-end tests: a real client built from the React Native SDK's `buildConfig`
 * (ReactNativePlatform + LifecycleAwareWebSocket + ReactNativeStore) driven against a real
 * FeatBit evaluation server stood up via Testcontainers in {@link FeatBitStack}.
 *
 * Gated by `FEATBIT_E2E=1` so the default unit-test pass never requires Docker — mirrors the
 * Fluent Health Android SDK's e2e gating. CI runs this on a Docker-capable runner.
 */

const ENABLED = process.env.FEATBIT_E2E === '1';
const describeE2E = ENABLED ? describe : describe.skip;

const GRACE_MS = 1000; // short grace so the lifecycle test runs fast

let stack: FeatBitStack;
let seed: SeedResult;

function buildClient(mode: DataSyncModeEnum): IFbClient {
  const evalBase = seed.evaluationBaseUrl;
  const config = buildConfig(
    {
      options: {
        sdkKey: seed.clientSecret,
        user: { keyId: 'e2e-user', name: 'e2e', customizedProperties: [] },
        dataSyncMode: mode,
        streamingUri: evalBase.replace(/^http/, 'ws'),
        pollingUri: evalBase,
        eventsUri: evalBase,
        pollingInterval: 1000,
        // consumed by LifecycleAwareWebSocket; keep short for the lifecycle test
        backgroundGracePeriod: GRACE_MS,
      } as any,
    },
    process.env.FEATBIT_E2E_DEBUG === '1',
  );
  return new FbClientBuilder(config.options).platform(config.platform).build();
}

describeE2E('FeatBit React Native SDK — e2e', () => {
  beforeAll(async () => {
    stack = new FeatBitStack();
    await stack.start();
    seed = await stack.seed();
  }, 600_000);

  afterAll(async () => {
    await stack?.close();
  }, 120_000);

  beforeEach(async () => {
    // each test starts from the seeded "on" state
    await stack.toggleFlag(true);
  });

  it('polling: evaluates the seeded flag, observes a server-side change, and identifies', async () => {
    const client = buildClient(DataSyncModeEnum.POLLING);
    try {
      await client.waitForInitialization();

      expect(client.boolVariation(seed.flagKey, false)).toBe(true);

      await stack.toggleFlag(false);
      const flipped = await awaitUntil(20_000, () => client.boolVariation(seed.flagKey, true) === false);
      expect(flipped).toBe(true);

      await expect(
        client.identify({ keyId: 'another-user', name: 'another', customizedProperties: [] }),
      ).resolves.not.toThrow();
    } finally {
      await client.close();
    }
  });

  it('streaming: receives a server-side change as a real-time push', async () => {
    const client = buildClient(DataSyncModeEnum.STREAMING);
    try {
      await client.waitForInitialization();
      expect(client.boolVariation(seed.flagKey, false)).toBe(true);

      await stack.toggleFlag(false);
      const flipped = await awaitUntil(15_000, () => client.boolVariation(seed.flagKey, true) === false);
      expect(flipped).toBe(true);
    } finally {
      await client.close();
    }
  });

  it('streaming + lifecycle: pauses while backgrounded and resyncs on foreground', async () => {
    const client = buildClient(DataSyncModeEnum.STREAMING);
    try {
      await client.waitForInitialization();
      expect(client.boolVariation(seed.flagKey, false)).toBe(true);

      // Background the app and wait past the grace period so the stream pauses.
      __emitAppState('background');
      await sleep(GRACE_MS + 750);

      // Flip the flag while paused; the SDK must NOT observe it.
      await stack.toggleFlag(false);
      const sawWhilePaused = await awaitUntil(3_000, () => client.boolVariation(seed.flagKey, true) === false);
      expect(sawWhilePaused).toBe(false);

      // Foreground: the wrapper rebuilds the socket and resyncs.
      __emitAppState('active');
      const resynced = await awaitUntil(15_000, () => client.boolVariation(seed.flagKey, true) === false);
      expect(resynced).toBe(true);
    } finally {
      await client.close();
    }
  });
});

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function awaitUntil(timeoutMs: number, predicate: () => boolean): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (predicate()) return true;
    await sleep(200);
  }
  return predicate();
}
