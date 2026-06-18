/**
 * A minimal, controllable stand-in for `react-native` used by the Node-based e2e suite.
 *
 * The real `react-native` package can't be imported in a plain Node process, but the only
 * platform primitives the SDK touches are `AppState` (lifecycle-aware streaming) and `Platform`
 * (device info). This mock implements just those, and exposes `__emitAppState(...)` so a test can
 * drive real foreground/background transitions against a live server.
 */

export type AppStateStatus = 'active' | 'background' | 'inactive';

type Listener = (state: AppStateStatus) => void;

const listeners: Listener[] = [];

export const AppState = {
  currentState: 'active' as AppStateStatus,
  addEventListener(_event: 'change', listener: Listener) {
    listeners.push(listener);
    return {
      remove() {
        const i = listeners.indexOf(listener);
        if (i >= 0) listeners.splice(i, 1);
      },
    };
  },
};

/** Test hook: dispatch an AppState change to all current listeners. */
export function __emitAppState(state: AppStateStatus): void {
  AppState.currentState = state;
  // copy to tolerate listeners that unsubscribe during dispatch
  [...listeners].forEach((l) => l(state));
}

export type PlatformAndroidStatic = {
  OS: 'android';
  Version: number;
  constants: { Manufacturer: string; Model: string };
};

export const Platform = {
  OS: 'android' as const,
  Version: 34,
  constants: { Manufacturer: 'e2e', Model: 'node' },
  select<T>(spec: { android?: T; ios?: T; default?: T }): T | undefined {
    return 'android' in spec ? spec.android : spec.default;
  },
};

/** NativeEventSubscription shape referenced by the SDK's type imports. */
export type NativeEventSubscription = { remove: () => void };
