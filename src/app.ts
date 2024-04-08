import { randomUUID } from 'node:crypto';

import express from 'express';
import { pinoHttp } from 'pino-http';

import { LOG_LEVEL } from '../config/app.config';
import { APP_NAME, X_REQUEST_ID } from '../constants/app';

import commandsRouter from './commands/commands.router';
import interactionsRouter from './interactions/interactions.router';
import { verifySlackMessage } from './middlewares/verifySlackMessages';
import { parseInboundRequest } from './middlewares/parseInboundRequest';

export const app = express();

app.use(parseInboundRequest());
app.use(verifySlackMessage);
app.use(pinoHttp({
  name: APP_NAME,
  useLevel: LOG_LEVEL,
  genReqId: (req, res) => {
    const requestId = req.headers[X_REQUEST_ID] ?? randomUUID();
    res.setHeader(X_REQUEST_ID, requestId);
    return requestId;
  },
}));

app.use(commandsRouter);
app.use(interactionsRouter);

