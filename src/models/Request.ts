import { randomUUID } from 'node:crypto';

export enum RequestStatus {
  idle = 'Idle',
  inProgress = 'In Progress',
  done = 'Done',
  rejected = 'Rejected',
}

export interface IRequest {
  id: string;
  queueId: string;
  description: string;
  type: string;
  owner: string;
  channel: string;
  status: RequestStatus;
  title?: string;
  assignee?: string;
}

type RequestAttributes = Omit<IRequest, 'id'> & { id?: string }

export class RequestModel implements IRequest {
  id: string;

  queueId: string;

  description: string;

  type: string;

  owner: string;

  channel: string;

  status: RequestStatus;

  title?: string;

  assignee?: string;

  constructor(attributes: RequestAttributes) {
    this.id = attributes.id ?? randomUUID();
    this.queueId = attributes.queueId;
    this.description = attributes.description;
    this.type = attributes.type;
    this.owner = attributes.owner;
    this.channel = attributes.channel;
    this.status = attributes.status;
    this.title = attributes.title ?? undefined;
    this.assignee = attributes.assignee ?? undefined;
  }
}
