import {
  IOptions,
  ILogger,
  IStoreDataStorage,
  CurrentUserStorageKey,
  StoreStorageKey,
  serializeUser, BaseStore, hashSerializeUser
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

  // Keyed by the hashed full serialized user (keyId + name + customizedProperties),
  // not just keyId. Two identify() calls with the same keyId but different
  // attributes (e.g. a custom "region" property changing) must not collide
  // on the same cached entry, or a stale evaluation from the previous
  // attribute set gets served after the flag's sync protocol treats the
  // client as already up to date (see upstream featbit-js-client-sdk#fbcd618,
  // which fixed the same issue for LocalStorageStore/InMemoryStore via a
  // hashSerializeUser()-keyed cache).
  private async storageKeyForCurrentUser(): Promise<string> {
    const userHash = await hashSerializeUser(this._user);
    return `${StoreStorageKey}-${userHash}`;
  }

  protected override async dumpStoreToStorage(): Promise<void> {
    const storageKey = await this.storageKeyForCurrentUser();
    await this.set(storageKey, JSON.stringify(this.store));
  }

  protected override async loadStoreFromStorage(): Promise<void> {
    const storageKey = await this.storageKeyForCurrentUser();
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
