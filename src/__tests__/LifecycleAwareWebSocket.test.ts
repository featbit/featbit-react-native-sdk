// --- Mocks (hoisted by jest; out-of-scope refs must be prefixed `mock`) ---------

const mockAppStateListeners: Array<(s: string) => void> = [];
const mockSubscriptionRemove = jest.fn();

jest.mock('react-native', () => ({
  AppState: {
    addEventListener: (_event: string, cb: (s: string) => void) => {
      mockAppStateListeners.push(cb);
      return { remove: mockSubscriptionRemove };
    },
  },
}));

// A minimal emitter matching the subset of IEventEmitter the wrapper delegates/uses.
class MockEmitter {
  private handlers: Record<string, Function[]> = {};
  addListener(event: string, h: Function) {
    (this.handlers[event] ||= []).push(h);
    return this;
  }
  on(event: string, h: Function) {
    return this.addListener(event, h);
  }
  emit(event: string, ...args: any[]) {
    (this.handlers[event] || []).forEach((h) => h(...args));
    return this;
  }
}

// Fake BrowserWebSocket that records instances and replicates the one behaviour the
// wrapper depends on: config({ emitter }) swaps in the provided emitter.
const mockSockets: MockBrowserWebSocket[] = [];
class MockBrowserWebSocket {
  emitter: MockEmitter = new MockEmitter();
  config = jest.fn((param: any) => {
    if (param?.emitter) {
      this.emitter = param.emitter;
    }
  });
  connect = jest.fn();
  close = jest.fn();
  identify = jest.fn(() => true);
  constructor() {
    mockSockets.push(this);
  }
}

jest.mock('@featbit/react-client-sdk', () => ({
  BrowserWebSocket: MockBrowserWebSocket,
}));

// -------------------------------------------------------------------------------

import LifecycleAwareWebSocket from '../LifecycleAwareWebSocket';

const GRACE = 20_000;
const fireAppState = (s: string) => mockAppStateListeners.forEach((cb) => cb(s));
const baseConfig = () => ({
  sdkKey: 'k',
  streamingUri: 'wss://example',
  pingInterval: 18_000,
  user: { keyId: 'u1', name: 'u1', customizedProperties: [] },
  logger: undefined,
  getStoreTimestamp: () => 0,
});

const newWs = () =>
  new LifecycleAwareWebSocket({ backgroundGracePeriod: GRACE } as any);

beforeEach(() => {
  jest.useFakeTimers();
  mockAppStateListeners.length = 0;
  mockSockets.length = 0;
  mockSubscriptionRemove.mockClear();
});

afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
});

describe('LifecycleAwareWebSocket', () => {
  it('connects the inner socket when active', () => {
    const ws = newWs();
    ws.config(baseConfig());
    ws.connect();

    expect(mockSockets).toHaveLength(1);
    expect(mockSockets[0].connect).toHaveBeenCalledTimes(1);
  });

  it('defers connect while backgrounded, then connects on foreground', () => {
    const ws = newWs();
    ws.config(baseConfig());

    fireAppState('background');
    jest.advanceTimersByTime(GRACE); // becomes inactive

    ws.connect(); // called while inactive -> deferred
    expect(mockSockets[0].connect).not.toHaveBeenCalled();

    fireAppState('active'); // resume
    // resume builds a fresh socket and connects it
    expect(mockSockets.length).toBeGreaterThanOrEqual(2);
    expect(mockSockets[mockSockets.length - 1].connect).toHaveBeenCalledTimes(1);
  });

  it('drops the socket on background and rebuilds a fresh one on foreground', () => {
    const ws = newWs();
    ws.config(baseConfig());
    ws.connect();
    expect(mockSockets).toHaveLength(1);

    fireAppState('background');
    jest.advanceTimersByTime(GRACE);
    expect(mockSockets[0].close).toHaveBeenCalledTimes(1);

    fireAppState('active');
    expect(mockSockets).toHaveLength(2); // a new inner socket
    expect(mockSockets[1].connect).toHaveBeenCalledTimes(1); // immediate resync
  });

  it('does not pause for a transient inactive within the grace period', () => {
    const ws = newWs();
    ws.config(baseConfig());
    ws.connect();

    fireAppState('inactive'); // iOS app-switcher glance
    jest.advanceTimersByTime(GRACE - 1);
    fireAppState('active');
    jest.advanceTimersByTime(GRACE);

    expect(mockSockets[0].close).not.toHaveBeenCalled();
    expect(mockSockets).toHaveLength(1);
  });

  it('preserves data-sync listeners across a pause/resume cycle', () => {
    const ws = newWs();
    ws.config(baseConfig());

    const received: any[] = [];
    ws.addListener('put', (e: any) => received.push(e)); // registered on the shared emitter
    ws.connect();

    // pause + resume -> a new inner socket configured with the SAME emitter
    fireAppState('background');
    jest.advanceTimersByTime(GRACE);
    fireAppState('active');

    const fresh = mockSockets[mockSockets.length - 1];
    // the fresh socket was configured with the original shared emitter
    expect(fresh.config).toHaveBeenCalled();

    // an event emitted by the fresh socket still reaches the original listener
    fresh.emitter.emit('put', { flag: 'x' });
    expect(received).toEqual([{ flag: 'x' }]);
  });

  it('close() tears down the AppState subscription and closes the socket', () => {
    const ws = newWs();
    ws.config(baseConfig());
    ws.connect();

    ws.close();
    expect(mockSubscriptionRemove).toHaveBeenCalledTimes(1);
    expect(mockSockets[0].close).toHaveBeenCalledTimes(1);

    // after close, lifecycle signals are inert (no new sockets)
    fireAppState('background');
    jest.advanceTimersByTime(GRACE);
    fireAppState('active');
    expect(mockSockets).toHaveLength(1);
  });
});
