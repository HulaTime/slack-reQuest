import { SlackTextObject, TextObject } from './TextObject';

export interface SlackOption {
  text: SlackTextObject;
  value: string;
  description?: TextObject;
  url?: string;
}

export default class OptionObject {
  // This will be the text shown in slack for the option
  text: TextObject;

  // This is the value that the appliation will receive when this option is selected
  value: string;

  description?: TextObject;

  url?: string;

  constructor(text: TextObject, value: string) {
    this.text = text;
    this.value = value;
  }

  render(): SlackOption {
    return {
      text: this.text.render(),
      value: this.value,
      description: this.description,
      url: this.url,
    };
  }
}
