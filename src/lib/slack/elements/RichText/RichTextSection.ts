import { RichTextComponents } from './components';

export type SlackRichTextSection = {
  type: 'rich_text_section';
  elements: Array<Record<string, unknown>>;
}

export default class RichTextSection {
  private readonly type = 'rich_text_section';

  elements: RichTextComponents[] = [];

  constructor(elements?: RichTextComponents[]) {
    if (elements) {
      this.elements = elements;
    }
  }

  addElement(element: RichTextComponents): this {
    this.elements.push(element);
    return this;
  }

  render(): SlackRichTextSection {
    return {
      type: this.type,
      elements: this.elements.map(e => e.render()),
    };
  }
}
