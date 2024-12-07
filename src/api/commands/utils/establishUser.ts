import { UserModel } from '@Models/User';
import { IRepository } from '@Repos/IRepository';
import { SlashCommand } from '@Lib/slack/slashCommands';
import { Result } from '@Common/exceptionControl';
import { ILogger } from '@Lib/logger';

export default async function establishUser(
  slashCommand: SlashCommand,
  userRepository: IRepository<UserModel>,
  logger: ILogger,
): Promise<Result<UserModel>> {
  try {
    const [existingUser] = await userRepository.list({ id: slashCommand.userId });
    if (existingUser) {
      logger.info( 'Found existing user for slash command', { existingUser });
      return { result: existingUser, err: undefined };
    }
    const newUser = new UserModel(slashCommand.userId, slashCommand.userName);
    await userRepository.create(newUser);
    return { result: newUser, err: undefined };
  } catch (err) {
    logger.error('Failed to establish user in database', { err });
    const message = err instanceof Error ? err.message : 'Failed to establish a user';
    return { err: new Error(message), result: undefined };
  }
}
