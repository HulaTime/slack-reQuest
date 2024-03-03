import Block from './Block';

export type SlackDividerBlock = {
  type: string;
  block_id: string;
};

export default class DividerBlock extends Block<SlackDividerBlock> {
  constructor() {
    super('divider');
  }

  render(): SlackDividerBlock {
    return {
      type: this.type,
      block_id: this.blockId,
    };
  }
};
