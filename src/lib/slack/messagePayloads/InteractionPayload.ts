import { Logger } from 'pino';

import { SlackTextObject } from '../compositionObjects/TextObject';
import { ActionIdentifiers, BlockIdentifiers, SelectionIdentifiers } from '../../../common/identifiers';

export type SlackIteractionAction = {
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

export interface SlackInteractionPayload {
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
  actions: SlackIteractionAction[];
  state: InteractionState;
  container: {
    type: string;
    message_ts: string;
    channel_id: string;
    is_ephemeral: boolean;
  };
  response_url: string;
}

export default class InteractionPayload {
  userId: string;

  userName: string;

  channelId?: string;

  timestamp: string;

  primaryActions: SlackIteractionAction[];

  hasMultipleActions: boolean;

  responseUrl: string;

  constructor(readonly payload: SlackInteractionPayload, private readonly logger: Logger) {
    console.log('---------- payload: ----------', JSON.stringify(payload, null, 4));
    this.userId = this.payload.user.id;
    this.userName = this.payload.user.name;
    this.channelId = this.payload.channel?.id;
    this.timestamp = this.payload.container.message_ts;
    this.primaryActions = this.payload.actions;
    this.hasMultipleActions = this.primaryActions.length > 1;
    this.responseUrl = this.payload.response_url;
  }

  getActionId(): string {
    return this.primaryActions[0]?.action_id;
  }

  getActionIds(): string[] {
    return this.primaryActions.map(action => action.action_id);
  }

  getActionById(actionId: string): SlackIteractionAction | undefined {
    const action = this.payload.actions.find(a => a.action_id === actionId);
    if (!action) {
      this.logger.error({ actionId, payloadActions: this.payload.actions }, 'Could not find an action with the specified id');
      return undefined;
    }
    return action;
  }

  getBlockStateValue(blockId: BlockIdentifiers, blockStateIdentifier: SelectionIdentifiers): string {
    const blockState = this.payload.state.values[blockId];
    if (!blockState) {
      this.logger.error('Could not find block state', { blockId, stateValues: this.payload.state.values });
      return '';
    }

    const actionState = blockState[blockStateIdentifier];

    if (actionState?.type === 'radio_buttons') {
      return actionState.selected_option?.value ?? '';
    }

    if (actionState?.type === 'plain_text_input') {
      return actionState.value;
    }

    return '';
  }
}
