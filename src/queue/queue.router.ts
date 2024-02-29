import { RequestHandler, Router } from 'express';

import QueueDataMapper from '../../datamappers/Queue';
import RadioButton from '../common/blocks/elements/RadioButton';
import OptionObject from '../common/compositionObjects/OptionObject';
import { PlainTextObject } from '../common/compositionObjects/TextObject';
import MessagePayload from '../common/MessagePayload';
import InputBlock from '../common/blocks/InputBlock';

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

type ParsedSlashCommand = { command: string; input: string };

const parseSlashCommand = (text: string): ParsedSlashCommand => {
  const [, command, input] = text.match(/^(\S+)\s(.+)$/) ?? [];
  return { command, input };
};

export enum QueueTypes {
  directRequest = 'Direct Request',
  codeReview = 'Code Review',
  release = 'Release'
};

router.post('/queues/initiate', validateSlashCommandRequest, async (req, res, next) => {
  try {
    const { body: { text, user_id }, log: logger } = req;
    req.log.info({ text, user_id }, 'Received create queue request');
    const controller = new QueueController(req.log, new QueueDataMapper(logger));
    const response = controller.buildSelectQueueTypeMessage();
    res.status(201).json(response);
  } catch (err) {
    req.log.error({ err }, 'Failed to process create queue request');
    next(err);
  }
});

router.post('/queues/create', validateSlashCommandRequest, async (req, res, next) => {
  try {
    const { body: { text, user_id }, log: logger } = req;
    req.log.info({ text, user_id }, 'Received create queue request');
    const controller = new QueueController(req.log, new QueueDataMapper(logger));
    const response = controller.buildSelectQueueTypeMessage();
    res.status(201).json(response);
  } catch (err) {
    req.log.error({ err }, 'Failed to process create queue request');
    next(err);
  }
});

export default router;

