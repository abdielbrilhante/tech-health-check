import { SessionRepository } from "../repositories/session.repository.js";
import { RequestError } from "../shared/error.js";
import * as validate from "../shared/validate.js";

export class SessionService {
  async filterSessions() {
    const repository = new SessionRepository();
    const sessions = await repository.getFiltered();
    return sessions.map((session) => ({
      ...session,
      when: session.when.toLocaleString(),
    }));
  }

  async save(form) {
    const errors = validate.required(form, [
      "template",
      "team",
      "client",
      "leadName",
      "leadEmail",
      "when",
    ]);

    if (errors.length > 0) {
      throw new RequestError(400, Object.fromEntries(errors));
    }

    const repository = new SessionRepository();
    await repository.create(Object.fromEntries(form));
  }
}
