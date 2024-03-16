import { Router } from 'express';

import { SlashCommand } from '../lib/slack/messages';

import CommandsController from './commands.controller';

const router = Router();

export enum QueueTypes {
  directRequest = 'Direct Request',
  codeReview = 'Code Review',
  release = 'Release'
};

router.post('/queues', async (req, res, next) => {
  try {
    const { body, log: logger } = req;
    req.log.info({ ...body }, 'Received slack command');
    const slashCommand = new SlashCommand(body, logger);
    const controller = new CommandsController(slashCommand, logger);
    const response = await controller.execute();
    res.status(201).json(response);
  } catch (err) {
    req.log.error({ err }, 'Failed to process create queue request');
    next(err);
  }
});

export default router;

