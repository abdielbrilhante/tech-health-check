import { statusMessages } from "./status.js";

export class RequestError extends Error {
  constructor(status) {
    const message = statusMessages[status];
    super(`${status} ${message.short}`);
    this.status = status;
    this.body = `${status} ${message.short} - ${message.large}`;
  }
}
