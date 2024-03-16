import { SlackTextObject, ITextObject } from './TextObject';

export interface SlackOption {
  text: SlackTextObject;
  value: string;
  description?: ITextObject;
  url?: string;
}

export default class OptionObject {
  // This will be the text shown in slack for the option
  text: ITextObject;

  // This is the value that the appliation will receive when this option is selected
  value: string;

  description?: ITextObject;

  url?: string;

  constructor(text: ITextObject, value: string) {
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
