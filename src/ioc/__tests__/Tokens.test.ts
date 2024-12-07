import { Tokens } from '../Tokens';

describe('Tokens class: used for dependency injection', () => {
  test('it should exist', () => {
    expect(Tokens).toBeDefined();
  });

  test('I can get a token that has not been defined previously', () => {
    const newToken = Tokens.Get('Logger');
    expect(newToken).toBeDefined();
  });

  test('If I get a token, it should be a symbol', () => {
    const newToken = Tokens.Get('Logger');
    expect(typeof newToken).toBe('symbol');
  });

  test('If I create a new token, the symbol description should be the token name', () => {
    const newToken = Tokens.Get('Logger');
    // @ts-expect-error testing underlying symbol
    expect(newToken.description).toBe('Logger');
  });

  test('If I create 2 tokens with the same name, they should be exactly equal to each other', () => {
    const newToken = Tokens.Get('Logger');
    const newToken2 = Tokens.Get('Logger');
    expect(newToken).toStrictEqual(newToken2);
  });

  test('If I create 2 tokens with modules loaded at different times, they should still strictly equal each other', async () => {
    const loadTokens = async (): Promise<typeof Tokens> => {
      const { Tokens } = await import('../Tokens');
      return Tokens;
    };
    const Tokens1 = await loadTokens();
    const Tokens2 = await loadTokens();
    const newToken1 = Tokens1.Get('Logger');
    const newToken2 = Tokens2.Get('Logger');
    expect(newToken1).toStrictEqual(newToken2);
  });
});
