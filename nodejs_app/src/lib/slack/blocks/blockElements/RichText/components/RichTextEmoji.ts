export type SlackRichTextEmoji = {
  type: 'emoji';
  name: string;
}

export default class RichTextEmoji {
  private readonly type = 'emoji';

  private readonly name: string;

  constructor(emojiName: string) {
    this.name = emojiName;
  };

  render(): SlackRichTextEmoji {
    return {
      type: this.type,
      name: this.name,
    };
  }
}
