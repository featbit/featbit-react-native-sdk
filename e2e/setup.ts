/**
 * e2e environment setup: the SDK's streaming transport (`BrowserWebSocket`) uses the global
 * `WebSocket`, which Node doesn't provide. Polyfill it with `ws` so streaming works in the
 * Node-based e2e. `fetch` (used by polling/events) is built into Node 18+.
 */
import WebSocket from 'ws';

if (typeof (globalThis as { WebSocket?: unknown }).WebSocket === 'undefined') {
  (globalThis as { WebSocket?: unknown }).WebSocket = WebSocket;
}
