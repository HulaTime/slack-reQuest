import { TextObject, SlackTextObject } from '../compositionObjects/TextObject';
import { RadioButton } from '../elements';

import Block from './Block';

export type SlackInputBlock = {
  block_id: string;
  type: string;
  label: SlackTextObject;
  element: Record<string, unknown>;
  dispatch_action?: boolean;
  hint?: SlackTextObject;
  optional?: boolean;
}

export default class InputBlock extends Block<SlackInputBlock> {
  /** A label that appears above an input element in the form of a text object that must have type
    * of plain_text. Maximum length for the text in this field is 2000 characters.
  */
  label: TextObject;

  element: RadioButton;

  /** A boolean that indicates whether or not the use of elements in this block should dispatch a
    * block_actions payload. Defaults to false.
  */
  shouldDispatchAction?: boolean = false;

  /** An optional hint that appears below an input element in a lighter grey. It must be a text
    * object with a type of plain_text. Maximum length for the text in this field is 2000 characters.
  */
  hint?: TextObject;

  /** A boolean that indicates whether the input element may be empty when a user submits the modal.
    * Defaults to false.
  */
  optional?: boolean = false;

  constructor(label: TextObject, element: RadioButton, hint?: TextObject) {
    super('input');
    this.label = label;
    this.element = element;
    this.hint = hint;
  }

  render(): SlackInputBlock {
    return {
      block_id: this.blockId,
      type: this.type,
      label: this.label,
      element: this.element.render(),
      dispatch_action: this.shouldDispatchAction,
      hint: this.hint,
      optional: this.optional,
    };
  }
};
