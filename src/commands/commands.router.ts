import { RequestHandler, Router } from 'express';

import QueueDataMapper from '../datamappers/QueueDatamapper';
import SlashCommand from '../common/SlashCommand';

import CommandsController from './commands.controller';

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

export enum QueueTypes {
  directRequest = 'Direct Request',
  codeReview = 'Code Review',
  release = 'Release'
};

router.post('/queues', validateSlashCommandRequest, async (req, res, next) => {
  try {
    const { body, log: logger } = req;
    req.log.info({ ...body }, 'Received create queue request');
    const slashCommand = new SlashCommand(body, logger);
    const controller = new CommandsController(slashCommand, logger, new QueueDataMapper(logger));
    const response = controller.execute();
    res.status(201).json(response);
  } catch (err) {
    req.log.error({ err }, 'Failed to process create queue request');
    next(err);
  }
});

export default router;

