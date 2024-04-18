type Style = {
  bold: boolean;
  italic: boolean;
  strike: boolean;
  code: boolean;
}

export type SlackRichTextLink = {
  type: 'link';
  url: string;
  text?: string;
  unsafe?: boolean;
  style?: Style;
}

export default class RichTextLink {
  private readonly type = 'link';

  private readonly url: string;

  private readonly text?: string;

  private readonly unsafe: boolean = false;

  style: Style = {
    bold: false,
    italic: false,
    strike: false,
    code: false,
  };

  constructor(url: string, text?: string) {
    this.url = url;
    this.text = text;
  };

  render(): SlackRichTextLink {
    return {
      type: this.type,
      url: this.url,
      text: this.text,
      unsafe: this.unsafe,
      style: this.style,
    };
  }
}
