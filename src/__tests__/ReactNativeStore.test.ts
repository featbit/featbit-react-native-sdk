jest.mock('../ConditionalAsyncStorage', () => {
  const map = new Map<string, string>();
  return {
    __esModule: true,
    default: {
      getItem: jest.fn((key: string) => Promise.resolve(map.has(key) ? (map.get(key) as string) : null)),
      setItem: jest.fn((key: string, value: string) => {
        map.set(key, value);
        return Promise.resolve();
      }),
      removeItem: jest.fn((key: string) => {
        map.delete(key);
        return Promise.resolve();
      }),
    },
  };
});

import ReactNativeStore from '../ReactNativeStore';

const FLAGS_KIND = { namespace: 'flags' };

function buildLogger() {
  return { debug: jest.fn(), error: jest.fn(), warn: jest.fn(), info: jest.fn() };
}

// Regression coverage for: same keyId re-identifying with different
// customizedProperties (e.g. a "region" attribute changing between app
// sessions) must not be served a stale evaluation cached under the
// previous attribute set. Storage was previously keyed by keyId alone.
describe('ReactNativeStore — storage key scoping', () => {
  it('does not serve a previous session\'s cached flags when the same keyId re-identifies with different customizedProperties', async () => {
    const store = new ReactNativeStore({ logger: buildLogger() } as any);

    // Session 1: keyId 'user-1', region=US — cache a flag value.
    await store.identify({
      keyId: 'user-1',
      customizedProperties: [{ name: 'region', value: 'US' }],
    } as any);
    await store.upsert(FLAGS_KIND, {
      key: 'my-flag',
      version: 1,
      origin: 'Remote',
      variation: 'email-only',
    } as any);
    expect(store.get(FLAGS_KIND, 'my-flag')?.variation).toBe('email-only');

    // Session 2: SAME keyId, DIFFERENT region — re-identify.
    await store.identify({
      keyId: 'user-1',
      customizedProperties: [{ name: 'region', value: 'IN' }],
    } as any);

    // Must NOT still see the US-cached value.
    expect(store.get(FLAGS_KIND, 'my-flag')).toBeNull();
    expect(store.version).toBe(0);
  });

  it('still serves cached flags across app restarts for the exact same user context', async () => {
    const storeA = new ReactNativeStore({ logger: buildLogger() } as any);
    await storeA.identify({
      keyId: 'user-2',
      customizedProperties: [{ name: 'region', value: 'US' }],
    } as any);
    await storeA.upsert(FLAGS_KIND, {
      key: 'my-flag',
      version: 1,
      origin: 'Remote',
      variation: 'email-only',
    } as any);

    // Simulate a fresh app restart: new store instance, identical user context.
    const storeB = new ReactNativeStore({ logger: buildLogger() } as any);
    await storeB.identify({
      keyId: 'user-2',
      customizedProperties: [{ name: 'region', value: 'US' }],
    } as any);

    expect(storeB.get(FLAGS_KIND, 'my-flag')?.variation).toBe('email-only');
  });

  it('scopes storage independently per keyId even with identical customizedProperties', async () => {
    const storeA = new ReactNativeStore({ logger: buildLogger() } as any);
    await storeA.identify({
      keyId: 'user-a',
      customizedProperties: [{ name: 'region', value: 'US' }],
    } as any);
    await storeA.upsert(FLAGS_KIND, {
      key: 'my-flag',
      version: 1,
      origin: 'Remote',
      variation: 'email-only',
    } as any);

    const storeB = new ReactNativeStore({ logger: buildLogger() } as any);
    await storeB.identify({
      keyId: 'user-b',
      customizedProperties: [{ name: 'region', value: 'US' }],
    } as any);

    expect(storeB.get(FLAGS_KIND, 'my-flag')).toBeNull();
  });
});
