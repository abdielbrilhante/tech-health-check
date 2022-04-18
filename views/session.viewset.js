import { ViewSet } from "../shared/viewset.js";
import { SessionService } from "../services/session.service.js";

export class SessionViewSet extends ViewSet {
  constructor() {
    super();
    this.service = new SessionService();
  }

  get routes() {
    return {
      public: {
        "GET /sessions/apply/:id": this.applyHealthCheck,
        "POST /sessions/apply/:id": this.saveAnswers,
        "GET /sessions/success": this.sessionSuccess,
      },
      protected: {
        "GET /sessions": this.sessionList,
        "POST /sessions": this.sessionList,
        "GET /sessions/new": this.sessionForm,
        "POST /sessions/new": this.saveSession,
        "GET /sessions/manage/:id": this.sessionOverview,
        "POST /sessions/manage/:id": this.updateSession,
      },
    };
  }

  // GET|POST /sessions
  async sessionList(req) {
    const sessions = await this.service.filterSessions(req.body, req.user);
    return this.html({
      status: 200,
      template: "sessions",
      context: {
        sessions,
        values: Object.fromEntries(req.body),
      },
    });
  }

  // GET /sessions/new
  async sessionForm(req) {
    return this.html({
      status: 200,
      template: "session-form",
      context: {
        values: Object.fromEntries(req.body),
        errors: req.errors,
      },
    });
  }

  // POST /sessions
  async saveSession(req) {
    try {
      await this.service.save(req.body, req.user);
      return this.redirect({ to: "/sessions" });
    } catch (error) {
      if (error.status === 400 && error.data) {
        req.errors = error.data;
        return this.sessionForm(req);
      }

      throw error;
    }
  }

  // GET /sessions/apply/:id
  async applyHealthCheck(req) {
    const session = await this.service.getById(req.params.id);
    return this.html({
      status: 200,
      template: "session-apply",
      context: {
        session: session,
      },
    });
  }

  // POST /sessions/apply/:id
  async saveAnswers(req) {
    await this.service.saveAnswers(req.params.id, req.body);
    return this.redirect({ to: "/sessions/success" });
  }

  // GET /sessions/success
  async sessionSuccess() {
    return this.html({
      status: 200,
      template: "session-success",
    });
  }

  // GET /sessions/manage/:id
  async sessionOverview(req) {
    const session = await this.service.getById(req.params.id, req.user);
    const stats = await this.service.computeStats(session, req.user);
    return this.html({
      status: 200,
      template: "session-manager",
      context: {
        session: session,
        stats: stats,
      },
    });
  }

  // POST /sessions/manage/:id
  async updateSession() {}
}
