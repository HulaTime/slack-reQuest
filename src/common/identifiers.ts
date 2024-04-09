export enum DefaultQueueTypes {
  codeReview = 'code-review',
  release = 'release'
}

export enum BlockIdentifiers {
  selectQueueSection = 'select-queue-section',
  selectQueueMenu = 'select-queue-menu',
  selectQueueAction = 'select-queue-action',
}

export enum ActionIdentifiers {
  selectQueueType = 'select-queue-type',
  cancelInteraction = 'cancel-interaction',
}

export enum MessageIdentifiers {
  selectQueueOwnershipType = 'select-queue-ownership-type-message',
  selectQueueRequestType = 'select-queue-request-type-message',
  
  cancelInteraction = 'cancel-interaction-message',
  listQueuesResponse = 'list-queues-response-message',
  selectQueueToView = 'view-queue-message',
}

