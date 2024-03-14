import Obj from '../Obj';

describe('Obj', () => {
  test('it can be instantiated', () => {
    new Obj({});
  });

  describe('#value', () => {
    test('returns the raw object that the class was instantiated with', () => {
      const obj = new Obj({ foo: 'bar' });
      expect(obj.value()).toEqual({ foo: 'bar' });
    });
  });

  describe('#convertToCamel', () => {
    test('converts all the instantiated objects keys to camelCase', () => {
      const obj = new Obj({ foo_bar: 'boop' });
      obj.convertToCamel();
      expect(obj.value()).toEqual({ fooBar: 'boop' });
    });

    test('converts all the instantiated objects keys to camelCase, with multiple keys', () => {
      const obj = new Obj({ foo_bar: 'boop', triangle_floor: 'goop' });
      obj.convertToCamel();
      expect(obj.value()).toEqual({ fooBar: 'boop', triangleFloor: 'goop' });
    });

    test('does not modify keys that are already camel cased', () => {
      const obj = new Obj({ fooBar: 'boop', triangleFloor: 'goop' });
      obj.convertToCamel();
      expect(obj.value()).toEqual({ fooBar: 'boop', triangleFloor: 'goop' });
    });
  });

  describe('#convertToSnake', () => {
    test('converts all the instantiated objects keys to snakeCase', () => {
      const obj = new Obj({ fooBar: 'boop' });
      obj.convertToSnake();
      expect(obj.value()).toEqual({ foo_bar: 'boop' });
    });

    test('converts all the instantiated objects keys to snakeCase, with multiple keys', () => {
      const obj = new Obj({ fooBar: 'boop', triangleFloor: 'goop' });
      obj.convertToSnake();
      expect(obj.value()).toEqual({ foo_bar: 'boop', triangle_floor: 'goop' });
    });

    test('does not modify keys that are already snake cased', () => {
      const obj = new Obj({ foo_bar: 'boop', triangle_floor: 'goop' });
      obj.convertToSnake();
      expect(obj.value()).toEqual({ foo_bar: 'boop', triangle_floor: 'goop' });
    });
  });
});

