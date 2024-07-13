export interface IRepository <T> {
  create(model: T): Promise<void>;
  list(whereClause: Partial<T>): Promise<T[]>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
}
