import { SlackTextObject, TextObject } from '../compositionObjects/TextObject';

import Block from './Block';

export type SlackHeaderBlock = {
  type: string;
  text: SlackTextObject;
  block_id: string;
}

export default class HeaderBlock extends Block<SlackHeaderBlock> {
  /** The text for the block, in the form of a plain_text text object. Maximum length for the text
    * in this field is 150 characters.
  */
  text: TextObject;

  maxTextLength: number = 100;

  constructor(text: TextObject) {
    super('header');
    this.text = text;
    this.validateTextLength();
  }

  private validateTextLength(): void {
    if (this.text.text.length > this.maxTextLength) {
      throw new Error(`Header text has a max length of ${this.maxTextLength}`);
    }
  }

  render(): SlackHeaderBlock {
    return {
      type: this.type,
      block_id: this.blockId,
      text: this.text.render(),
    };
  }
};
