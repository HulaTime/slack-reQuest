import { ActionIdentifiers } from '../common/identifiers';
import { TextObject } from '../lib/slack/compositionObjects';
import { Button } from '../lib/slack/elements';

export const ViewReqButton = (queueId: string): Button => new Button(new TextObject('View requests'), 'primary', ActionIdentifiers.viewQueueRequests)
  .setValue(queueId);
  
export const AddReqButton = (queueId: string): Button => new Button(new TextObject('Add request'), 'primary', ActionIdentifiers.addQueueRequest)
  .setValue(queueId);

export const DeleteQueueButton = (queueId: string): Button => new Button(new TextObject('Delete!'), 'danger', ActionIdentifiers.deleteQueue)
  .setValue(queueId);
