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

  protected override async dumpStoreToStorage(): Promise<void> {
    const storageKey = `${StoreStorageKey}-${this._user.keyId}`;

    await this.set(storageKey, JSON.stringify(this.store));
  }

  protected override async loadStoreFromStorage(): Promise<void> {
    const storageKey = `${StoreStorageKey}-${this._user.keyId}`;
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