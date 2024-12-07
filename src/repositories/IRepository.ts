import {
  QueueMaintainerModel, QueueModel, RequestAssigneeModel, RequestModel, UserModel, 
} from '@Models/index';

export type SupportedModels = UserModel |
  RequestModel |
  QueueModel | 
  QueueMaintainerModel |
  RequestAssigneeModel;

export interface IRepository <T extends SupportedModels> {
  create(model: T): Promise<void>;
  list(whereClause: Partial<T>): Promise<T[]>;
  getById(id: string): Promise<T | undefined>;
  update(id: string, data: Partial<T>): Promise<void>;
  delete(id: string): Promise<void>;
}
