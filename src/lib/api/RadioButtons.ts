import { ActionBlock, SectionBlock } from '../slack/blocks';
import { SlackActionBlock } from '../slack/blocks/ActionBlock';
import { SlackSectionBlock } from '../slack/blocks/SectionBlock';
import { MarkdownTextObject, OptionObject, TextObject } from '../slack/compositionObjects';
import { Button, RadioButton } from '../slack/elements';

export default class RadioButtons {
  private sectionBlock: SectionBlock;
  
  private actionBlock: ActionBlock;

  private textObject: MarkdownTextObject = new MarkdownTextObject('');

  private interactiveStateId: string;

  private radioButtons: RadioButton;

  private type: 'section' | 'action' = 'section';

  constructor(interactiveStateId: string) {
    this.interactiveStateId = interactiveStateId;
    this.sectionBlock = new SectionBlock(interactiveStateId, this.textObject);
    this.radioButtons = new RadioButton(this.interactiveStateId);
    this.sectionBlock.addAccessory(this.radioButtons);
    this.actionBlock = new ActionBlock(interactiveStateId, [
      this.radioButtons,
      new Button(this.interactiveStateId, new TextObject('Submit'), 'primary'),
      new Button(this.interactiveStateId, new TextObject('Cancel'), 'danger'),
    ]);
  }

  setText(text: string): this {
    this.textObject = new MarkdownTextObject(text);
    this.sectionBlock = new SectionBlock(this.interactiveStateId, this.textObject);
    return this;
  }

  addSelectableOption<T extends Record<string, unknown>>(text: string, value: T): this {
    const textObject = new TextObject(text);
    const option = new OptionObject(textObject, JSON.stringify(value));
    this.radioButtons.addOption(option);
    return this;
  }

  addSubmitButtons(): this {
    this.type = 'action';
    return this;
  };

  generate(): SlackSectionBlock | SlackActionBlock {
    const block = this.type === 'section' ? this.sectionBlock : this.actionBlock;
    return block.render();
  }
}
