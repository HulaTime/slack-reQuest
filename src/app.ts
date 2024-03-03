import { randomUUID } from 'node:crypto';

import express, { json as jsonParser, urlencoded } from 'express';
import { pinoHttp } from 'pino-http';

import { LOG_LEVEL } from '../config/app.config';

import commandsRouter from './commands/commands.router';
import interactionsRouter from './interactions/interactions.router';

export const app = express();

app.use(jsonParser());
app.use(urlencoded());
app.use(pinoHttp({
  useLevel: LOG_LEVEL,
  genReqId: (req, res) => {
    const requestId = req.headers['x-request-id'] ?? randomUUID();
    res.setHeader('x-request-id', requestId);
    return requestId;
  },
}));

app.use(commandsRouter);
app.use(interactionsRouter);

