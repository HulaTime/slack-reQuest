import { SlackTextObject, ITextObject } from '../compositionObjects/TextObject';
import { Elements } from '../elements';

import Block from './Block';

export type SlackSectionBlock = {
  type: string;
  text: SlackTextObject;
  block_id: string;
  accessory?: Record<string, unknown>;
}

export default class SectionBlock extends Block<SlackSectionBlock> {
  text: ITextObject;

  /** Required if no text is provided. An array of text objects. Any text objects included with
    * fields will be rendered in a compact format that allows for 2 columns of side-by-side text.
    * Maximum number of items is 10. Maximum length for the text in each item is 2000 characters. 
  */
  fields?: Array<ITextObject>;

  accessory?: Elements;

  private maxTextLength = 3000;

  constructor(blockId: string, textObject: ITextObject) {
    super('section', blockId);
    if (textObject.text.length > this.maxTextLength) {
      throw new Error(`Text for a section block cannot exceed ${this.maxTextLength} characters in length`);
    }
    this.text = textObject;
  }

  addAccessory(element: Elements): this {
    this.accessory = element;
    return this;
  }

  render(): SlackSectionBlock {
    return {
      type: this.type,
      block_id: this.blockId,
      text: this.text.render(),
      accessory: this.accessory?.render(),
    };
  }
};
