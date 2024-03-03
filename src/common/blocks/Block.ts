import { randomUUID } from 'node:crypto';

export default abstract class Block<RenderType> {
  type: string;

  blockId: string = randomUUID();

  constructor(type: string) {
    this.type = type;
  };

  abstract render(): RenderType
};

