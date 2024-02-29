import { randomUUID } from 'node:crypto';

import { Logger } from 'pino';

import { MessagePayload } from '../common/types';
import RadioButton from '../common/blocks/elements/RadioButton';
import { PlainTextObject } from '../common/compositionObjects/TextObject';
import OptionObject from '../common/compositionObjects/OptionObject';
import InputBlock from '../common/blocks/InputBlock';
import QueueDataMapper, { Queue } from '../../datamappers/Queue';
import SlashCommand from '../common/SlashCommand';

import { QueueTypes } from './queue.router';

export default class QueueController {
  private readonly action: string;

  constructor(
    private readonly slashCommand: SlashCommand,
    private readonly logger: Logger,
    private readonly datamapper: QueueDataMapper,
  ) {
    this.action = this.slashCommand.action;
  }

  buildSelectQueueTypeMessage(): MessagePayload {
    const radioButtons = new RadioButton();
    (Object.keys(QueueTypes) as Array<keyof typeof QueueTypes>).forEach(queueType => {
      const queueText = new PlainTextObject(QueueTypes[queueType]);
      radioButtons.addOption(new OptionObject(queueText, queueText.text));
    });
    const radioBlock = new InputBlock(new PlainTextObject('Select queue type'), radioButtons);
    this.logger.info({ radioBlock: radioBlock.render() });
    return { text: 'Some text', blocks: [radioBlock.render()] };
  }

  async createQueue(name: string, userId: string): Promise<Queue> {
    const result = await this.datamapper.create({
      id: randomUUID(),
      name,
      userId,
    });
    this.logger.info({ result }, `Successfully created a new queue "${name}"`);
    return result;
  }

  execute(): MessagePayload | undefined {
    if (this.action === 'create') {
      return this.buildSelectQueueTypeMessage();
    }
  }
}
