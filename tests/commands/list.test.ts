import { app } from '../../src/app';
import { getDbConnection } from '../../src/db/init';
import { UserRequest } from '../helpers/requests';

describe('POST /commands "list"', () => {
  afterAll(async () => {
    const db = getDbConnection();
    await db.destroy();
  });

  test('I should receive a 200 success response', async () => {
    const userRequest = new UserRequest(app);
    const { statusCode } = await userRequest.sendCommand('slackq', 'list');
    expect(statusCode).toEqual(200);
  });
});
