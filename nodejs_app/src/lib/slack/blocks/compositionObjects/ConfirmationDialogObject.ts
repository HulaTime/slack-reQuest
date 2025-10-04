import { TextObject, SlackTextObject } from './TextObject';

enum SlackStyle {
  green = 'primary',
  red = 'danger'
}

export interface SlackConfirmationDialogue {
  title: SlackTextObject;
  text: SlackTextObject;
  confirm: SlackTextObject;
  deny: SlackTextObject;
  style: string;
}

/** https://api.slack.com/reference/block-kit/composition-objects#confirm */
export default class ConfirmationDialogueObject {
  // The title for the confirmation dialogue
  title: TextObject;

  // Explanatory text for the confirmation dialogue
  text: TextObject;

  // This is the text for the button that confirms the action
  confirm: TextObject;

  // This is the text for the button that cancels the action
  deny: TextObject;

  // Danger will give the confirm button a red background, primary will give it a green background
  style: SlackStyle = SlackStyle.green;

  constructor(
    title: TextObject,
    text: TextObject,
    confirm: TextObject,
    deny: TextObject,
  ) {
    this.title = title;
    this.text = text;
    this.confirm = confirm;
    this.deny = deny;
  }

  setConfirmButtonStyle(style: 'green' | 'red'): void {
    if (style === 'green') {
      this.style = SlackStyle.green;
    }
    if (style === 'red') {
      this.style = SlackStyle.red;
    }
  }

  render(): SlackConfirmationDialogue {
    return {
      title: this.title.render(),
      text: this.text.render(),
      confirm: this.confirm.render(),
      deny: this.deny.render(),
      style: this.style,
    };};
}
