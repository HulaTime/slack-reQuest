import { randomUUID } from 'node:crypto';

import { ITextObject, SlackTextObject } from '../compositionObjects/TextObject';
import { SlackConfirmationDialogue } from '../compositionObjects/ConfirmationDialogObject';

export type SlackButton = {
  type: string;
  text: SlackTextObject;
  action_id: string;
  url?: string;
  value?: string;
  style?: 'primary' | 'danger';
  confirm?: SlackConfirmationDialogue;
  accessibility_label?: string;
}

export default class Button {
  type: string = 'button';
  
  text: ITextObject;

  actionId: string;
  
  constructor(text: ITextObject, actionId: string = randomUUID()) {
    this.text = text;
    this.actionId = actionId;
  }

  render(): SlackButton {
    return { 
      type: this.type,
      text: this.text.render(),
      action_id: this.actionId,
    };
  } 
}
