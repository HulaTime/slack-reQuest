import { Logger } from 'pino';

import { SLACK_BOT_USER_TOKEN } from '../../../../config/app.config';

export type UpdateMsgPayload = {
  channel: string;
  ts: string;
  text: string;
  blocks: Record<string, unknown>[];
}

export default async (msg: UpdateMsgPayload, logger: Logger): Promise<void> => {
  const url = 'https://slack.com/api/chat.update';

  try {
    const headers = {
      Authorization: `Bearer ${SLACK_BOT_USER_TOKEN}`,
      'Content-Type': 'application/json;charset=UTF-8',
    };
    await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(msg),
    });
    logger.info({ channel: msg.channel, ts: msg.ts },'Successfully updated chat message');
  } catch (err) {
    logger.error({ err, channel: msg.channel }, 'Failed to update a chat message');
    throw err;
  }
};
