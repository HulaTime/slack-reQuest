const isAlphanumeric = (str: string): boolean => /^[a-zA-Z0-9]+$/.test(str);

export type SnakeToCamelCase<S extends string> = S extends `${infer T}_${infer U}`
  ? `${T}${Capitalize<SnakeToCamelCase<U>>}`
  : S;

export type ConvertSnakeToCamel<T> = {
  [K in keyof T as SnakeToCamelCase<K & string>]: T[K]
};

export type CamelToSnakeCase<S extends string> = S extends `${infer T}${infer U}`
  ? U extends Uncapitalize<U>
  ? `${T}${CamelToSnakeCase<U>}`
  : `${T}_${CamelToSnakeCase<Uncapitalize<U>>}`
  : S;

export type ConvertCamelToSnake<T> = {
  [K in keyof T as CamelToSnakeCase<K & string>]: T[K]
};

export default class Obj<T extends Record<string, unknown>> {
  constructor(private object: T) { }

  getOriginal(): T {
    return this.object;
  }

  convertToCamel(): ConvertSnakeToCamel<T> {
    const newObject: Record<string, unknown> = {};
    for (const key in this.object) {
      newObject[this.stringToCamel(key)] = this.object[key];
    }
    return newObject as ConvertSnakeToCamel<T>;
  }

  convertToSnake(): ConvertCamelToSnake<T> {
    const newObject: Record<string, unknown> = {};
    for (const key in this.object) {
      newObject[this.stringToSnake(key)] = this.object[key];
    }
    return newObject as ConvertCamelToSnake<T>;
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
