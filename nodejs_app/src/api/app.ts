import express, { ErrorRequestHandler } from 'express';

import commandsRouter from './commands/commands.router';
import interactionsRouter from './interactions/interactions.router';
import { verifySlackMessage } from './middlewares/verifySlackMessages';
import { parseInboundRequest } from './middlewares/parseInboundRequest';
import { attachLogger } from './middlewares/attachLogger';

export const app = express();

app.use(parseInboundRequest());
app.use(attachLogger);
app.use(verifySlackMessage);

app.use(commandsRouter);
app.use(interactionsRouter);
// eslint-disable-next-line
app.use(((err, req, res, next) => {
  console.log('------------ err =>', err);
  throw err;
}) as ErrorRequestHandler);
