import { Request, Response } from 'express';
import { Logger } from 'pino';

import Command from '../Command';

import { SlashCommandPayload } from '@Lib/slackApi/types/SlashCommand';

const fakeLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
} as unknown as Logger;

const genRequest = (body: Record<string, any>): Request => ({ body, log: fakeLogger } as Request);

const genCommandPayload = (overrides: Partial<SlashCommandPayload>): SlashCommandPayload => ({
  token: overrides?.token ?? 'blah',
  team_id: overrides?.team_id ?? 'blah',
  team_domain: overrides?.team_domain ?? 'blah',
  channel_id: overrides?.channel_id ?? 'blah',
  channel_name: overrides?.channel_name ?? 'blah',
  user_id: overrides?.user_id ?? 'blah',
  user_name: overrides?.user_name ?? 'blah',
  command: overrides?.command ?? 'blah',
  text: overrides?.text ?? 'blah',
  response_url: overrides?.response_url ?? 'blah',
  trigger_id: overrides?.trigger_id ?? 'blah',
  api_app_id: overrides?.api_app_id ?? 'blah',
  enterprise_id: overrides?.enterprise_id ?? 'blah',
  enterprise_name: overrides?.enterprise_name ?? 'blah',
});

describe('Command class', () => {
  describe('When the command matcher matches the slash command payload', () => {
    test('next function should not be called', async () => {
      const command = new Command(
        'test-command',
        /^test-command/,
        async () => { },
      );
      const request = genRequest(genCommandPayload({ text: 'test-command' }));
      const statusStub = jest.fn().mockReturnValue({ json: jest.fn() });
      const response = { status: statusStub } as unknown as Response;
      const nextFn = jest.fn();
      await command.requestHandler(request, response, nextFn);
      expect(nextFn).not.toHaveBeenCalled();
    });
  });

  describe('When the command matcher does not match the slash command payload', () => {
    test('next function should be called without error', async () => {
      const command = new Command(
        'test-command',
        /^test-command/,
        async () => { },
      );
      const request = genRequest(genCommandPayload({ text: 'hello world' }));
      const response = {} as Response;
      const nextFn = jest.fn();
      await command.requestHandler(request, response, nextFn);
      expect(nextFn).toHaveBeenCalledWith();
    });

    test('response status should not be set', async () => {
      const command = new Command(
        'test-command',
        /^test-command/,
        async () => { },
      );
      const request = genRequest(genCommandPayload({ text: 'hello world' }));
      const statusStub = jest.fn();
      const response = { status: statusStub } as unknown as Response;
      await command.requestHandler(request, response, jest.fn());
      expect(statusStub).not.toHaveBeenCalled();
    });

    test('the command handler should not be called', async () => {
      const handlerStub = jest.fn();
      const command = new Command(
        'test-command',
        /^test-command/,
        handlerStub,
      );
      const request = genRequest(genCommandPayload({ text: 'hello world' }));
      const response = {} as Response;
      await command.requestHandler(request, response, jest.fn());
      expect(handlerStub).not.toHaveBeenCalled();
    });
  });
});
