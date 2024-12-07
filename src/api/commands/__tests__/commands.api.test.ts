import 'dotenv/config';
import supertest, { Response } from 'supertest';

import { app } from '../../app';
import { createSlackSignatureFromPayload, jsonToUrlEncoded } from '../../../../tests/helpers';
import { AppConfig } from '../../../../src/config/app.config';
import { getDbConnection } from '../../../../database/init';

import { TestSlashCommandPayload } from './helpers';

const appConfig = new AppConfig();

describe('POST /commands', () => {
  describe('Given I receive a request with NO SLACK SIGNATURE', () => {
    test('Then I should get a 401 Unauthorized response', async () => {
      const { text } = await supertest(app)
        .post('/commands')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send({ foo: 'bar' })
        .expect(401);
      expect(text).toEqual('Unauthorized');
    });
  });

  describe('Given I send a request with an invalid slack signature', () => {
    test('Then I should get a 401 Unauthorized response', async () => {
      const { text } = await supertest(app)
        .post('/commands')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .set('x-slack-signature', 'hello world')
        .set('x-slack-request-timestamp', Date.now().toString())
        .send({ foo: 'bar' })
        .expect(401);
      expect(text).toEqual('Unauthorized');
    });
  });

  describe('Given I send a request with slack signature that is signed with the wrong signature', () => {
    test('Then I should get a 401 Unauthorized response', async () => {
      const body = { foo: 'bar' };
      const form = jsonToUrlEncoded(body);
      const timestamp = Date.now();
      const signature = createSlackSignatureFromPayload(form, timestamp, 'dfd');

      const { text } = await supertest(app)
        .post('/commands')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .set('x-slack-signature', signature)
        .set('x-slack-request-timestamp', timestamp.toString())
        .send(body)
        .expect(401);
      expect(text).toEqual('Unauthorized');
    });
  });

  describe('Given I send a request with slack signature that is valid but does not match the requst payload', () => {
    test('Then I should get a 401 Unauthorized response', async () => {
      const body = { foo: 'bar' };
      const timestamp = Date.now();
      const signature = createSlackSignatureFromPayload(
        jsonToUrlEncoded({ hello: 'world' }),
        timestamp,
        appConfig.slack.signingSecret,
      );

      const { text } = await supertest(app)
        .post('/commands')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .set('x-slack-signature', signature)
        .set('x-slack-request-timestamp', timestamp.toString())
        .send(body)
        .expect(401);
      expect(text).toEqual('Unauthorized');
    });
  });

  describe('Given I send a verified request with an invalid payload', () => {
    test('Then I should get a 400 Bad Request response', async () => {
      const reqPayload = { foo: 'bar' };
      const timestamp = Date.now();
      const form = jsonToUrlEncoded(reqPayload);
      const signature = createSlackSignatureFromPayload(form, timestamp, appConfig.slack.signingSecret);

      const { body } = await supertest(app)
        .post('/commands')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .set('x-slack-signature', signature)
        .set('x-slack-request-timestamp', timestamp.toString())
        .send(reqPayload)
        .expect(400);
      expect(body.message).toEqual('Bad Request');
    });
  });

  describe('Given I have a verified and correctly formatted request', () => {
    describe('When I send a "request" slash command with a "create-queue" action statement', () => {
      const requestCommandPayload = new TestSlashCommandPayload('request', 'create-queue', '9876');
      const timestamp = Date.now();
      const form = jsonToUrlEncoded(requestCommandPayload);
      const signature = createSlackSignatureFromPayload(form, timestamp, appConfig.slack.signingSecret);

      let result: Response;

      beforeAll(async () => {
        result = await supertest(app)
          .post('/commands')
          .set('Content-Type', 'application/x-www-form-urlencoded')
          .set('x-slack-signature', signature)
          .set('x-slack-request-timestamp', timestamp.toString())
          .send(requestCommandPayload);
      });

      test('Then there should be no queues saved to the db yet', async () => {
        const db = getDbConnection();
        const records = await db.select('*')
          .from('queues');
        expect(records).toHaveLength(0);
      });

      test('Then I should get a 200 success', async () => {
        expect(result.statusCode).toEqual(200);
      });

      test('Then the response payload should be an interactive form to create queue', async () => {
        expect(result.body).toEqual({
          blocks: [
            {
              block_id: expect.any(String),
              type: 'section',
              text: {
                text: '*What type of requests should be managed by this queue?*',
                type: 'mrkdwn',
                verbatim: false,
              },
            },
            {
              block_id: expect.any(String),
              type: 'input',
              dispatch_action: false,
              element: {
                action_id: 'default-queue-selection',
                options: [],
                type: 'radio_buttons',
              },
              label: {
                text: 'Default Queues:',
                type: 'plain_text',
              },
              optional: false,
            },
            {
              block_id: expect.any(String),
              dispatch_action: false,
              element: {
                action_id: 'custom-queue-input',
                focus_on_load: false,
                max_length: 256,
                multiline: false,
                type: 'plain_text_input',
              },
              label: {
                text: 'Custom:',
                type: 'plain_text',
              },
              optional: false,
              type: 'input',
            },
            {
              block_id: expect.any(String),
              elements: [
                {
                  action_id: 'submit-new-queue',
                  style: 'primary',
                  text: {
                    text: 'Create',
                    type: 'plain_text',
                  },
                  type: 'button',
                },
                {
                  action_id: 'cancel-interaction',
                  style: 'danger',
                  text: {
                    text: 'Cancel',
                    type: 'plain_text',
                  },
                  type: 'button',
                },
              ],
              type: 'actions',
            },
          ],
          replace_original: 'true',
        });
      });
    });
  });
});

