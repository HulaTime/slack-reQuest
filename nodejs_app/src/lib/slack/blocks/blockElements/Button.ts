import { randomUUID } from 'crypto';

import { ITextObject, SlackTextObject } from '../compositionObjects/TextObject';
import { SlackConfirmationDialogue } from '../compositionObjects/ConfirmationDialogObject';

export type ButtonStyles = 'primary' | 'danger';

export type SlackButton = {
  type: string;
  text: SlackTextObject;
  action_id: string;
  url?: string;
  value?: string;
  style?: ButtonStyles;
  confirm?: SlackConfirmationDialogue;
  accessibility_label?: string;
}

export default class Button {
  type: string = 'button';

  text: ITextObject;

  actionId: string;

  style?: ButtonStyles;

  value?: string;

  constructor(text: ITextObject, style: ButtonStyles | 'none', actionId?: string) {
    this.text = text;
    this.actionId = actionId ?? randomUUID();
    if (style !== 'none') {
      this.style = style;
    }
  }

  setValue(value: string): this {
    this.value = value;
    return this;
  }

  render(): SlackButton {
    return {
      type: this.type,
      text: this.text.render(),
      style: this.style,
      action_id: this.actionId,
      value: this.value,
    };
  }
}
