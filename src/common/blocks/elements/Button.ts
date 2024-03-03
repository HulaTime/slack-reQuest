import { randomUUID } from 'node:crypto';

import { SlackConfirmationDialogue } from '../../compositionObjects/ConfirmationDialogObject';
import { SlackTextObject, TextObject } from '../../compositionObjects/TextObject';

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
  
  text: TextObject;

  actionId: string;
  
  constructor(text: TextObject, actionId: string = randomUUID()) {
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
