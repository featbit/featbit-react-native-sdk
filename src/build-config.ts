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
    // Pass the resolved logger: when the app supplies no logger, options.logger is undefined and
    // ReactNativeStore would otherwise NPE on its first debug/error log path.
    store = new ReactNativeStore({ ...options, logger });
  }

  return {
    ...config,
    options: { ...options, logger, store },
    platform: new ReactNativePlatform({ ...options, logger }),
  };
}