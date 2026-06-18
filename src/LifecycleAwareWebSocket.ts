import {
  IWebSocketWithEvents,
  IWebSocketConfig,
  IOptions,
  ILogger,
  IUser,
  BrowserWebSocket,
} from "@featbit/react-client-sdk";
import { AppState, AppStateStatus, NativeEventSubscription } from "react-native";
import { LifecycleController } from "./LifecycleController";
import ConditionalNetInfo from "./ConditionalNetInfo";

const DEFAULT_BACKGROUND_GRACE_MS = 20_000;

// The SDK's EventEmitter implementation is not part of its public API, so derive the
// emitter's type from the (public) `emitter` field on a BrowserWebSocket instance.
type IEventEmitter = InstanceType<typeof BrowserWebSocket>['emitter'];

/**
 * An `IWebSocketWithEvents` that wraps the SDK's `BrowserWebSocket` and drives it from React
 * Native app-lifecycle (`AppState`) and connectivity (`NetInfo`, optional) signals.
 *
 * In streaming mode the underlying socket is dropped shortly after the app backgrounds or goes
 * offline, and re-established — with an immediate resync — on foreground / when connectivity
 * returns. Brief app-switches and network blips are debounced by a grace period (see
 * {@link LifecycleController}). Signals default to foreground + online, so if neither `AppState`
 * nor `NetInfo` ever report otherwise this behaves exactly like `BrowserWebSocket`.
 *
 * Why: WebSockets don't survive iOS background suspension or Android doze, and the OS may never
 * surface a clean `close`. The default transport then keeps firing pings into a dead socket and,
 * on resume, walks a blind reconnect-backoff schedule while serving stale flags. See
 * featbit/featbit-react-native-sdk#4.
 *
 * Implementation note: `BrowserWebSocket.close()` permanently sets an internal `closed` flag that
 * `connect()` never resets, so a paused instance cannot be reconnected. We therefore drop the
 * inner socket on pause and build a fresh one on resume. To keep the data synchronizer's event
 * listeners alive across that swap, we reuse a single emitter instance — captured from the first
 * inner socket and passed back into every inner socket via `config({ emitter })` (the SDK's
 * `EventEmitter` is not part of the public API, so we borrow the one it already created).
 */
export default class LifecycleAwareWebSocket implements IWebSocketWithEvents {
  private readonly emitter: IEventEmitter;
  private inner: InstanceType<typeof BrowserWebSocket>;
  private cfg?: IWebSocketConfig;
  private readonly logger?: ILogger;

  private started = false; // the data synchronizer has called connect()
  private readonly controller: LifecycleController;
  private appStateSub?: NativeEventSubscription;
  private netInfoUnsub?: () => void;

  constructor(options: IOptions) {
    this.logger = options.logger;
    this.inner = new BrowserWebSocket();
    this.emitter = this.inner.emitter;

    const graceMs =
      (options as { backgroundGracePeriod?: number }).backgroundGracePeriod ??
      DEFAULT_BACKGROUND_GRACE_MS;
    this.controller = new LifecycleController(
      graceMs,
      () => this.pause(),
      () => this.resume(),
    );

    this.appStateSub = AppState.addEventListener('change', (s: AppStateStatus) => {
      // 'active' = foreground; 'background' and (iOS-only) 'inactive' = not foreground.
      this.controller.onForegroundChanged(s === 'active');
    });
    this.netInfoUnsub = ConditionalNetInfo.addEventListener((state) => {
      // Treat unknown (null) as online; only an explicit `false` counts as offline.
      this.controller.onNetworkChanged(state.isConnected !== false);
    });
  }

  // --- IWebSocket ---------------------------------------------------------

  config(param: IWebSocketConfig): void {
    this.cfg = param;
    // Always retain the shared emitter so listeners survive an inner-socket swap.
    this.inner.config({ ...param, emitter: this.emitter });
  }

  identify(user: IUser): boolean {
    if (this.cfg) {
      this.cfg = { ...this.cfg, user };
    }
    return this.inner.identify(user);
  }

  connect(): void {
    this.started = true;
    if (this.controller.isActive) {
      this.inner.connect();
    } else {
      this.logger?.debug('lifecycle: connect deferred until foreground/online');
    }
  }

  close(): void {
    // Terminal close from the data synchronizer.
    this.started = false;
    this.appStateSub?.remove();
    this.netInfoUnsub?.();
    this.controller.dispose();
    this.inner.close();
  }

  // --- lifecycle pause / resume ------------------------------------------

  private pause(): void {
    if (!this.started) {
      return;
    }
    this.logger?.info('lifecycle: pausing stream (app backgrounded/offline)');
    this.inner.close(); // poisons this instance; resume() builds a fresh one
  }

  private resume(): void {
    if (!this.started) {
      return;
    }
    this.logger?.info('lifecycle: resuming stream (foreground/online)');
    this.inner = new BrowserWebSocket();
    if (this.cfg) {
      this.inner.config({ ...this.cfg, emitter: this.emitter });
    }
    this.inner.connect(); // the open handler issues an immediate data-sync
  }

  // --- IEventEmitter (delegate to the shared emitter) --------------------

  on(event: string | symbol, h: (...a: any[]) => void, c?: any): this {
    this.emitter.on(event, h, c);
    return this;
  }
  addListener(event: string | symbol, h: (...a: any[]) => void, c?: any): this {
    this.emitter.addListener(event, h, c);
    return this;
  }
  once(event: string | symbol, h: (...a: any[]) => void, c?: any): this {
    this.emitter.once(event, h, c);
    return this;
  }
  off(event: string | symbol, h: (...a: any[]) => void, c?: any): this {
    this.emitter.off(event, h, c);
    return this;
  }
  removeListener(event: string | symbol, h: (...a: any[]) => void, c?: any): this {
    this.emitter.removeListener(event, h, c);
    return this;
  }
  removeAllListeners(event?: string | symbol): this {
    this.emitter.removeAllListeners(event);
    return this;
  }
  listeners(event: string | symbol): Function[] {
    return this.emitter.listeners(event);
  }
  emit(event: string | symbol, ...args: any[]): this {
    this.emitter.emit(event, ...args);
    return this;
  }
  listenerCount(event: string | symbol): number {
    return this.emitter.listenerCount(event);
  }
  prependListener(event: string | symbol, h: (...a: any[]) => void, c?: any): this {
    this.emitter.prependListener(event, h, c);
    return this;
  }
  prependOnceListener(event: string | symbol, h: (...a: any[]) => void, c?: any): this {
    this.emitter.prependOnceListener(event, h, c);
    return this;
  }
  eventNames(): (string | symbol)[] {
    return this.emitter.eventNames();
  }
  maybeReportError(error: any): this {
    this.emitter.maybeReportError(error);
    return this;
  }
}
