import { Logger } from 'pino';

export type SlackSlashCommandPayload = {
  token: string;
  team_id: string;
  team_domain: string;
  channel_id: string;
  channel_name: string;
  user_id: string;
  user_name: string;
  command: string;
  text: string;
  response_url: string;
  trigger_id: string;
  api_app_id?: string; // Optional: present if the command is invoked in a workspace where your app is installed
  enterprise_id?: string; // Optional: present for Enterprise Grid workspaces
  enterprise_name?: string; // Optional: present for Enterprise Grid workspaces
  // Depending on the command's configuration, additional optional fields might be included. Consider extending this type accordingly.
};

export default class SlashCommand {
  action: string;

  args: string;

  userId: string;

  constructor(private payload: SlackSlashCommandPayload, private readonly logger: Logger) {
    const isValid = this.isValidSlackSlashCommandPayload(payload);
    if (!isValid) {
      this.logger.warn({ isValid, payload }, 'Received invalid slash command payload');
      throw new Error('Invalid Slash Command');
    }

    const actionArgs = this.getCommandArgs();
    this.action = actionArgs.action;
    this.args = actionArgs.args;
    this.userId = payload.user_id;
  }

  getCommand(): string {
    return this.payload.command;
  }

  getCommandArgs(): { action: string; args: string } {
    const [, action, , args] = this.payload.text.match(/^(\S+)(\s)?((.+))?$/) ?? [];
    return { action, args };
  }

  private isValidSlackSlashCommandPayload(payload: unknown): payload is SlackSlashCommandPayload {
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
