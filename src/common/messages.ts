import { ActionBlock, InputBlock, SectionBlock } from '../lib/slack/blocks';
import { MarkdownTextObject, OptionObject, TextObject } from '../lib/slack/compositionObjects';
import { ITextObject } from '../lib/slack/compositionObjects/TextObject';
import { Button, PlainTextInput, RadioButton } from '../lib/slack/elements';
import MessagePayload, { SlackMessagePayload } from '../lib/slack/messagePayloads/MessagePayload';

import {
  ActionIdentifiers, BlockIdentifiers, DefaultQueueTypes, MessageIdentifiers,
} from './identifiers';

export const CreateQueueForm = (alert?: ITextObject): SlackMessagePayload => {
  const defaultQueueRadioButtons = new RadioButton(ActionIdentifiers.defaultQueueSelected)
    .addOption(new OptionObject(
      new TextObject('Code Review'),
      DefaultQueueTypes.codeReview,
    ))
    .addOption(new OptionObject(
      new TextObject('Release'),
      DefaultQueueTypes.release,
    ));

  const defaultOptions = new InputBlock(BlockIdentifiers.defaultQueueInput, new TextObject('Default Queues:'), defaultQueueRadioButtons);
  const customInput = new InputBlock(BlockIdentifiers.customQueueInput, new TextObject('Custom:'), new PlainTextInput(ActionIdentifiers.customInputSelected));

  const headerSection = new SectionBlock(
    BlockIdentifiers.submitQueueHeader,
    alert ?? new MarkdownTextObject('*What type of requests should be managed by this queue?*'),
  );

  const createButton = new Button(ActionIdentifiers.queueTypeSelected, new TextObject('Create'), 'primary');
  const cancelButton = new Button(ActionIdentifiers.cancelInteraction, new TextObject('Cancel'), 'danger');

  const actionBlock = new ActionBlock(BlockIdentifiers.submitQueueButtons, [
    createButton,
    cancelButton,
  ]);

  const messageBlocks = [
    headerSection,
    defaultOptions,
    customInput,
    actionBlock,
  ];

  const msgPayload = new MessagePayload(MessageIdentifiers.selectQueueRequestType, messageBlocks)
    .setResponseType('ephemeral')
    .shouldReplaceOriginal('true');

  return msgPayload.render();
};
