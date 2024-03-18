import { randomUUID } from 'crypto';

import { app } from '../../src/app';
import { getDbConnection } from '../../src/db/init';
import { UserRequest } from '../helpers/requests';
import { slackPlainTextObject, slackOptionObject } from '../helpers/slack';

const selectQueueSlackRadioButtons = {
  blocks: [
    {
      block_id: expect.any(String),
      text: slackPlainTextObject('Select queue type'),
      type: 'header',
    },
    {
      block_id: expect.any(String),
      type: 'divider',
    },
    {
      block_id: expect.any(String),
      elements: [
        {
          action_id: 'select-queue-type',
          options: [
            slackOptionObject(slackPlainTextObject('Direct Request'), 'Direct Request'),
            slackOptionObject(slackPlainTextObject('Code Review'), 'Code Review'),
            slackOptionObject(slackPlainTextObject('Release'), 'Release'),
          ],
          type: 'radio_buttons',
        },
        {
          action_id: 'submit-queue-type',
          text: slackPlainTextObject('Submit'),
          type: 'button',
        },
      ],
      type: 'actions',
    },
  ],
  text: 'select-queue-message',
};

describe('POST /commands "create"', () => {
  const queueNameSuffix = randomUUID();

  afterAll(async () => {
    const db = getDbConnection();
    await db('queues').del()
      .where('name', 'like', `%${queueNameSuffix}`);
    await db.destroy();
  });

  test('I should receive a 200 success response', async () => {
    const userRequest = new UserRequest(app);
    const { statusCode } = await userRequest.sendCommand('slackq', 'create');
    expect(statusCode).toEqual(200);
  });

  test('I should receive a response payload with radio buttons to select the type of queue I want to create', async () => {
    const userRequest = new UserRequest(app);
    const { body } = await userRequest.sendCommand('slackq', 'create');
    expect(body).toEqual(selectQueueSlackRadioButtons);
  });
});
