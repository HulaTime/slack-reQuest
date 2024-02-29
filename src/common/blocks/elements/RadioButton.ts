import ConfirmationDialogueObject, { SlackConfirmationDialogue } from '../../compositionObjects/ConfirmationDialogObject';
import OptionObject, { SlackOption } from '../../compositionObjects/OptionObject';

type SlackRadioButton = {
  type: string;
  options: Array<SlackOption>;
  initial_option?: SlackOption;
  action_id?: string;
  confirm?: SlackConfirmationDialogue;
  focus_on_load?: boolean;
}

/** https://api.slack.com/reference/block-kit/block-elements#radio */
export default class RadioButton {
  type: string = 'radio_buttons';
  
  maxOptions: number = 10;

  options: Array<OptionObject> = [];

  initialOption?: OptionObject;

  action_id?: string;

  confirm?: ConfirmationDialogueObject;

  /** Indicates whether the element will be set to auto focus within the view object. Only one
    * element can be set to true. Defaults to false.
  */
  focusOnLoad?: boolean;

  addOption(option: OptionObject): void {
    if (this.options.length >= this.maxOptions) {
      throw new Error(`Cannot add more than ${this.maxOptions} options to Radio Button`);
    }
    this.options.push(option);
  }

  setInitialOption(option: OptionObject): void {
    if (!this.options.includes(option)) {
      throw new Error('Initial option must exist in the assigned options');
    }
    this.initialOption = option;
  }

  render(): SlackRadioButton {
    return {
      type: this.type,
      options: this.options.map(option => option.render()),
      initial_option: this.initialOption,
      confirm: this.confirm?.render(),
      focus_on_load: this.focusOnLoad,
    };
  }
}
