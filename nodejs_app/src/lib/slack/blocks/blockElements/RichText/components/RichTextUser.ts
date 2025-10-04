type Style = {
  bold: boolean;
  italic: boolean;
  strike: boolean;
  highlight: boolean;
  client_highlight: boolean;
  unlink: boolean;
}

export type SlackRichTextUser = {
  type: 'user';
  user_id: string;
  style?: Style;
}

export default class RichTextUser {
  private readonly type = 'user';

  private readonly userId: string;

  style: Style = {
    bold: false,
    italic: false,
    strike: false,
    highlight: false,
    client_highlight: false,
    unlink: false,
  };

  constructor(userId: string) {
    this.userId = userId;
  };

  render(): SlackRichTextUser {
    return {
      type: this.type,
      user_id: this.userId,
      style: this.style,
    };
  }
}
