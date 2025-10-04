import { RichTextElements } from './blockElements';
import Block from './Block';

export type SlackRichTextBlock = {
  block_id: string;
  type: string;
  elements: Array<Record<string, unknown>>;
}

export default class RichTextBlock extends Block<SlackRichTextBlock> {
  private readonly elements: RichTextElements[] = [];

  constructor(blockId?: string) {
    super('rich_text', blockId);
  }

  addElement(element: RichTextElements): this {
    this.elements.push(element);
    return this;
  }

  render(): SlackRichTextBlock {
    return {
      block_id: this.blockId,
      type: this.type,
      elements: this.elements.map(e => e.render()),
    };
  }
}
