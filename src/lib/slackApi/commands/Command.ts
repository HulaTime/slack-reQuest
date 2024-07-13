import { Request, Response, NextFunction } from 'express';

import { SlashCommandPayload } from '../types/SlashCommand';

import { CommandHandler } from './ICommand';

export default class Command {
  constructor(
    private readonly name: string,
    private readonly matcher: RegExp,
    private readonly handler: CommandHandler,
  ) { }

  async requestHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { body, log: logger } = req;
    try {
      logger.debug({ ...body }, `Received a slash command, attempting to match on ${this.matcher}`);
      const isValid = this.isValidSlackSlashCommandPayload(body);
      if (!isValid) {
        logger.warn({ isValid, body }, 'Received invalid slash command payload');
        throw new Error('Invalid Slash Command');
      }
      const match = body.text.match(this.matcher);
      if (!match) {
        logger.debug(`Command handler ${this.name} did not match on the request`);
        next();
      } else {
        logger.debug(`Command handler ${this.name} matched successfully on the request`);
        const msgPayload = await this.handler(body.text, {
          userId: body.user_id,
          userName: body.user_name,
          channelId: body.channel_id,
          channelName: body.channel_name,
        });
        res.status(200).json(msgPayload);
      }
    } catch (err) {
      logger.error({ err }, 'Failed to handle a slash command');
      next(err);
    }
  };

  private isValidSlackSlashCommandPayload(payload: unknown): payload is SlashCommandPayload {
    const isObject = (obj: unknown): obj is Record<string, unknown> =>
      typeof obj === 'object' && obj !== null;

    const hasStringProperty = (obj: Record<string, unknown>, prop: string): boolean =>
      typeof obj[prop] === 'string';

    const hasOptionalStringProperty = (obj: Record<string, unknown>, prop: string): boolean =>
      obj[prop] === undefined || typeof obj[prop] === 'string';

    if (!isObject(payload)) {
      return false;
    }

    const requiredProps = ['token', 'team_id', 'team_domain', 'channel_id', 'channel_name', 'user_id', 'user_name', 'command', 'text', 'response_url', 'trigger_id'];
    const optionalProps = ['enterprise_id', 'enterprise_name', 'api_app_id'];

    for (const prop of requiredProps) {
      if (!hasStringProperty(payload, prop)) {
        return false;
      }
    }

    for (const prop of optionalProps) {
      if (!hasOptionalStringProperty(payload, prop)) {
        return false;
      }
    }

    return true;
  }
}
