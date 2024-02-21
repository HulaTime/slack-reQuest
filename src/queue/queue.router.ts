import { Router } from 'express';

import QueueDataMapper from '../../datamappers/Queue';

import QueueController from './queue.controller';

const router = Router();

router.post('/queues', async (req, res, next) => {
  try {
    const { body: { text, user_id }, log: logger } = req;
    console.log('--------------------------> req:', req.body);
    req.log.info({ text, user_id }, 'Received create queue request');
    const controller = new QueueController(req.log, new QueueDataMapper(logger));
    const queue = await controller.createQueue(text, user_id);
    res.status(201).json(queue);
  } catch (err) {
    req.log.error({ err }, 'Failed to process create queue request');
    next(err);
  }
});

export default router;

