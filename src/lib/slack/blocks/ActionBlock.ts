import { Elements } from '../elements';

import Block from './Block';

export type SlackActionBlock = {
  type: string;
  block_id: string;
  elements: Array<Record<string, unknown>>;
};

export default class ActionBlock extends Block<SlackActionBlock> {
  /** An array of interactive element objects - buttons, select menus, overflow menus, or date
    * pickers. There is a maximum of 25 elements in each action block. 
  */
  elements: Array<Elements>;

  maxElements: number = 25;

  constructor(blockId: string, elements: Array<Elements>) {
    super('actions', blockId);
    if (elements.length > this.maxElements) {
      throw new Error(`Cannot create an action block with more than ${this.maxElements} elements`);
    }
    this.elements = elements;
  }

  render(): SlackActionBlock {
    return {
      type: this.type,
      block_id: this.blockId,
      elements: this.elements.map(element => element.render()),
    };
  }
};
