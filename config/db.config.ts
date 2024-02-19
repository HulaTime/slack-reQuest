import * as env from 'env-var';

export const DB_HOST = env.get('DB_HOST')
  .default('127.0.0.1')
  .asString();

export const DB_NAME = env.get('DB_NAME')
  .default('slack-queue')
  .asString();

export const DB_USER = env.get('DB_USER')
  .default('user')
  .asString();

export const DB_PASSWORD = env.get('DB_PASSWORD')
  .default('password')
  .asString();

export const DB_PORT = env.get('DB_PORT')
  .default(54320)
  .asPortNumber();

