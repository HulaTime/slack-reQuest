export type Success<T> = { result: T; err: void }

export type Failure = { result: void; err: Error }

export type Result<T> = Success<T> | Failure; 

export const isSuccess = <T>(input: Result<T>): input is Success<T> => !input.err;

export const isFailure = <T>(input: Result<T>): input is Failure => !input.result;
