import Obj from '../Obj';

describe('Obj', () => {
  test('it can be instantiated', () => {
    new Obj({});
  });

  describe('#value', () => {
    test('returns the raw object that the class was instantiated with', () => {
      const obj = new Obj({ foo: 'bar' });
      expect(obj.original()).toEqual({ foo: 'bar' });
    });
  });

  describe('#convertToCamel', () => {
    test('returns object with camelCased keys from the original object', () => {
      const obj = new Obj({ foo_bar: 'boop' });
      expect(obj.convertToCamel()).toEqual({ fooBar: 'boop' });
    });

    test('returns object with camelCased keys from the original object when there are multiple keys', () => {
      const obj = new Obj({ foo_bar: 'boop', triangle_floor: 'goop' });
      expect(obj.convertToCamel()).toEqual({ fooBar: 'boop', triangleFloor: 'goop' });
    });

    test('does not modify keys that are already camel cased', () => {
      const obj = new Obj({ fooBar: 'boop', triangleFloor: 'goop' });
      expect(obj.convertToCamel()).toEqual({ fooBar: 'boop', triangleFloor: 'goop' });
    });
  });

  describe('#convertToSnake', () => {
    test('converts all the instantiated objects keys to snakeCase', () => {
      const obj = new Obj({ fooBar: 'boop' });
      expect(obj.convertToSnake()).toEqual({ foo_bar: 'boop' });
    });

    test('converts all the instantiated objects keys to snakeCase, with multiple keys', () => {
      const obj = new Obj({ fooBar: 'boop', triangleFloor: 'goop' });
      expect(obj.convertToSnake()).toEqual({ foo_bar: 'boop', triangle_floor: 'goop' });
    });

    test('does not modify keys that are already snake cased', () => {
      const obj = new Obj({ foo_bar: 'boop', triangle_floor: 'goop' });
      expect(obj.convertToSnake()).toEqual({ foo_bar: 'boop', triangle_floor: 'goop' });
    });
  });
});

