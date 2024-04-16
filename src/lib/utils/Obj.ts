const isAlphanumeric = (str: string): boolean => /^[a-zA-Z0-9]+$/.test(str);

export type CamelCase<S extends string> =
  S extends `${infer P}_${infer Q}${infer R}`
  ? `${P}${Capitalize<Q>}${CamelCase<R>}`
  : S;

export type SnakeToCamelCase<T> = {
  [K in keyof T as CamelCase<K & string>]: T[K]
};

export type SnakeCase<S extends string> = 
  S extends `${infer P1}${infer P2}` 
    ? P2 extends Capitalize<P2> 
      ? `${Lowercase<P1>}_${SnakeCase<Lowercase<P2>>}`
      : `${P1}${SnakeCase<P2>}`
    : S;

export type CamelCaseToSnakeCase<T> = {
  [K in keyof T as SnakeCase<K & string>]: T[K]
};

export default class Obj<T extends Record<string, unknown>> {
  constructor(private object: T) { }

  convertToCamel(): SnakeToCamelCase<T> {
    const newObject: Record<string, unknown> = {};
    for (const key in this.object) {
      newObject[this.stringToCamel(key)] = this.object[key];
    }
    return newObject as SnakeToCamelCase<T>;
  }

  convertToSnake(): CamelCaseToSnakeCase<T> {
    const newObject: Record<string, unknown> = {};
    for (const key in this.object) {
      newObject[this.stringToSnake(key)] = this.object[key];
    }
    return newObject as CamelCaseToSnakeCase<T>;
  }

  original(): T {
    return this.object;
  }

  private stringToCamel(input: string): string {
    let output = '';
    let shouldUpperCaseLetter = false;

    for (const letter of input) {
      if (letter !== '-' && letter !== '_') {
        output += shouldUpperCaseLetter ? letter.toUpperCase() : letter;
        shouldUpperCaseLetter = false;
      } else {
        shouldUpperCaseLetter = true;
      }
    }

    return output;
  }

  private stringToSnake(input: string): string {
    let output = '';
    let insertUnderscore = false;
    let previousLetter = '';

    for (const letter of input) {
      if (insertUnderscore) {
        output += ('_' + previousLetter.toLowerCase() + letter);
        insertUnderscore = false;
      } else if (
        isAlphanumeric(letter) &&
        letter === letter.toUpperCase() &&
        previousLetter === previousLetter.toLowerCase()
      ) {
        insertUnderscore = true;
      } else {
        output += letter;
      }
      previousLetter = letter;
    }

    return output;
  }
}
