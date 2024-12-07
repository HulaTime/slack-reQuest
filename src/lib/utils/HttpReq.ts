import { ILogger } from '@Common/logger/ILogger';

export default class HttpReq {
  headers: Record<string, string> = {};

  body?: Record<string, unknown>;

  constructor(private readonly url: string, private readonly logger: ILogger) { }

  setBody(body: Record<string, unknown>): this {
    this.body = body;
    return this;
  }

  setHeader(name: string, value: string): this {
    this.headers[name] = value;
    return this;
  }

  async post<ResT>(): Promise<ResT> {
    try {
      const result = await fetch(this.url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...this.headers,
        },
        body: JSON.stringify(this.body),
      });
      const responseBody = await result.json();
      if (!result.ok) {
        this.logger.error('Failed to complete post request', {
          status: result.status, url: this.url, body: this.body, responseBody,
        });
      }
      this.logger.info('Successfully completed post request', { url: this.url, responseBody });
      return responseBody as ResT;
    } catch (err) {
      this.logger.error('An error occurred while making a post request', { url: this.url, body: this.body, err });
      throw err;
    }
  }
}
