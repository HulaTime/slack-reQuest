import { randomUUID } from 'crypto';

import { CancelButton } from '@Common/buttons';
import { Result } from '@Common/exceptionControl';
import { ActionIdentifiers, BlockIdentifiers, SelectionIdentifiers } from '@Common/identifiers';
import { MessagePayload } from '@Lib/slack/messagePayloads';
import { Button, PlainTextInput, RadioButtons } from '@Lib/slack/blocks/blockElements';
import { MarkdownTextObject, OptionObject, TextObject } from '@Lib/slack/blocks/compositionObjects';
import {
  ActionBlock, HeaderBlock, InputBlock, SectionBlock, 
} from '@Lib/slack/blocks';
import { ILogger } from '@Common/logger/ILogger';
import { IQueue, QueueModel, QueueTypes } from '@Models/Queue';
import { SlackMessagePayload } from '@Lib/slack/messagePayloads/MessagePayload';
import { InteractionPayload } from '@Lib/slack/interactivity/types';

type CreateQueueSubmissionData = {
  queue: IQueue;
}

export default class CreateQueueForm {
  static ActionIdentifiers = { 
    SelectQueueType: 'select-new-queue-type',
    InputQueueName: 'input-new-queue-name',
    InputQueueDescription: 'input-new-queue-description',
  };

  static BlockIdentifiers = { 
    SelectQueueType: 'select-new-queue-type' ,
    InputQueueName: 'input-new-queue-name',
    InputQueueDescription: 'input-new-queue-description',
  };

  private alert?: MarkdownTextObject;

  constructor(
    private readonly defaultQueues: QueueModel[],
    private readonly logger: ILogger,
  ) { }

  setAlert(markdownObject: MarkdownTextObject): void {
    this.alert = markdownObject;
  }

  static GetData(logger: ILogger, interactionPayload: InteractionPayload): IQueue{
    const { user: { id: userId }, actions } = interactionPayload;
    logger.debug('Extracted actions from interaction payload', { actions, interactionPayload });

    const [queueTypeAction] = actions
      .filter(action => action.block_id === CreateQueueForm.BlockIdentifiers.SelectQueueType);
    const [queueNameAction] = actions
      .filter(action => action.block_id === CreateQueueForm.BlockIdentifiers.InputQueueName);
    const [queueDescriptionAction] = actions
      .filter(action => action.block_id === CreateQueueForm.BlockIdentifiers.InputQueueDescription);

    const queueType = queueTypeAction?.value;
    const queueName = queueNameAction?.value;
    const queueDescription = queueDescriptionAction?.value;

    if (!queueType || !queueName || !queueDescription) {
      logger.error('Missing expected queue form values', { actions });
      throw new Error('Missing expected queue form values');
    }

    return { 
      id: randomUUID(), 
      name: queueName,
      description: queueDescription, 
    };
  }

  render(): Result<SlackMessagePayload> {
    try {
      const headerSection = new HeaderBlock('Create a new reQuest queue');
      const radioButtons = new RadioButtons(CreateQueueForm.ActionIdentifiers.SelectQueueType)
        .addOption(new OptionObject(
          new TextObject('Personal'),
          QueueTypes.user,
        ));
      const queueTypeBlock = new InputBlock(
        radioButtons, 
        new TextObject('Type'),
        CreateQueueForm.BlockIdentifiers.SelectQueueType,
      );

      const queueNameBlock = new InputBlock(
        new PlainTextInput(CreateQueueForm.ActionIdentifiers.InputQueueName),
        new TextObject('Name'),
        CreateQueueForm.BlockIdentifiers.InputQueueName,
      );
      
      const queueDescriptionBlock = new InputBlock(
        new PlainTextInput(CreateQueueForm.ActionIdentifiers.InputQueueDescription),
        new TextObject('Description'),
        CreateQueueForm.BlockIdentifiers.InputQueueDescription,
      );

      const createButton = new Button(new TextObject('Create'), 'primary', ActionIdentifiers.submitNewQueue);

      const actionBlock = new ActionBlock([
        createButton,
        CancelButton,
      ]);

      const messageBlocks = [
        headerSection,
        queueTypeBlock,
        queueNameBlock,
        queueDescriptionBlock,
        actionBlock,
      ];

      const msgPayload = new MessagePayload(messageBlocks)
        .setResponseType('ephemeral')
        .shouldReplaceOriginal('true');

      this.logger.info('Successfully created CreateQueueForm MessagePayload', { msgPayload });

      return { result: msgPayload.render(), err: undefined };
    } catch (err) {
      this.logger.error('Failed to render CreateQueueForm', { err });
      const message = err instanceof Error ? err.message : 'Failure while rendering CreateQueueForm';
      return { err: new Error(message), result: undefined };
    };
  }

  private generateDefaultQueueInput(): InputBlock {
    const defaultQueueRadioButtons = new RadioButton(SelectionIdentifiers.defaultQueueRadioOption);

    this.defaultQueues.forEach(queue => {
      defaultQueueRadioButtons
        .addOption(new OptionObject(
          new TextObject(queue.name),
          queue.id,
        ));
    });

    return new InputBlock(
      defaultQueueRadioButtons,
      new TextObject('Default Queues:'),
      BlockIdentifiers.defaultQueueInput,
    );
  }

  private generateCustomQueueInput(): InputBlock {
    const customInputField = new PlainTextInput(SelectionIdentifiers.customQueueInput);
    customInputField.setMaxLength(256);
    return new InputBlock(
      customInputField,
      new TextObject('Custom:'),
      BlockIdentifiers.customQueueInput,
    );
  }
}
