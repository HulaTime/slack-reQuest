import { randomUUID } from 'node:crypto';

import supertest, { Response } from 'supertest';

import { app } from '../src/app';
import { SlashCommandReq } from '../src/common/types';
import { getDbConnection } from '../db/init';
import { Queue } from '../datamappers/Queue';

type TestRequest = Partial<SlashCommandReq>;

const getQueueFromDb = async (name: string): Promise<Queue> => {
  const db = getDbConnection();
  return db.select('*').from('queues')
    .where('name', name)
    .first();
};

const postQueueRequest = async (payload: TestRequest): Promise<Response> => supertest(app)
  .post('/queues')
  .set('Content-Type', 'application/x-www-form-urlencoded')
  .send(payload);

describe('POST /queues', () => {
  const queueNameSuffix = randomUUID();

  afterAll(async () => {
    const db = getDbConnection();
    await db('queues').del()
      .where('name', 'like', `%${queueNameSuffix}`);
    await db.destroy();
  });

  describe('Successful request', () => {
    test('I can create a new queue with minimum required parameters', async () => {
      const payload: TestRequest = { text: `new queue${queueNameSuffix}`, user_id: '1234' };
      const { statusCode } = await postQueueRequest(payload);
      expect(statusCode).toEqual(201);
    });

    test('I should get the newly created resources in the response', async () => {
      const payload: TestRequest = { text: `new queue 2${queueNameSuffix}`, user_id: '1234' };
      const { body } = await postQueueRequest(payload);
      expect(body).toEqual({
        id: expect.any(String),
        name: payload.text,
        userId: payload.user_id,
        createdAt: expect.any(String),
      });
    });

    test('A corresponding record should be created in the db', async () => {
      const queueToCreate = `queue 2 ${queueNameSuffix}`;
      const firstResult = await getQueueFromDb(queueToCreate);
      expect(firstResult).not.toBeDefined();
      const payload: TestRequest = { text: queueToCreate, user_id: '1234' };
      await postQueueRequest(payload);
      const secondResult = await getQueueFromDb(queueToCreate);
      expect(secondResult).toEqual({ 
        name: queueToCreate,
        id: expect.any(String),
        created_at: expect.any(Date), 
        user_id: payload.user_id,
      });
    });
  });

  test('I should get a 400 Bad request if I send a request missing required attributes', async () => {
    const payload: TestRequest = { text: `new queue 2${queueNameSuffix}` };
    const { body } = await postQueueRequest(payload);
    expect(body).toEqual({ message: 'Bad Request', errorDetails: { missingFields: ['user_id'] } });
  });
});

