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

