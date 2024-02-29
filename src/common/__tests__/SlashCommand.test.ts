import { pino } from 'pino';

import SlashCommand, { SlackSlashCommandPayload } from '../SlashCommand';

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  fatal: jest.fn(),
  warn: jest.fn(),
  trace: jest.fn(),
};

jest.mock('pino', () => ({ pino: jest.fn(() => mockLogger) }));

const testSlashCommand: SlackSlashCommandPayload = {
  token: 'deprecated_field',
  team_id: '1234',
  team_domain: '5678',
  channel_id: '3456',
  channel_name: 'my_channel',
  user_id: '9876',
  user_name: 'tarquin',
  command: 'command',
  text: 'command foo bar',
  response_url: 'http://127.0.0.1:3000/response',
  trigger_id: '452',
  api_app_id: 'optional_app_id',
  enterprise_id: 'optional_enterprise_id',
  enterprise_name: 'optional_enterprise_name',
};

const logger = pino();

describe('SlashCommand', () => {
  test('it should successfully instantiate when supplied a valid payload', () => {
    new SlashCommand(testSlashCommand, logger);
  });

  test('it should throw an error if instantiated with a bad payload', () => {
    expect(() => new SlashCommand({} as SlackSlashCommandPayload, logger)).toThrow(new Error('Invalid Slash Command'));
  });

  describe('#getCommand', () => {
    test('should return the command from the supplied payload', () => {
      const slashCommand = new SlashCommand(testSlashCommand, logger);
      expect(slashCommand.getCommand()).toEqual(testSlashCommand.command);
    });
  });

  describe('#getCommandArgs', () => {
    test('should return everything from the payload text, after the first word (command)', () => {
      const slashCommand = new SlashCommand(testSlashCommand, logger);
      expect(slashCommand.getCommandArgs()).toEqual('foo bar');
    });
  });
});
