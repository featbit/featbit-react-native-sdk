import {
  IOptions,
  ILogger,
  IStoreDataStorage,
  CurrentUserStorageKey,
  StoreStorageKey,
  serializeUser, BaseStore
} from "@featbit/react-client-sdk";

import AsyncStorage from './ConditionalAsyncStorage';

export default class ReactNativeStore extends BaseStore {
  private logger: ILogger;

  constructor(options: IOptions) {
    super();
    this.logger = options.logger!;
  }

  /* eslint-disable class-methods-use-this */
  override close(): void {
    // This is a no-op.
  }

  override get description(): string {
    return 'local-storage-store'
  }

  protected override async saveUser(): Promise<void> {
    try {
      await this.set(CurrentUserStorageKey, serializeUser(this._user));
    } catch (error) {
      this.logger.debug(`Error saving user`);
    }
  }

  private async set(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      this.logger.debug(`Error saving AsyncStorage key: ${key}, value: ${value}, error: ${error}`);
    }
  }

  // Keyed by the full serialized user (keyId + name + customizedProperties),
  // not just keyId. Two identify() calls with the same keyId but different
  // attributes (e.g. a custom "region" property changing) must not collide
  // on the same cached entry, or a stale evaluation from the previous
  // attribute set gets served after the flag's sync protocol treats the
  // client as already up to date (see upstream featbit-js-client-sdk#fbcd618,
  // which fixed the same issue for LocalStorageStore/InMemoryStore via a
  // hashSerializeUser()-keyed cache). This SDK targets React Native's JS
  // engine (Hermes), which does not reliably provide the Web Crypto API
  // (crypto.subtle) used by that hash without an extra polyfill dependency,
  // so this uses the plain serializeUser() string directly instead — the
  // hash there is for key normalization, not a security requirement.
  private storageKeyForCurrentUser(): string {
    return `${StoreStorageKey}-${serializeUser(this._user)}`;
  }

  protected override async dumpStoreToStorage(): Promise<void> {
    const storageKey = this.storageKeyForCurrentUser();

    await this.set(storageKey, JSON.stringify(this.store));
  }

  protected override async loadStoreFromStorage(): Promise<void> {
    const storageKey = this.storageKeyForCurrentUser();
    const dataStoreStr = await AsyncStorage.getItem(storageKey);

    let store: IStoreDataStorage | null = null;

    try {
      if (dataStoreStr && dataStoreStr.trim().length > 0) {
        store = JSON.parse(dataStoreStr);
      }
    } catch (err) {
      this.logger.error(`error while loading local data store: ${storageKey}`, err);
    }

    if (!!store) {
      this.store = store;
    } else {
      this.store = {
        flags: {},
        version: 0
      };
    }
  }
}