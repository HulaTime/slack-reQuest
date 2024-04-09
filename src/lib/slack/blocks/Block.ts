import { randomUUID } from 'node:crypto';

export default abstract class Block<RenderType = Record<string, unknown>> {
  type: string;

  blockId: string;

  constructor(type: string, blockId?: string) {
    this.type = type;
    this.blockId = blockId ?? randomUUID();
  };

  abstract render(): RenderType
};

