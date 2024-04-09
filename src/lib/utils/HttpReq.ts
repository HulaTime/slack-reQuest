import { Logger } from 'pino';

export default class HttpReq {
  body?: Record<string, unknown>;

  constructor(private readonly url: string, private readonly logger: Logger) { }

  setBody(body: Record<string, unknown>): this {
    this.body = body;
    return this;
  }

  async post(): Promise<void> {
    try {
      const result = await fetch(this.url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(this.body),
      });
      const responseBody = await result.json();
      if (!result.ok) {
        this.logger.error({
          status: result.status, url: this.url, body: this.body, responseBody,
        }, 'Failed to complete post request');
        return;
      }
      this.logger.info({ url: this.url, responseBody }, 'Successfully completed post request');
      return;
    } catch (err) {
      this.logger.error({ url: this.url, body: this.body, err }, 'An error occurred while making a post request');
      throw err;
    }
  }
}
