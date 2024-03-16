import { randomUUID } from 'node:crypto';

export default abstract class Block<RenderType = Record<string, unknown>> {
  type: string;

  blockId: string = randomUUID();

  constructor(type: string) {
    this.type = type;
  };

  abstract render(): RenderType
};

