export default class CancelInteractionResponseMessage {
  render(): {delete_original: boolean} {
    return { delete_original: true };
  }
}
