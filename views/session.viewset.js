import { ViewSet } from '../shared/viewset.js';
import { SessionService } from '../services/session.service.js';

export class SessionViewSet extends ViewSet {
  routes = {
    'GET /sessions/apply/:id': this.applyHealthCheck,
    'POST /sessions/apply/:id': this.saveAnswers,
    'GET /sessions/success': this.sessionSuccess,

    'GET /sessions': this.sessionList,
    'POST /sessions': this.sessionList,
    'GET /sessions/new': this.sessionForm,
    'POST /sessions/new': this.saveSession,
    'GET /sessions/manage/:id': this.sessionOverview,
    'PUT /sessions/manage/:id': this.updateSession,
    'POST /sessions/compare': this.compareSessions,
  };

  service = new SessionService();

  async applyHealthCheck(req) {
    const session = await this.service.getById(req.params.id);
    return this.html({
      template: 'session-apply',
      context: {
        session: session,
      },
    });
  }

  async saveAnswers(req) {
    await this.service.saveAnswers(req.params.id, req.body);
    return this.redirect({ to: '/sessions/success' });
  }

  sessionSuccess() {
    return this.html({ template: 'session-success' });
  }

  async sessionList(req) {
    this.requireUser(req);
    const sessions = await this.service.filterSessions(req.body, req.user);
    return this.html({
      template: 'sessions',
      context: {
        sessions,
        values: Object.fromEntries(req.body),
      },
    });
  }

  sessionForm(req) {
    this.requireUser(req);
    return this.html({
      template: 'session-form',
      context: {
        values: Object.fromEntries(req.body),
        errors: req.errors,
      },
    });
  }

  async saveSession(req) {
    this.requireUser(req);

    try {
      await this.service.save(req.body, req.user);
      return this.redirect({ to: '/sessions' });
    } catch (error) {
      if (error.status === 400 && error.data) {
        req.errors = error.data;
        return this.sessionForm(req);
      }

      throw error;
    }
  }

  async sessionOverview(req) {
    this.requireUser(req);
    const session = await this.service.getById(req.params.id, req.user);
    const stats = await this.service.computeStats(session);
    return this.html({
      template: 'session-manager',
      context: {
        session: session,
        stats: stats,
      },
    });
  }

  async updateSession(req) {
    this.requireUser(req);
    const session = await this.service.closeById(
      req.params.id,
      req.body,
      req.user,
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

  async compareSessions(req) {
    this.requireUser(req);
    const ids = [];
    for (const [, value] of req.body) {
      ids.push(value);
    }

    const sessions = await this.service.getManyById(ids, req.user);

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
