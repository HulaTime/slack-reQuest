import { ActionIdentifiers, BlockIdentifiers, SelectionIdentifiers } from '@Common/identifiers';
import { ActionBlock, InputBlock } from '@Lib/slack/blocks';
import { TextObject } from '@Lib/slack/blocks/compositionObjects';
import { Button, PlainTextInput } from '@Lib/slack/blocks/blockElements';
import { CancelButton } from '@Common/buttons';
import { MessagePayload } from '@Lib/slack/messagePayloads';
import HttpReq from '@Lib/utils/HttpReq';
import { SlackInteractionAction } from '@Lib/slack/messagePayloads/InteractionPayload';
import { ILogger } from '@Common/logger/ILogger';
import { AppConfig } from '@Config/app.config';

const appConfig = new AppConfig();

export default async function generateRequestForm(
  action: SlackInteractionAction,
  responseUrl: string,
  logger: ILogger,
): Promise<void> {
  try {
    logger.info('Handling submission of a create request action');

    const inputElement = new PlainTextInput(SelectionIdentifiers.requestInputField);
    inputElement.setMaxLength(appConfig.queueMaxCharLength);
    inputElement.multiline = true;
    const inputBlock = new InputBlock(inputElement, new TextObject('What is your request?'), BlockIdentifiers.newRequestInput);

    const submitButton = new Button(new TextObject('Submit'), 'primary', ActionIdentifiers.newRequestSubmitted);
    submitButton.setValue(action!.value!);

    const actionBlock = new ActionBlock([submitButton, CancelButton], BlockIdentifiers.newRequestButtons);

    const messagePayload = new MessagePayload([inputBlock, actionBlock]);

    const httpReq = new HttpReq(responseUrl, logger);
    httpReq.setBody(messagePayload.render());
    await httpReq.post();
  } catch (err) {
    logger.error('There was an error while trying to add a request', { err });
  }
}
