import { ActionBlock, SectionBlock } from '../lib/slack/blocks';
import { MarkdownTextObject, OptionObject, TextObject } from '../lib/slack/compositionObjects';
import { ITextObject } from '../lib/slack/compositionObjects/TextObject';
import { Button, RadioButton } from '../lib/slack/elements';
import MessagePayload, { SlackMessagePayload } from '../lib/slack/messagePayloads/MessagePayload';

import {
  ActionIdentifiers, BlockIdentifiers, DefaultQueueTypes, MessageIdentifiers, 
} from './identifiers';

export const CreateQueueForm = (alert?: ITextObject): SlackMessagePayload => {
  const radioButtons = new RadioButton(BlockIdentifiers.selectQueueMenu)
    .addOption(new OptionObject(
      new TextObject('Code Review'),
      DefaultQueueTypes.codeReview,
    ))
    .addOption(new OptionObject(
      new TextObject('Release'),
      DefaultQueueTypes.release,
    ));

  const sectionBlock = new SectionBlock(
    BlockIdentifiers.selectQueueSection,
    alert ?? new MarkdownTextObject('*What type of requests should be managed by this queue?*'),
  );

  const createButton = new Button(new TextObject('Create'), 'primary', ActionIdentifiers.selectQueueType);
  const cancelButton = new Button(new TextObject('Cancel'), 'danger', ActionIdentifiers.cancelInteraction);

  const actionBlock = new ActionBlock(BlockIdentifiers.selectQueueAction, [
    radioButtons,
    createButton,
    cancelButton,
  ]);

  const messageBlocks = [
    sectionBlock,
    actionBlock,
  ];
  
  const msgPayload = new MessagePayload(MessageIdentifiers.selectQueueRequestType, messageBlocks)
    .setResponseType('ephemeral')
    .shouldReplaceOriginal('true');

  return msgPayload.render();
};
