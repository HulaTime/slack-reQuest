import { inject, injectable } from 'tsyringe';

import CreateQueueForm from '@Ui/forms/CreateQueueForm';
import { ILogger } from '@Common/logger/ILogger';
import { TableNames } from '@DB/tableNames';
import { Tokens } from '@Ioc/Tokens';
import { QueueModel, QueueTypes } from '@Models/Queue';
import { IRepository, RepositoryFactory } from '@Repos/index';
import { SlackMessagePayload } from '@Lib/slack/messagePayloads/MessagePayload';
import { isSuccess } from '@Common/exceptionControl';

@injectable()
export class QueueHandler {
  private readonly queueRepo: IRepository<QueueModel>;

  constructor(
    @inject(Tokens.Get('Logger')) private readonly logger: ILogger,
    @inject(Tokens.Get('RepoFactory')) private readonly repoFactory: RepositoryFactory,
  ) {
    this.queueRepo = this.repoFactory.Create(TableNames.Queues);
  }

  async getDefaultQueues(): Promise<QueueModel[]> {
    try {
      this.logger.debug('Attempting to get default queues');
      const defaultQueues = await this.queueRepo.list({ type: QueueTypes.default });
      this.logger.info('Successfully retrieved default queues', { defaultQueues });
      return defaultQueues;
    } catch (err) {
      this.logger.error('Failed to get default queues', { err });
      throw err;
    }
  }

  async handleCreateQueueCommand(): Promise<SlackMessagePayload> {
    const defaultQueues = await this.getDefaultQueues();
    const createQueueForm = new CreateQueueForm(defaultQueues, this.logger);
    const renderedQueueFormResult = createQueueForm.render(); 
    if (isSuccess(renderedQueueFormResult)) {
      return renderedQueueFormResult.result;
    }
    throw renderedQueueFormResult.err;
  }
}
