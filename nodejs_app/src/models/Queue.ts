import { randomUUID } from 'node:crypto';

export enum QueueTypes {
  user = 'user',
  channel = 'channel',
  default = 'default',
}
  
export interface IQueue {
  id: string;
  name: string;
  type: QueueTypes;
  createdAt: Date;
  updatedAt: Date;
  owner?: string;
  channel?: string;
}

type QueueAttributes = Omit<IQueue, 'id'> & { id?: string }

export class QueueModel implements IQueue {
  id: string;

  name: string;

  type: QueueTypes;

  createdAt: Date;

  updatedAt: Date;

  owner?: string;

  channel?: string;

  constructor(attributes: QueueAttributes) {
    this.id = attributes.id ?? randomUUID();
    this.name = attributes.name;
    this.type = attributes.type;
    this.createdAt = attributes.createdAt;
    this.owner = attributes.owner ?? undefined;
    this.channel = attributes.channel ?? undefined;
  }
}
