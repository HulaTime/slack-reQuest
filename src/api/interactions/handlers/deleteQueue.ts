import { SlackInteractionAction } from '@Lib/slack/messagePayloads/InteractionPayload';
import { MarkdownTextObject, TextObject } from '@Lib/slack/compositionObjects';
import {
  HeaderBlock, SectionBlock, ActionBlock, DividerBlock,
} from '@Lib/slack/blocks';
import { emojis } from '@Common/emojis';
import {
  AddReqButton, CancelButton, DeleteQueueButton, ViewReqButton,
} from '@Common/buttons';
import Block from '@Lib/slack/blocks/Block';
import { MessagePayload } from '@Lib/slack/messagePayloads';
import HttpReq from '@Lib/utils/HttpReq';
import { QueueModel, QueueTypes } from '@Models/Queue';
import { ILogger } from '@Common/logger/ILogger';
import { IRepository } from '@Repos/IRepository';

export default async function deleteQueue(
  action: SlackInteractionAction,
  responseUrl: string,
  ownerId: string,
  channelId: string,
  repository: IRepository<QueueModel>,
  logger: ILogger,
): Promise<void> {
  try {
    logger.info('Handling submission of a delete queue action');

    if (action?.value) {
      logger.error('Action does not have required data values to delete a queue', { action });
      return;
    }

    await repository.delete(JSON.parse(action.value!).id);

    const [personalQueue] = await repository.list({ owner: ownerId, type: QueueTypes.user });

    const channelQueues = await repository.list({ channel: channelId });

    const headerBlock = new HeaderBlock(new TextObject('Available Queues'));
    const personalQueueSection = new SectionBlock(
      new MarkdownTextObject(`${emojis.crown} *${personalQueue.name}*`),
    );
    const personalQueueActionBlock = new ActionBlock(
      [ViewReqButton(JSON.stringify(personalQueue))],
    );
    const blocks: Block[] = [
      headerBlock,
      personalQueueSection,
      personalQueueActionBlock,
      new DividerBlock(),
    ];
    channelQueues.forEach(queue => {
      const queueSection = new SectionBlock(
        new MarkdownTextObject(`${emojis.squares.black.medium} *${queue.name}*`),
      );

      const stringifiedQueue = JSON.stringify(queue);
      const queueButtons = [
        ViewReqButton(stringifiedQueue), AddReqButton(stringifiedQueue), DeleteQueueButton(stringifiedQueue),
      ];
      const queueActionBlock = new ActionBlock(queueButtons);

      blocks.push(queueSection);
      blocks.push(queueActionBlock);
    });

    blocks.push(new ActionBlock([CancelButton]));

    const messagePayload = new MessagePayload(blocks);
    logger.info('Successfully created updated list queues slack message payload', { messagePayload });

    const httpReq = new HttpReq(responseUrl, logger);
    httpReq.setBody(messagePayload.render());
    await httpReq.post();
  } catch (err) {
    logger.error('Failed to delete a queue', { err });
  }
}

