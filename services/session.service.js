import { SessionRepository } from '../repositories/session.repository.js';
import { RequestError } from '../shared/error.js';

const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'America/Fortaleza',
});

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'short',
  timeZone: 'America/Fortaleza',
});

export class SessionService {
  repository = new SessionRepository();

  async filterSessions(filters, user) {
    const sessions = await this.repository.getFiltered(filters ?? new Map(), user);

    return sessions.map((session) => ({
      ...session,
      when: dateTimeFormatter.format(session.when),
    }));
  }

  async getById(id, user) {
    const session = await this.repository.getById(id);
    if (!session || (user && session.ownerId !== user.id) || (!user && !session.open)) {
      throw new RequestError(404);
    }

    session.when = dateTimeFormatter.format(session.when);
    return session;
  }

  async getManyById(ids, user) {
    const sessions = await this.repository.getByInIds(ids, user);
    return sessions.map((session) => ({
      ...session,
      when: dateFormatter.format(session.when),
    }));
  }

  save(form, user) {
    return this.repository.create({ ...form, ownerId: user.id });
  }

  async closeById(id, form, user) {
    const session = await this.repository.getById(id);
    if (!session || (user && session.ownerId !== user.id)) {
      throw new RequestError(404);
    }

    const data = { ...form, open: false };
    await this.repository.updateById(id, data);

    Object.assign(session, data);
    session.when = dateTimeFormatter.format(session.when);
    return session;
  }

  async saveAnswers(sessionId, form) {
    const { topics } = await this.repository.getById(sessionId);
    const answers = Array(topics.length)
      .fill(null)
      .map(() => ({
        state: null,
        trend: null,
      }));

    for (const [key, value] of Object.entries(form)) {
      const [group, index] = key.split('_');
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
        stats[index].state += increments[answer.state] ?? 0;
        stats[index].trend += increments[answer.trend] ?? 0;

        stats[index].stateCount += increments[answer.state] != null ? 1 : 0;
        stats[index].trendCount += increments[answer.trend] != null ? 1 : 0;
      }
    }

    for (const stat of stats) {
      stat.state = Math.round(
        stat.stateCount ? stat.state / stat.stateCount : 0,
      );
      stat.trend = Math.round(
        stat.trendCount ? stat.trend / stat.trendCount : 0,
      );

      stat.stateLabel = stat.state === 100 ? 'M' : stat.state;
      stat.trendLabel = stat.trend === 100 ? 'M' : stat.trend;
      stat.hasAnswers = stat.stateCount > 0 || stat.trendCount > 0;
    }

    return stats;
  }
}
