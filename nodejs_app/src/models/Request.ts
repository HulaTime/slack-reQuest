export enum RequestStatus {
  idle = 'Idle',
  inProgress = 'In Progress',
  done = 'Done',
  rejected = 'Rejected',
}

export interface IRequest {
  id: string;
  queueId: string;
  name: string;
  description: string;
  createdBy: string;
  status: RequestStatus;
}

export class RequestModel implements IRequest {
  constructor(
    public id: string,
    public queueId: string, 
    public name: string,
    public description: string,
    public createdBy: string, 
    public status: RequestStatus,
  ) {}
}
