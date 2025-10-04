import { IUser, UserModel } from './User';
import { IQueue, QueueModel } from './Queue';
import { IRequest, RequestModel, RequestStatus } from './Request';
import { IQueueMaintainer, QueueMaintainerModel } from './QueueMaintainer';
import { IRequestAssignee, RequestAssigneeModel } from './RequestAssignee';

import { AppError, AppErrorCodes } from '@Lib/errors/AppError';
import { TableNames } from '@DB/tableNames';

type UserModelOptions = { tableName: TableNames.Users; data: IUser }
type QueueModelOptions = { tableName: TableNames.Queues; data: IQueue }
type RequestModelOptions = { tableName: TableNames.Requests; data: IRequest }
type RequestAssigneesModelOptions = { tableName: TableNames.RequestAssignees; data: IRequestAssignee }
type QueueMaintainerModelOptions = { tableName: TableNames.QueueMaintainers; data: IQueueMaintainer }

type ModelOptions = UserModelOptions | 
  QueueModelOptions | 
  RequestModelOptions |
  RequestAssigneesModelOptions |
  QueueMaintainerModelOptions;

export class ModelFactory {
  Create(options: ModelOptions): 
    UserModel | 
    QueueModel |
    RequestModel |
    QueueMaintainerModel | 
    RequestAssigneeModel 
  {
    const { tableName, data } = options; 
    switch (tableName) {
      case TableNames.Users: {
        return new UserModel(data.id, data.name);
      }
      case TableNames.Queues: {
        return new QueueModel({
          id: data.id,
          name: data.name,
          type: data.type,
          owner: data.owner,
          channel: data.channel,
          createdAt: data.createdAt,
        });
      }
      case TableNames.Requests: {
        return new RequestModel(
          data.id,
          data.queueId,
          data.name,
          data.description, 
          data.createdBy, 
          RequestStatus.idle);
      }
      case TableNames.QueueMaintainers: {
        return new QueueMaintainerModel(data.queueId, data.userId);
      }
      case TableNames.RequestAssignees: {
        return new RequestAssigneeModel(data.requestId, data.userId);
      }
      default: {
        throw new AppError(AppErrorCodes.BadMonkey, { msg: `No model available for table ${tableName}` });
      }
    }
  }
}
