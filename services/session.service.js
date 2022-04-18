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

    session.when = session.when.toLocaleString()
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

  async computeStats(session) {
    const increments = { bad: 0, neutral: 50, good: 100 };

    const answers = await this.repository.sessionAnswers(session);
    const stats = session.topics.map((item) => ({
      topic: item.topic,
      state: 0,
      stateCount: 0,
      trend: 0,
      trendCount: 0,
    }));

    for (const answerSet of answers) {
      for (const [index, answer] of answerSet.answers.entries()) {
        console.log(answer, increments[answer.state]);
        stats[index].state += increments[answer.state] ?? 0;
        stats[index].trend += increments[answer.trend] ?? 0;

        stats[index].stateCount += increments[answer.state] ? 1 : 0;
        stats[index].trendCount += increments[answer.trend] ? 1 : 0;
      }
    }

    for (const stat of stats) {
      stat.state = Math.round(stat.stateCount ? stat.state / stat.stateCount : 0);
      stat.trend = Math.round(stat.trendCount ? stat.trend / stat.trendCount : 0);

      stat.stateLabel = stat.state === 100 ? 'M' : stat.state;
      stat.trendLabel = stat.trend === 100 ? 'M' : stat.trend;
      stat.hasAnswers = stat.stateCount > 0 || stat.trendCount > 0;
    }

    return stats;
  }
}
