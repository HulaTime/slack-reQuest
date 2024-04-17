import { ActionIdentifiers } from '../common/identifiers';
import { TextObject } from '../lib/slack/compositionObjects';
import { Button } from '../lib/slack/elements';

export const ViewReqButton = (queueId: string): Button => new Button(ActionIdentifiers.viewQueueRequests, new TextObject('View requests'), 'primary')
  .setValue(queueId);
  
export const AddReqButton = (queueId: string): Button => new Button(ActionIdentifiers.addQueueRequest, new TextObject('Add request'), 'primary')
  .setValue(queueId);

export const DeleteQueueButton = (queueId: string): Button => new Button(ActionIdentifiers.deleteQueue, new TextObject('Delete!'), 'danger')
  .setValue(queueId);
