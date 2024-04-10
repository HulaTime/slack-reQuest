export enum SupportedSlashCommands {
  createQueue = 'create',
  listQueues = 'list',
}

export enum DefaultQueueTypes {
  codeReview = 'code-review',
  release = 'release'
}

export enum BlockIdentifiers {
  selectQueueSection = 'select-queue-section',
  selectQueueMenu = 'select-queue-menu',
  selectQueueAction = 'select-queue-action',

  listedQueueSection = 'listed-queue-section',
}

export enum ActionIdentifiers {
  cancelInteraction = 'cancel-interaction',
  selectQueueType = 'select-queue-type',

  viewQueueAction = 'view-queue-action',
  viewQueueRequests = 'view-queue-requests',

  addQueueRequest = 'add-queue-request',
  deleteQueue = 'delete-queue',
}

export enum MessageIdentifiers {
  selectQueueOwnershipType = 'select-queue-ownership-type-message',
  selectQueueRequestType = 'select-queue-request-type-message',
  
  cancelInteraction = 'cancel-interaction-message',
  listQueuesResponse = 'list-queues-response-message',
  selectQueueToView = 'view-queue-message',
}

