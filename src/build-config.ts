import ReactNativeStore from "./ReactNativeStore";
import { ProviderConfig, BasicLogger, SafeLogger } from "@featbit/react-client-sdk";
import ReactNativePlatform from "./ReactNativePlatform";

export function buildConfig(config: ProviderConfig, debug: boolean = false): ProviderConfig {
  const { options, reactOptions } = config;
  const fallbackLogger = new BasicLogger({
    level: debug ? 'debug' : 'none',
    destination: console.log
  });

  if (options === undefined) {
    throw new Error('options is required');
  }

  const logger = options.logger ? new SafeLogger(options.logger, fallbackLogger) : fallbackLogger;

  let { store } = config.options!;
  if (!store) {
    store = new ReactNativeStore(options);
  }

  return {
    ...config,
    options: { ...options, logger, store },
    platform: new ReactNativePlatform({ ...options, logger }),
  };
}