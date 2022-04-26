import { ViewSet } from '../shared/viewset.js';
import { SessionService } from '../services/session.service.js';

export class SessionViewSet extends ViewSet {
  service = new SessionService();

  async applyHealthCheck() {
    const session = await this.service.getById(this.req.params.id);
    return this.html({
      template: 'session-apply',
      context: {
        session: session,
      },
    });
  }

  async saveAnswers() {
    await this.service.saveAnswers(this.req.params.id, this.req.body);
    return this.redirect({ to: '/sessions/success' });
  }

  sessionSuccess() {
    return this.html({ template: 'session-success' });
  }

  async sessionList() {
    const sessions = await this.service.filterSessions(this.req.body, this.req.user);
    return this.html({
      template: 'sessions',
      context: {
        sessions,
        values: this.req.body,
      },
    });
  }

  sessionForm() {
    return this.html({
      template: 'session-form',
      context: {
        values: this.req.body,
        errors: this.req.errors,
      },
    });
  }

  async saveSession() {
    try {
      await this.service.save(this.req.body, this.req.user);
      return this.redirect({ to: '/sessions' });
    } catch (error) {
      if (error.status === 400 && error.data) {
        this.req.errors = error.data;
        return this.sessionForm();
      }

      throw error;
    }
  }

  async sessionOverview() {
    const session = await this.service.getById(this.req.params.id, this.req.user);
    const stats = await this.service.computeStats(session);
    return this.html({
      template: 'session-manager',
      context: {
        session: session,
        stats: stats,
      },
    });
  }

  async updateSession() {
    const session = await this.service.closeById(
      this.req.params.id,
      this.req.body,
      this.req.user,
    );
    const stats = await this.service.computeStats(session);
    return this.html({
      template: 'session-manager',
      context: {
        session: session,
        stats: stats,
      },
    });
  }

  async compareSessions() {
    const sessions = await this.service.getManyById(this.req.body.session, this.req.user);

    // TODO: optimize this to have a single SQL query
    await Promise.all(
      sessions.map(async (session) => {
        session.stats = await this.service.computeStats(session);
      }),
    );

    const stats = sessions[0].stats.map(({ topic }, index) => ({
      topic,
      perSession: sessions.map((session) => session.stats[index]),
    }));

    return this.html({
      template: 'session-compare',
      context: {
        sessions: sessions,
        stats: stats,
      },
    });
  }
}
