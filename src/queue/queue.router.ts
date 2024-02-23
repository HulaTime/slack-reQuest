import { RequestHandler, Router } from 'express';

import QueueDataMapper from '../../datamappers/Queue';

import QueueController from './queue.controller';

const router = Router();

type ErrorDetails = {
  missingFields?: string[];
  format?: Record<string, string>;
}

const validateSlashCommandRequest: RequestHandler = (req, res, next): void => {
  try {
    const { body } = req;
    const requiredFields = ['text', 'user_id'];
    const errorDetails: ErrorDetails = {};
    requiredFields.forEach(field => {
      if (!body[field]) {
        errorDetails.missingFields ? 
          errorDetails.missingFields.push(field) :
          errorDetails.missingFields = [field];
      } else if (typeof body[field] !== 'string') {
        errorDetails.format ? errorDetails.format[field] = 'Should be type string' : errorDetails.format = { [field]: 'Should be type string' };
      }
    });
    if (errorDetails.missingFields || errorDetails.format) {
      req.log.info({ errorDetails }, 'Slash Command failed body validation');
      res.status(400).json({ message: 'Bad Request', errorDetails });
    } else {
      next();
    }
  } catch (err) {
    req.log.error({ err }, 'An unexpected error occurred during validation of inbound slash command');
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

router.post('/queues', validateSlashCommandRequest, async (req, res, next) => {
  try {
    const { body: { text, user_id }, log: logger } = req;
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

