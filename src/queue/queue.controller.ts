import { randomUUID } from 'node:crypto';

import { Logger } from 'pino';

import QueueDataMapper, { Queue } from '../../datamappers/Queue';

export default class QueueController {
  constructor(private readonly logger: Logger, private readonly datamapper: QueueDataMapper) { }

  async createQueue(name: string, userId: string): Promise<Queue> {
    const result = await this.datamapper.create({
      id: randomUUID(),
      name,
      userId,
    });
    this.logger.info({ result }, `Successfully created a new queue "${name}"`);
    return result;
  }
}
