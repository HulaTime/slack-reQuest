import { Logger } from "pino";
import ResponseMessage from "../messages/ResponseMessage";

export default async (responseUrl: string, msg: ResponseMessage, logger: Logger): Promise<void> {
  try {

  } catch (err) {
    logger.error({ err, responseUrl }, `Failed to send a response message to url ${responseUrl}`)
    throw err;
  }
}
