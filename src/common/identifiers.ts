export enum SupportedSlashCommands {
  createQueue = 'create',
  listQueues = 'list',
}

export enum DefaultQueueTypes {
  codeReview = 'code-review',
  release = 'release'
}

export enum BlockIdentifiers {
  submitQueueHeader = 'submit-queue-header',
  defaultQueueInput = 'default-queue-input',
  customQueueInput = 'custom-queue-input',
  submitQueueButtons = 'submit-queue-buttons',

  listedQueueSection = 'listed-queue-section',
}

export enum ActionIdentifiers {
  cancelInteraction = 'cancel-interaction',

  defaultQueueSelected = 'default-queue-selected',
  customInputSelected = 'custom-input-selected',

  queueTypeSelected = 'select-queue-type-action',

  viewQueueAction = 'view-queue-action',
  viewQueueRequests = 'view-queue-requests-action',

  deleteQueue = 'delete-queue-action',

  addQueueRequest = 'add-queue-request-action',
  submitQueueRequest = 'submit-queue-request-action'
}

export enum MessageIdentifiers {
  cancelInteraction = 'cancel-interaction-message',

  selectQueueOwnershipType = 'select-queue-ownership-type-message',
  selectQueueRequestType = 'select-queue-request-type-message',

  listQueuesResponse = 'list-queues-response-message',
  selectQueueToView = 'view-queue-message',
}

