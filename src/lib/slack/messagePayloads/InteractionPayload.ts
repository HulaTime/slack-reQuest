import { Logger } from 'pino';

import { SlackTextObject } from '../compositionObjects/TextObject';

export type SlackIteractionAction = {
  block_id: string;
  action_id: string;
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

  getRadioButtonState(actionBlockId: string, radioMenuBlockId: string): RadioButtonActionState | void {
    const actionBlockState = this.payload.state.values[actionBlockId];
    if (!actionBlockState) {
      this.logger.error('Could not find action block state while trying to get a radio button state', { actionBlockId, radioMenuBlockId, stateValues: this.payload.state.values });
      return undefined;
    }
    if (typeof actionBlockState !== 'object' || Array.isArray(actionBlockState)) {
      this.logger.error('The action block was not of the expected type when trying to get a radio button state', {
        actionBlockState, actionBlockId, radioMenuBlockId, stateValues: this.payload.state.values, 
      });
      return undefined;
    }

    const radioButtonState = (actionBlockState as Record<string, unknown>)[radioMenuBlockId];
    if (!radioButtonState) {
      this.logger.error('Could not find the radio button state in the action block specified', { actionBlockId, radioMenuBlockId, stateValues: this.payload.state.values });
      return undefined;
    }

    if (typeof radioButtonState !== 'object' || Array.isArray(radioButtonState)) {
      this.logger.error('The radio button state was not of the expected type', { radioButtonState, actionBlockId, radioMenuBlockId });
      return undefined;
    }

    if (!('type' in radioButtonState) || radioButtonState.type !== 'radio_buttons') {
      this.logger.error('The state accessed was not a radio button state', {
        radioButtonState, actionBlockId, radioMenuBlockId, stateValues: this.payload.state.values, 
      });
      return undefined;
    }

    return radioButtonState as RadioButtonActionState;
  }
}
