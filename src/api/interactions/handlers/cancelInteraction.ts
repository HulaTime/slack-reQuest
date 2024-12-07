import { MessagePayload } from '@Lib/slack/messagePayloads';
import HttpReq from '@Lib/utils/HttpReq';
import { ILogger } from '@Common/logger/ILogger';

export default async function cancelInteraction(responseUrl: string, logger: ILogger): Promise<void> {
  try {
    logger.info('Handling a cancel interaction action');

    const messagePayload = new MessagePayload()
      .shouldDeleteOriginal(true);

    const httpReq = new HttpReq(responseUrl, logger);
    httpReq.setBody(messagePayload.render());
    await httpReq.post();
  } catch (err) {
    logger.error('There was an error while trying to cancel an interaction', { err });
  }
}
