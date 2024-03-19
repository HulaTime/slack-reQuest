import { Router } from 'express';

import InteractionsController from './interactions.controller';

const router = Router();

router.post('/interactions', async (req, res, next) => {
  try {
    const { body, log: logger } = req;
    logger.info({ body }, 'Inbound request to interactions endpoint');

    const controller = new InteractionsController(req, logger);
    await controller.execute();

    res.status(201).end();
  } catch (err) {
    req.log.error({ err }, 'Failed to process create queue request');
    next(err);
  }
});

export default router;

