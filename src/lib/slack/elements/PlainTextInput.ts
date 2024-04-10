import DispatchActionConfiguration, { SlackDispatchActionConfig } from '../compositionObjects/DispatchActionConfiguration';
import { SlackTextObject, TextObject } from '../compositionObjects/TextObject';

export type SlackPlainTextInput = {
  type: string;
  action_id: string;
  initialValue?: string;
  multiline: boolean;
  min_length?: number;
  max_length?: number;
  dispatch_action_configuration?: SlackDispatchActionConfig;
  focus_on_load: boolean;
  placeholder?: SlackTextObject;
}

export default class PlainTextInput {
  type = 'plain_text_input';

  action_id: string;

  initialValue?: string;

  multiline: boolean = false;

  min_length?: number;

  max_length?: number;

  dispatch_action_configuration?: DispatchActionConfiguration;

  focus_on_load: boolean = false;

  placeholder?: TextObject;

  constructor(actionId: string) {
    this.action_id = actionId;
  }

  render(): SlackPlainTextInput {
    return {
      type: this.type,
      action_id: this.action_id,
      initialValue: this.initialValue,
      multiline: this.multiline,
      min_length: this.min_length,
      max_length: this.max_length,
      dispatch_action_configuration: this.dispatch_action_configuration?.render(),
      focus_on_load: this.focus_on_load,
      placeholder: this.placeholder,
    };
  }
}
