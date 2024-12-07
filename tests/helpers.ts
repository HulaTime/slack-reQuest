import { createHmac } from 'node:crypto';

import { SlackSlashCommandPayload } from '../src/lib/slack/slashCommands/SlashCommand';

export const slashCommandPayload = (
  command: string,
  text: string,
  userId: string,
): SlackSlashCommandPayload => ({
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

// eslint-disable-next-line
export const jsonToUrlEncoded = (json: Record<string, any>): string => 
  Object.keys(json)
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(json[key])}`)
    .join('&');

export const createSlackSignatureFromPayload = (
// eslint-disable-next-line
  payload: any,
  timestamp: number,
  secret: string,
): string => {
  const signatureBaseString = `v0:${timestamp}:${payload}`;
  const hmac = createHmac('sha256', secret);
  return 'v0=' + hmac.update(signatureBaseString, 'utf-8').digest('hex');
};

