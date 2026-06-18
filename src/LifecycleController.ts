/**
 * Drives a streaming connection from app-lifecycle and network signals: the connection is kept
 * "active" only while the app is foregrounded AND the network is available. Transitions to
 * inactive are debounced by `graceMs` so brief app-switches (e.g. the iOS app switcher, which
 * emits a transient `inactive` state) or momentary network blips don't tear the connection down.
 *
 * Signals default to active (foreground + online), so a controller whose hooks are never called
 * behaves exactly as an always-on connection. JS is single-threaded, so unlike the Kotlin
 * original this needs no mutex — every transition runs to completion before the next event.
 */
export class LifecycleController {
  private foreground = true;
  private online = true;
  private active = true;
  private pauseTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly graceMs: number,
    private readonly onPause: () => void,
    private readonly onResume: () => void,
  ) {}

  get isActive(): boolean {
    return this.active;
  }

  onForegroundChanged(value: boolean): void {
    this.foreground = value;
    this.reconcile();
  }

  onNetworkChanged(value: boolean): void {
    this.online = value;
    this.reconcile();
  }

  /** Cancels any pending pause and stops tracking. Safe to call multiple times. */
  dispose(): void {
    if (this.pauseTimer) {
      clearTimeout(this.pauseTimer);
      this.pauseTimer = null;
    }
  }

  private reconcile(): void {
    if (this.foreground && this.online) {
      // Became (or stayed) active: cancel any pending pause; resume if paused.
      if (this.pauseTimer) {
        clearTimeout(this.pauseTimer);
        this.pauseTimer = null;
      }
      if (!this.active) {
        this.active = true;
        this.onResume();
      }
    } else if (this.active && this.pauseTimer === null) {
      // Became inactive: pause after the grace period unless we become active again first.
      this.pauseTimer = setTimeout(() => {
        this.pauseTimer = null;
        if (!(this.foreground && this.online)) {
          this.active = false;
          this.onPause();
        }
      }, this.graceMs);
    }
  }
}
