import { MessagePayload } from '@Lib/slack/messagePayloads';

export type CommandHandler = (text: string, info?: {
  userId: string;
  userName: string;
  channelId: string;
  channelName: string;
}) => Promise<MessagePayload | void>;

export interface ICommand {

}
