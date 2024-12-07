export interface IQueueMaintainer {
  queueId: string;
  userId: string;
}

export class QueueMaintainerModel implements IQueueMaintainer {
  constructor(
    public queueId: string,
    public userId: string,
  ) {}
}
