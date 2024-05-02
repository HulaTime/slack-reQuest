import { DividerBlock } from '../slack/blocks';

import Header from './Header';
import RadioButtons from './RadioButtons';

export default class InteractiveMessage {
  private readonly blocks: Record<string, unknown>[] = [];

  private isHeaderSet: boolean = false;

  constructor() { };

  setHeader(header: Header): this {
    if (this.isHeaderSet) {
      this.blocks[0] = header.generate();
      return this;
    }
    this.blocks.unshift(header.generate());
    this.isHeaderSet = true;
    return this;
  }

  addDivider(): this {
    this.blocks.push(new DividerBlock().render());
    return this;
  }

  addRadioButtons(radioButtons: RadioButtons): this {
    this.blocks.push(radioButtons.generate());
    return this;
  }
}
