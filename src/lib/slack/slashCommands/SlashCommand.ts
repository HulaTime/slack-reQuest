import { z } from 'zod';

import { ILogger } from '@Lib/logger';

export const SlashCommandSchema = z.object({
  token: z.string(),
  team_id: z.string(),
  team_domain: z.string(),
  channel_id: z.string(),
  channel_name: z.string(),
  user_id: z.string(),
  user_name: z.string(),
  command: z.string(),
  text: z.string(),
  response_url: z.string(),
  trigger_id: z.string(),
  api_app_id: z.string().optional(), // Optional: present if the command is invoked in a workspace where your app is installed
  enterprise_id: z.string().optional(), // Optional: present for Enterprise Grid workspaces
  enterprise_name: z.string().optional(), // Optional: present for Enterprise Grid workspaces
  // Depending on the command's configuration, additional optional fields might be included. Consider extending this type accordingly.
});

export type SlackSlashCommandPayload = z.infer<typeof SlashCommandSchema>;

export default class SlashCommand {
  action: string;

  args: string;

  userId: string;

  userName: string;

  channelId: string;

  constructor(private payload: SlackSlashCommandPayload) {
    const actionArgs = this.getCommandArgs();
    this.action = actionArgs.action;
    this.args = actionArgs.args;
    this.userId = payload.user_id;
    this.userName = payload.user_name;
    this.channelId = payload.channel_id;
  }

  static Validate(logger: ILogger, payload: unknown): SlackSlashCommandPayload {
    const { data, error, success } = SlashCommandSchema.safeParse(payload);
    if (!success) {
      logger.warn( 'Received invalid slash command payload', { error, payload });
      throw error; 
    }
    return data; 
  }

  getCommand(): string {
    return this.payload.command;
  }

  getCommandArgs(): { action: string; args: string } {
    const [, action, , args] = this.payload.text.match(/^(\S+)(\s)?((.+))?$/) ?? [];
    return { action, args };
  }
}
