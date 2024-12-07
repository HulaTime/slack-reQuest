import { Router } from 'express';
import { container } from 'tsyringe';
import { ZodError } from 'zod';

import { SlashCommand } from '@Lib/slack/slashCommands';
import { CommandControllerToken } from '@Ioc/container';

const router = Router();

router.post('/commands', async (req, res, next) => {
  try {
    const { body, log: logger } = req;
    req.log.info('Received slack command', body);
    const command = SlashCommand.Validate(logger, body);
    const slashCommand = new SlashCommand(command);
    const controller = container.resolve(CommandControllerToken)(slashCommand);
    const response = await controller.execute();
    res.status(200).json(response);
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(400).json({ message: 'Bad Request' });
      return;
    }
    req.log.error('Failed to process create queue request', { err });
    next(err);
  }
});

export default router;

