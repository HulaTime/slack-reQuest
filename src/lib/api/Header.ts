import { randomUUID } from 'node:crypto';

import { HeaderBlock } from '../slack/blocks';
import { TextObject } from '../slack/compositionObjects';
import { SlackHeaderBlock } from '../slack/blocks/HeaderBlock';

export default class MessageHeader {
  private headerBlock: HeaderBlock;

  constructor(text: string) {
    const textObject = new TextObject(text);
    this.headerBlock = new HeaderBlock(randomUUID(), textObject);
  }

  generate(): SlackHeaderBlock {
    return this.headerBlock.render();
  }
}
