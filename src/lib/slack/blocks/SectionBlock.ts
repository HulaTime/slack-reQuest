import { SlackTextObject, ITextObject } from '../compositionObjects/TextObject';

import Block from './Block';

export type SlackSectionBlock = {
  type: string;
  text: SlackTextObject;
  block_id: string;
}

export default class SectionBlock extends Block<SlackSectionBlock> {
  text: ITextObject;

  /** Required if no text is provided. An array of text objects. Any text objects included with
    * fields will be rendered in a compact format that allows for 2 columns of side-by-side text.
    * Maximum number of items is 10. Maximum length for the text in each item is 2000 characters. 
  */
  fields?: Array<ITextObject>;

  accessory?: Record<string, unknown>;

  constructor(text: ITextObject) {
    super('section');
    this.text = text;
  }

  render(): SlackSectionBlock {
    return {
      type: this.type,
      block_id: this.blockId,
      text: this.text.render(),
    };
  }
};
