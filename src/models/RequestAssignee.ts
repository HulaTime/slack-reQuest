export interface IRequestAssignee {
  requestId: string;
  userId: string;
}

export class RequestAssigneeModel implements IRequestAssignee {
  constructor(
    public requestId: string,
    public userId: string,
  ) {}
}
