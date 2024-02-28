export type SlashCommandReq = {
  command: string;
  text: string;
  response_url: string;
  trigger_id: string;
  user_id: string;
  team_id: string;
  enterprise_id: string;
  channel_id: string;
  api_app_id: string;
}

export type MessagePayload = {
  text: string;
  blocks?: Array<unknown>;
  thread_ts?: string; 
  mrkdwn?: boolean;
}

export type EphemeralResponse = {
  text: string;
  response_type: 'ephemeral';
}

export type InChannelResponse = {
  text: string;
  response_type: 'in_channel';
}

export type InThreadResponse = {
  text: string;
  response_type: 'in_channel';
  replace_original: boolean;
  thread_ts: string;
}

