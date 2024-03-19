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

type ActionStates = RadioButtonActionState | Record<string, unknown>;;

type InteractionStateValue = {
  [actionId: string]: ActionStates; 
}

export interface SlackInteractionPayload {
  type: string;
  user: {
    id: string;
    name: string;
    username: string;
    team_id: string;
  };
  actions: SlackIteractionAction[];
  state: {
    values: {
      [block_id: string]: InteractionStateValue;
    };
  };
}

export default class InteractionPayload {
  userId: string;

  primaryActions: SlackIteractionAction[];

  hasMultipleActions: boolean;

  constructor(private readonly payload: SlackInteractionPayload) {
    this.userId = this.payload.user.id;
    this.primaryActions = this.payload.actions;
    this.hasMultipleActions = this.primaryActions.length > 1;
  }

  getActionId(): string {
    return this.primaryActions[0]?.action_id;
  }

  getActionIds(): string[] {
    return this.primaryActions.map(action => action.action_id);
  }

  getActionState(actionId: string): InteractionStateValue {
    const action = this.primaryActions.find(action => action.action_id = actionId);
    if (!action) {
      return {};
    }
    return this.payload.state.values[action.block_id];
  }
}
