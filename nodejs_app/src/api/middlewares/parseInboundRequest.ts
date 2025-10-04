import {
  RequestHandler, json, urlencoded, Request, Response,
} from 'express';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  module Express {
    interface Request {
      rawBody?: string;
    }
  }
}

const parseConfig = {
  verify: (req: Request, _: Response, buff: Buffer): void => {
    req.rawBody = buff.toString();
  },
};

export const parseInboundRequest = (): RequestHandler[] => [
  json(parseConfig),
  urlencoded(parseConfig),
];
