type Style = {
  bold: boolean;
  italic: boolean;
  strike: boolean;
  highlight: boolean;
  client_highlight: boolean;
  unlink: boolean;
}

export type SlackRichTextChannel = {
  type: 'channel';
  channel_id: string; // Id of the channel to be mentioned
  style: Style;
}

export default class RichTextChannel {
  private readonly type = 'channel';

  private readonly channelId: string;

  style: Style = {
    bold: false,
    italic: false,
    strike: false,
    highlight: false,
    client_highlight: false,
    unlink: false,
  };

  constructor(channelId: string) {
    this.channelId = channelId;
  };

  render(): SlackRichTextChannel {
    return {
      type: this.type,
      channel_id: this.channelId,
      style: this.style,
    };
  }
}
