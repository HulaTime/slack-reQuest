import { randomUUID } from 'crypto';

import { IDataLayer } from '../DataLayer';
import UserRepository, { DBUser } from '../UserRepository';
import { ILogger } from '../../lib/logger';

class MockLogger implements ILogger {
  debug = jest.fn();

  info = jest.fn();

  warn = jest.fn();

  error = jest.fn();

  setCorrelationId = jest.fn();
}

class MockDataLayer implements IDataLayer<DBUser> {
  create = jest.fn();

  update = jest.fn();

  getById = jest.fn();

  list = jest.fn();

  deleteById = jest.fn();

  deleteWhere = jest.fn();
}

describe('UserRepository', () => {
  let mockDataLayer: MockDataLayer;
  let userRepo: UserRepository;

  beforeEach(() => {
    mockDataLayer = new MockDataLayer();
    userRepo = new UserRepository(mockDataLayer, new MockLogger());
  });


  test('Can create a user, with created and updated timestamps', async () => {
    const createMock = jest.fn();
    mockDataLayer.create = createMock;
    const testUser = { id: randomUUID(), name: 'jobe' };
    await userRepo.create(testUser);
    expect(createMock).toHaveBeenCalledWith({
      ...testUser,
      created_at: expect.any(Date),
      updated_at: expect.any(Date),
    });
  });

  test('Can get a user by id', async () => {
    const getMock = jest.fn();
    mockDataLayer.getById = getMock;
    const testUser = { id: randomUUID(), name: 'jobe' };
    await userRepo.getById(testUser.id);
    expect(getMock).toHaveBeenCalledWith(testUser.id);
  });

  test('Can create a user, with created and updated timestamps', async () => {
    const createMock = jest.fn();
    mockDataLayer.create = createMock;
    const testUser = { id: randomUUID(), name: 'jobe' };
    await userRepo.create(testUser);
    expect(createMock).toHaveBeenCalledWith({
      ...testUser,
      created_at: expect.any(Date),
      updated_at: expect.any(Date),
    });
  });

  test('Can create a user, with created and updated timestamps', async () => {
    const createMock = jest.fn();
    mockDataLayer.create = createMock;
    const testUser = { id: randomUUID(), name: 'jobe' };
    await userRepo.create(testUser);
    expect(createMock).toHaveBeenCalledWith({
      ...testUser,
      created_at: expect.any(Date),
      updated_at: expect.any(Date),
    });
  });
});
