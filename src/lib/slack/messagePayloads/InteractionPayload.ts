import { Logger } from 'pino';

import { SlackTextObject } from '../compositionObjects/TextObject';

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
  };
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
  state: {
    values: Record<string, unknown>; 
  };
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

  channelId?: string;

  timestamp: string;

  primaryActions: SlackIteractionAction[];

  hasMultipleActions: boolean;

  responseUrl: string;

  constructor(private readonly payload: SlackInteractionPayload, private readonly logger: Logger) {
    console.log('---------- payload: ----------', payload);
    this.userId = this.payload.user.id;
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

  getRadioButtonState(actionBlockId: string, radioMenuBlockId: string): RadioButtonActionState | void {
    const actionBlockState = this.getBlockState(actionBlockId);
    if (!actionBlockState) {
      return;
    }

    const radioButtonState = actionBlockState[radioMenuBlockId];
    if (!radioButtonState) {
      this.logger.error({ actionBlockId, radioMenuBlockId, stateValues: this.payload.state.values }, 'Could not find the radio button state in the action block specified');
      return undefined;
    }

    if (typeof radioButtonState !== 'object' || Array.isArray(radioButtonState)) {
      this.logger.error({ radioButtonState, actionBlockId, radioMenuBlockId }, 'The radio button state was not of the expected type');
      return undefined;
    }

    if (!('type' in radioButtonState) || radioButtonState.type !== 'radio_buttons') {
      this.logger.error({
        radioButtonState, actionBlockId, radioMenuBlockId, stateValues: this.payload.state.values, 
      }, 'The state accessed was not a radio button state');
      return undefined;
    }

    return radioButtonState as RadioButtonActionState;
  }

  private getBlockState(blockId: string): Record<string, unknown> | undefined {
    const blockState = this.payload.state.values[blockId];
    if (!blockState) {
      this.logger.error('Could not find action block state while trying to get a radio button state', { blockId, stateValues: this.payload.state.values });
      return undefined;
    }
    if (typeof blockState !== 'object' || Array.isArray(blockState)) {
      this.logger.error('The action block was not of the expected type when trying to get a radio button state', { blockState, blockId, stateValues: this.payload.state.values });
      return undefined;
    }
    return blockState as Record<string, unknown>;
  }
}
