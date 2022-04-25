import { statusMessages } from './status.js';

export class RequestError extends Error {
  constructor(status, data) {
    super(statusMessages[status]);
    this.status = status;
    this.data = data;
  }
}
