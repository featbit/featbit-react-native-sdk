/* eslint-disable import/no-mutable-exports,global-require */

/**
 * NetInfo (`@react-native-community/netinfo`) is an optional native dependency used by
 * lifecycle-aware streaming to also pause on network loss and resume on reconnect.
 *
 * It is intentionally not a hard dependency (mirroring how `ConditionalAsyncStorage` treats
 * async-storage): if the package isn't installed we fall back to a stub that never reports
 * offline, so streaming is still driven by `AppState` (foreground/background) alone — which
 * already covers the dominant case of iOS/Android background suspension.
 *
 * To enable network-aware behaviour, add the dependency to your app and re-run pod install:
 *   npm install @react-native-community/netinfo
 */
let ConditionalNetInfo: {
  addEventListener: (listener: (state: { isConnected: boolean | null }) => void) => () => void;
};

try {
  ConditionalNetInfo = require('@react-native-community/netinfo').default;
} catch (e) {
  ConditionalNetInfo = {
    // No-op: returns an unsubscribe function and never reports a connectivity change.
    addEventListener: (_listener) => () => {},
  };
}

export default ConditionalNetInfo;
