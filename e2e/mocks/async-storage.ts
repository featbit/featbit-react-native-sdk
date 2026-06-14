/**
 * In-memory AsyncStorage for the Node-based e2e. The real
 * `@react-native-async-storage/async-storage` is installed (so the SDK's `ConditionalAsyncStorage`
 * loads it instead of its fallback), but it requires a React Native or browser environment and
 * throws `window is not defined` under plain Node. This mock provides the small surface the SDK
 * uses (`getItem` / `setItem` / `removeItem`).
 */
const store = new Map<string, string>();

export default {
  getItem: (key: string): Promise<string | null> =>
    Promise.resolve(store.has(key) ? (store.get(key) as string) : null),
  setItem: (key: string, value: string): Promise<void> => {
    store.set(key, value);
    return Promise.resolve();
  },
  removeItem: (key: string): Promise<void> => {
    store.delete(key);
    return Promise.resolve();
  },
};
