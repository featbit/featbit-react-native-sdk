import { IPlatform, IInfo, IRequests, IWebSocketWithEvents, IOptions, BrowserRequests, BrowserWebSocket } from "@featbit/react-client-sdk";
import { ReactNativeInfo } from "./ReactNativeInfo";

export default class ReactNativePlatform implements IPlatform {
  info: IInfo = new ReactNativeInfo();

  requests: IRequests;
  webSocket: IWebSocketWithEvents;

  constructor(options: IOptions) {
    this.requests = new BrowserRequests();
    this.webSocket = new BrowserWebSocket();
  }
}