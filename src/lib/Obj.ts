const isAlphanumeric = (str: string): boolean => /^[a-zA-Z0-9]+$/.test(str);

export default class Obj<T extends Record<string, unknown>> {
  constructor(private object: T) { }

  convertToCamel(): void {
    const newObject: Record<string, unknown> = {};
    for (const key in this.object) {
      newObject[this.stringToCamel(key)] = this.object[key];
    }
    this.object = newObject as T;
  }

  convertToSnake(): void {
    const newObject: Record<string, unknown> = {};
    for (const key in this.object) {
      newObject[this.stringToSnake(key)] = this.object[key];
    }
    this.object = newObject as T;
  }

  value(): T {
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
