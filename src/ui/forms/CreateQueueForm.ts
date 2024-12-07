import { CancelButton } from '@Common/buttons';
import { Result } from '@Common/exceptionControl';
import { ActionIdentifiers, BlockIdentifiers, SelectionIdentifiers } from '@Common/identifiers';
import { InteractionPayload, MessagePayload } from '@Lib/slack/messagePayloads';
import { Button, PlainTextInput, RadioButton } from '@Lib/slack/elements';
import { MarkdownTextObject, OptionObject, TextObject } from '@Lib/slack/compositionObjects';
import { ActionBlock, InputBlock, SectionBlock } from '@Lib/slack/blocks';
import { ILogger } from '@Common/logger/ILogger';
import { QueueModel } from '@Models/Queue';
import { SlackMessagePayload } from '@Lib/slack/messagePayloads/MessagePayload';

type CreateQueueSubmissionData = {
  defaultQueueValue: string;
  customQueueValue: string;
};

export default class CreateQueueForm {
  private alert?: MarkdownTextObject;

  constructor(
    private readonly defaultQueues: QueueModel[],
    private readonly logger: ILogger,
  ) { }

  setAlert(markdownObject: MarkdownTextObject): void {
    this.alert = markdownObject;
  }

  static GetData(interactionPayload: InteractionPayload): CreateQueueSubmissionData {
    const defaultQueueValue = interactionPayload
      .getBlockStateValue(BlockIdentifiers.defaultQueueInput, SelectionIdentifiers.defaultQueueRadioOption);

    const customQueueValue = interactionPayload
      .getBlockStateValue(BlockIdentifiers.customQueueInput, SelectionIdentifiers.customQueueInput);

    return { defaultQueueValue, customQueueValue };
  }

  render(): Result<SlackMessagePayload> {
    try {
      const defaultQueueInput = this.generateDefaultQueueInput();
      const customQueueInput = this.generateCustomQueueInput();


      const headerSection = new SectionBlock(
        this.alert ?? new MarkdownTextObject('*What type of requests should be managed by this queue?*'),
      );

      const createButton = new Button(new TextObject('Create'), 'primary', ActionIdentifiers.submitNewQueue);

      const actionBlock = new ActionBlock([
        createButton,
        CancelButton,
      ]);

      const messageBlocks = [
        headerSection,
        defaultQueueInput,
        customQueueInput,
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
