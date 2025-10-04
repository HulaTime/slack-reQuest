export enum AppErrorCodes {
  DataAccess = '1000',
  BadMonkey = '2000'
}

export interface IAppError extends Error { code: AppErrorCodes }

export class AppError extends Error implements IAppError {
  constructor(readonly code: AppErrorCodes, details: { msg?: string; cause?: unknown }) {
    const { msg, cause } = details;
    super(msg, { cause });
  }
}
