import HttpReq from '@Lib/utils/HttpReq';
import { AppConfig } from '@Config/app.config';
import Block from '@Lib/slack/blocks/Block';
import { ILogger } from '@Common/logger/ILogger';

type PostMsgRes = {
  ok: boolean;
  channel: string;
}

type PostMsgReq = {
  token: string;
  channel: string;
  blocks?: Record<string, unknown>[];
  text?: string;
}

const appConfig = new AppConfig();

export default async (logger: ILogger, channelId: string, msg: Block[] | string): Promise<void> => {
  const body: Partial<PostMsgReq> = {
    token: appConfig.slack.botUserToken,
    channel: channelId,
  };
  if (typeof msg === 'string') {
    body.text = msg;
  } else {
    body.blocks = msg.map(m => m.render());
  }
  const httpReq = new HttpReq('https://slack.com/api/chat.postMessage', logger)
    .setHeader('Authorization', `Bearer ${appConfig.slack.botUserToken}`)
    .setBody(body);

  await httpReq.post<PostMsgRes>();
  return;
}; 
