export interface IHttpWrapper {
  methodEndpointHandler(): Promise<void>;
}
