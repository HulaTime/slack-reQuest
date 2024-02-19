import { Router } from 'express';

import QueueDataMapper from '../../datamappers/Queue';

import QueueController from './queue.controller';

const router = Router();

router.post('/queues', async (req, res, next) => {
  try {
    const { body, log: logger } = req;
    req.log.info({ body }, 'Received create queue request');
    const controller = new QueueController(req.log, new QueueDataMapper(logger));
    await controller.createQueue(body.text);
    res.status(200).end();
  } catch (err) {
    req.log.error({ err }, 'Failed to process create queue request');
    next(err);
  }
});

export default router;

