export class RequestError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
    this.body = message ?? 'Internal server error';
  }
}
