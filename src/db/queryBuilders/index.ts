export interface IQueryBuilder {
  insert<T extends Record<string, unknown>>(table: string, data: T): Promise<T>;
}

