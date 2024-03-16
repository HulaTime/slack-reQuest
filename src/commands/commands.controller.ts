import { Logger } from 'pino';

import HeaderBlock from '../common/blocks/HeaderBlock';
import RadioButton from '../common/blocks/elements/RadioButton';
import OptionObject from '../common/compositionObjects/OptionObject';
import SlashCommand from '../common/SlashCommand';
import DividerBlock from '../common/blocks/DividerBlock';
import { Button } from '../common/blocks/elements';
import { ActionBlock } from '../common/blocks';
import { MessagePayload } from '../common/types';
import { PlainTextObject } from '../common/compositionObjects/TextObject';
import QueueDataMapper from '../datamappers/QueueDatamapper';
import SectionBlock from '../common/blocks/SectionBlock';

import { QueueTypes } from './commands.router';

export default class CommandsController {
  private readonly action: string;

  constructor(
    private readonly slashCommand: SlashCommand,
    private readonly logger: Logger,
  ) {
    this.action = this.slashCommand.action;
  }

  buildSelectQueueTypeMessage(): MessagePayload {
    const radioButtons = new RadioButton('select-queue-type');
    (Object.keys(QueueTypes) as Array<keyof typeof QueueTypes>).forEach(queueType => {
      const queueText = new PlainTextObject(QueueTypes[queueType]);
      radioButtons.addOption(new OptionObject(queueText, queueText.text));
    });
    const header = new HeaderBlock(new PlainTextObject('Select queue type'));
    const actionsBlock = new ActionBlock([
      radioButtons,
      new Button(
        new PlainTextObject('Submit'),
        'submit-queue-type',
      ),
    ]);
    this.logger.info({ actionsBlock: actionsBlock.render() });
    return { 
      text: 'Some text',
      blocks: [
        header.render(),
        new DividerBlock().render(),
        actionsBlock.render(),
      ],
    };
  }
  
  async buildListQueuesMessage(): Promise<MessagePayload> {
    const queueDataMapper = new QueueDataMapper(this.logger);
    const queues = await queueDataMapper.list({ userId: this.slashCommand.userId });
    const header = new HeaderBlock(new PlainTextObject('My Queues'));
    const blocks = [
      header.render(),
      new DividerBlock().render(),
    ];
    queues.forEach(queue => {
      blocks.push(new SectionBlock(new PlainTextObject(queue.name)).render());
    });
    return { text: '', blocks };
  }

  async execute(): Promise<MessagePayload | undefined> {
    if (this.action === 'create') {
      return this.buildSelectQueueTypeMessage();
    } else if (this.action === 'list') {
      return await this.buildListQueuesMessage();
    } else {
      this.logger.warn({ action: this.action }, 'Unexpected action type');
    }
  }
}
