import { randomUUID } from 'crypto';

import { Express } from 'express';
import supertest, { Response } from 'supertest';

import { SlackSlashCommandPayload } from '../../../src/lib/slack/messages/SlashCommand';

const slashCommandPayload = (command: string, text: string, userId: string): SlackSlashCommandPayload => ({
  token: 'token',
  team_id: 'team_id',
  team_domain: 'team_domain',
  channel_id: 'channel_id',
  channel_name: 'channel_name',
  user_name: 'user_name',
  response_url: 'response_url',
  trigger_id: 'trigger_id',
  command,
  text,
  user_id: userId,
});

export class UserRequest {
  app: Express;

  userId: string;

  constructor(app: Express, userId?: string) {
    this.app = app;
    this.userId = userId ?? randomUUID();
  }

  async sendCommand(command: string, text: string): Promise<Response> {
    return supertest(this.app)
      .post('/commands')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send(slashCommandPayload(command, text, this.userId));
  }
}

