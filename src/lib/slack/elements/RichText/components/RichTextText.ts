type Style = {
  bold: boolean;
  italic: boolean;
  strike: boolean;
  code: boolean;
}

export type SlackRichTextText = {
  type: 'text';
  text: string;
  style?: Style;
}

export default class RichTextText {
  private readonly type = 'text';

  private readonly text: string;

  style: Style = {
    bold: false,
    italic: false,
    strike: false,
    code: false,
  };

  constructor(text: string) {
    this.text = text;
  };

  render(): SlackRichTextText {
    return {
      type: this.type,
      text: this.text,
      style: this.style,
    };
  }
}
