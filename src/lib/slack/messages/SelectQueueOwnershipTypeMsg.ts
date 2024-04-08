import { ActionIdentifiers, MessageIdentifiers } from '../../../common/identifiers';
import {
  ActionBlock, DividerBlock, HeaderBlock, SectionBlock, 
} from '../blocks';
import { MarkdownTextObject, OptionObject, TextObject } from '../compositionObjects';
import { Button, RadioButton } from '../elements';

import MessagePayload, { SlackMessagePayload } from './MessagePayload';

export enum QueueOwners {
  personal = 'user',
  channel = 'channel'
}

export default class SelectQueueOwnershipTypeMsg {
  buildRadioButtons(): RadioButton {
    const radioButtons = new RadioButton(ActionIdentifiers.selectQueueOwnershipType);
    radioButtons.addOption(new OptionObject(
      new TextObject('Create queue in channel') ,
      QueueOwners.channel,
    ));
    return radioButtons;
  }

  render(): SlackMessagePayload {
    const header = new HeaderBlock(new TextObject('Create a new Queue!'));

    const selectQueueTypeSection = new SectionBlock(
      new MarkdownTextObject('*Where would you like to create this queue?*'),
    );
    selectQueueTypeSection.addAccessory(this.buildRadioButtons());

    const nextButton = new Button(new TextObject('Next'), ActionIdentifiers.proceedFromOwnershipType);
    const cancelButton = new Button(new TextObject('Cancel'), ActionIdentifiers.cancelInteraction);
    nextButton.setStyle('primary');
    cancelButton.setStyle('danger');

    const buttonActions = new ActionBlock([
      nextButton,
      cancelButton,
    ]);
    
    const messageBlocks = [
      header,
      new DividerBlock(),
      selectQueueTypeSection,
      buttonActions,
    ];

    const messagePayload = new MessagePayload(MessageIdentifiers.selectQueueOwnershipType, messageBlocks);
    return messagePayload.render();
  }
}

