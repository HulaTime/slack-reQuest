import { Logger } from 'pino';

import QueueDataMapper from '../datamappers/QueueDatamapper';
import MessagePayload, { SlackMessagePayload } from '../lib/slack/messages/MessagePayload';
import { SlashCommand } from '../lib/slack/messages';
import { TextObject } from '../lib/slack/compositionObjects';
import { MessageIdentifiers } from '../common/identifiers';
import { DividerBlock, HeaderBlock, SectionBlock } from '../lib/slack/blocks';
import SelectQueueOwnershipTypeMsg from '../lib/slack/messages/SelectQueueOwnershipTypeMsg';

enum SupportedCommands {
  create = 'create',
  list = 'list',
}

export default class CommandsController {
  private readonly action: string;

  constructor(
    private readonly slashCommand: SlashCommand,
    private readonly logger: Logger,
  ) {
    this.action = this.slashCommand.action;
  }

  async listQueuesMessage(): Promise<SlackMessagePayload> {
    const queueDataMapper = new QueueDataMapper(this.logger);
    const queues = await queueDataMapper.list({ userId: this.slashCommand.userId });
    const header = new HeaderBlock(new TextObject('My Queues'));
    const blocks = [
      header,
      new DividerBlock(),
    ];
    queues.forEach(queue => {
      blocks.push(new SectionBlock(new TextObject(queue.name)));
    });
    const messagePayload = new MessagePayload(MessageIdentifiers.listQueueMsg, blocks);
    this.logger.info({ messagePayload }, 'Successfully created list queues slack message payload');
    return messagePayload.render();
  }

  unexpectedActionMessage(action: string): SlackMessagePayload {
    const messagePayload = new MessagePayload(`${action} is not a supported command.`, []);
    return messagePayload.render();
  }

  async execute(): Promise<SlackMessagePayload> {
    if (this.action === SupportedCommands.create) {
      const selectQueueTypeMsg = new SelectQueueOwnershipTypeMsg();
      return selectQueueTypeMsg.render();
    } else if (this.action === SupportedCommands.list) {
      return await this.listQueuesMessage();
    } else {
      this.logger.warn({ action: this.action }, 'Unexpected action type');
      return this.unexpectedActionMessage(this.action);
    }
  }
}
