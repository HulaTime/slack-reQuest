import RichTextSection from './RichTextSection';

export type SlackRichTextList = {
  type: 'rich_text_list';
  style: 'bullet' | 'ordered'; // ordered is a numbered list here
  elements: Array<Record<string, unknown>>;
  indent?: number; // number of pxls to indent the list
  offset?: number; // number of pxls to offset the list
  border?: number; // number of pxls of border thickness
}

export default class RichTextList {
  private readonly type = 'rich_text_list';

  elements: RichTextSection[] = [];

  style: 'bullet' | 'numbered'; // ordered is a numbered list here

  constructor(style: 'bullet' | 'numbered', elements?: RichTextSection[]) {
    this.style = style;
    if (elements) {
      this.elements = elements;
    }
  }

  addItem(element: RichTextSection): this {
    this.elements.push(element);
    return this;
  }

  render(): SlackRichTextList {
    return {
      type: this.type,
      style: this.style === 'bullet' ? this.style : 'ordered',
      elements: this.elements.map(e => e.render()),
    };
  }
}
