import { SlackTextObject } from '../../../lib/slack/blocks/compositionObjects/TextObject';

export type SlackInteractionAction = {
  block_id: string;
  action_id: string;
  value?: string;
}

export type RadioButtonActionState = {
  type: 'radio_buttons';
  selected_option: {
    text: SlackTextObject;
    value: string;
  } | null;
}

export type PlainTextInputState = {
  type: 'plain_text_input';
  value: string;
}

export type BlockStateValue = {
  [blockId: string]: {
    [actionId: string]: RadioButtonActionState | PlainTextInputState | undefined;
  } | undefined;
}

export type InteractionState = {
  values: BlockStateValue;
}

export class TestSlashInteractionPayload {
  type: string;

  user: {
    id: string;
    name: string;
    username: string;
    team_id: string;
  };

  channel?: {
    id: string;
    name: string;
  };

  actions: SlackInteractionAction[];

  state: InteractionState;

  container: {
    type: string;
    message_ts: string;
    channel_id: string;
    is_ephemeral: boolean;
  };

  response_url: string;

  constructor(command: string, text: string, user_id: string) {
    this.command = command;
    this.text = text;
    this.user_id = user_id;
  }

}
