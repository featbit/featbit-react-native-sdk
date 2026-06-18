import { IPlatform, IInfo, IRequests, IWebSocketWithEvents, IOptions, BrowserRequests } from "@featbit/react-client-sdk";
import { ReactNativeInfo } from "./ReactNativeInfo";
import LifecycleAwareWebSocket from "./LifecycleAwareWebSocket";

export default class ReactNativePlatform implements IPlatform {
  info: IInfo = new ReactNativeInfo();

  requests: IRequests;
  webSocket: IWebSocketWithEvents;

  constructor(options: IOptions) {
    this.requests = new BrowserRequests();
    // Lifecycle-aware transport: pauses the stream on background/offline and resumes
    // (with an immediate resync) on foreground/online. Defaults to always-on if the
    // app never backgrounds and never reports a network change. Inert in polling mode.
    this.webSocket = new LifecycleAwareWebSocket(options);
  }
}