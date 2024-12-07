export class TestSlashCommandPayload {
  token: string = 'deprecated by slack, authorisation is done by signed secrets now';

  team_id: string = '123456';

  team_domain: string = 'team_domain';

  channel_id: string = '234567';

  channel_name: string = 'channel';

  user_name: string = 'test-user';

  response_url: string = 'https://response-url.com';

  trigger_id: string = '4567';

  user_id: string;

  command: string;

  text: string = '';

  constructor(command: string, text: string, user_id: string) {
    this.command = command;
    this.text = text;
    this.user_id = user_id;
  }
}

