import { statusMessages } from "./status.js";

export class RequestError extends Error {
  constructor(status) {
    super(statusMessages[status]);
    this.status = status;
  }
}
