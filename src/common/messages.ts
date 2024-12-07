import { CancelButton } from './buttons';
import { ActionIdentifiers, BlockIdentifiers, SelectionIdentifiers } from './identifiers';

import { ActionBlock, InputBlock, SectionBlock } from '@Lib/slack/blocks';
import { MarkdownTextObject, OptionObject, TextObject } from '@Lib/slack/compositionObjects';
import { Button, PlainTextInput, RadioButton } from '@Lib/slack/elements';
import MessagePayload, { SlackMessagePayload } from '@Lib/slack/messagePayloads/MessagePayload';
import { ITextObject } from '@Lib/slack/compositionObjects/TextObject';
import { QueueModel } from 'src/models/Queue';

export const CreateQueueForm = (defaultQueues: QueueModel[], alert?: ITextObject): SlackMessagePayload => {
  const defaultQueueRadioButtons = new RadioButton(SelectionIdentifiers.defaultQueueRadioOption);
  defaultQueues.forEach(queue => {
    defaultQueueRadioButtons
      .addOption(new OptionObject(
        new TextObject(queue.name),
        queue.id,
      ));
  });

  const defaultOptions = new InputBlock(defaultQueueRadioButtons, new TextObject('Default Queues:'), BlockIdentifiers.defaultQueueInput);

  const customInputField = new PlainTextInput(SelectionIdentifiers.customQueueInput);
  customInputField.setMaxLength(256);
  const customInput = new InputBlock(customInputField, new TextObject('Custom:'), BlockIdentifiers.customQueueInput);

  const headerSection = new SectionBlock(
    alert ?? new MarkdownTextObject('*What type of requests should be managed by this queue?*'),
  );

  const createButton = new Button(new TextObject('Create'), 'primary', ActionIdentifiers.submitNewQueue);

  const actionBlock = new ActionBlock([
    createButton,
    CancelButton,
  ]);

  const messageBlocks = [
    headerSection,
    defaultOptions,
    customInput,
    actionBlock,
  ];

  const msgPayload = new MessagePayload(messageBlocks)
    .setResponseType('ephemeral')
    .shouldReplaceOriginal('true');

  return msgPayload.render();
};
