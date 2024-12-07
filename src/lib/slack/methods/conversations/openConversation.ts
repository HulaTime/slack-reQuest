import HttpReq from '@Lib/utils/HttpReq';
import { AppConfig } from '@Config/app.config';
import { ILogger } from '@Lib/logger';

type OpenConversationResponse = {
  ok: boolean;
  channel: {
    id: string;
  };
}

export default async (logger: ILogger, users: string[]): Promise<{ channelId: string } | void> => {
  const appConfig = new AppConfig();

  if (users.length > 8) {
    throw new Error('Cannot open a conversation with more than 8 users');
  }
  const httpReq = new HttpReq('https://slack.com/api/chat.postMessage', logger)
    .setBody({
      users,
      token: appConfig.slack.botUserToken,
      return_im: false,
    });

  const result = await httpReq.post<OpenConversationResponse>();
  if (result) {
    return { channelId: result.channel.id };
  }
}; 
