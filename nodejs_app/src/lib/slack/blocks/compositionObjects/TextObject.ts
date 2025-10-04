export enum SlackTextType {
  plainText = 'plain_text',
  markdown = 'mrkdwn',
}

export type SlackTextObject = {
  type: SlackTextType;
  text: string;
  emoji?: boolean;
  verbatim?: boolean;
}

export interface ITextObject {
  type: SlackTextType;
  text: string;
  emoji?: boolean;
  /** When set to false (as is default) URLs will be auto-converted into links, conversation names
  * will be link-ified, and certain mentions will be automatically parsed. Using a value of true
  * will skip any preprocessing of this nature, although you can still include manual parsing
  * strings. This field is only usable when type is mrkdwn.
    */
  verbatim?: boolean;

  render(): SlackTextObject;
}


export class TextObject implements ITextObject {
  type = SlackTextType.plainText;

  text: string;

  emoji?: boolean;

  constructor(text: string) {
    this.text = text;
  }

  supportEmojis(flag: boolean): void {
    this.emoji = flag;
  }

  render(): SlackTextObject {
    return {
      type: this.type,
      text: this.text,
      emoji: this.emoji,
    };
  }
}

export class MarkdownTextObject extends TextObject implements ITextObject {
  type = SlackTextType.markdown;

  verbatim?: boolean = false;

  constructor(text: string) {
    super(text);
  }

  disableMsgProcessing(): void {
    this.verbatim = true;
  }

  render(): SlackTextObject {
    return {
      type: this.type,
      text: this.text,
      emoji: this.emoji,
      verbatim: this.verbatim,
    };
  }
}
