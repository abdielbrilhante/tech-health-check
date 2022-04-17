import { SessionRepository } from "../repositories/session.repository.js";
import { RequestError } from "../shared/error.js";
import * as validate from "../shared/validate.js";

export class SessionService {
  constructor() {
    this.repository = new SessionRepository();
  }

  async filterSessions(filters) {
    const sessions = await this.repository.getFiltered(filters ?? new Map());
    return sessions.map((session) => ({
      ...session,
      when: session.when.toLocaleString(),
    }));
  }

  async getById(id) {
    const session = await this.repository.getById(id);
    if (!session) {
      throw new RequestError(404);
    }

    return session;
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

    await this.repository.create(Object.fromEntries(form));
  }

  async saveAnswers(sessionId, form) {
    const { topics } = await this.repository.getById(sessionId);
    const answers = Array(topics.length)
      .fill(null)
      .map(() => ({
        state: null,
        trend: null,
      }));

    for (const [key, value] of form) {
      const [group, index] = key.split("_");
      answers[index][group] = value;
    }

    await this.repository.saveAnswers(sessionId, answers);
  }
}
