import { TextObject } from '../lib/slack/blocks/compositionObjects';
import { Button } from '../lib/slack/blocks/blockElements';

import { ActionIdentifiers } from './identifiers';

export const CancelButton = new Button(new TextObject('Cancel'), 'danger', ActionIdentifiers.cancel);

export const ViewReqButton = (queueId: string): Button => new Button(new TextObject('View requests'), 'primary', ActionIdentifiers.viewRequests)
  .setValue(queueId);

export const AddReqButton = (queueId: string): Button => new Button(new TextObject('Add request'), 'primary', ActionIdentifiers.generateRequestForm)
  .setValue(queueId);

export const DeleteQueueButton = (queueId: string): Button => new Button(new TextObject('Delete!'), 'danger', ActionIdentifiers.deleteQueue)
  .setValue(queueId);
