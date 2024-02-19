import { randomUUID } from 'node:crypto';

import { Logger } from 'pino';

import QueueDataMapper from '../../datamappers/Queue';

export default class QueueController {
  constructor(private readonly logger: Logger, private readonly datamapper: QueueDataMapper) {}

  async createQueue(name: string): Promise<void> {
    const result = await this.datamapper.create({ 
      id: randomUUID(),
      name,
    });
    this.logger.info({ result },`Successfully created a new queue "${name}"`);
  }
}
