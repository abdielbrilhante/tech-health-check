import { ViewSet } from "../shared/viewset.js";
import { SessionService } from "../services/session.service.js";

export class SessionViewSet extends ViewSet {
  get routes() {
    return {
      "GET /sessions": this.sessionList,
      "POST /sessions": this.sessionList,
      "GET /sessions/new": this.sessionForm,
      "POST /sessions/new": this.saveSession,
    };
  }

  // GET|POST /sessions
  async sessionList() {
    const service = new SessionService();
    const sessions = await service.filterSessions();
    return this.html({
      status: 200,
      template: "sessions",
      context: {
        sessions,
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
      const service = new SessionService();
      await service.save(req.body);
      return this.redirect({ to: "/sessions" });
    } catch (error) {
      if (error.status === 400 && error.data) {
        req.errors = error.data;
        return this.sessionForm(req);
      }

      throw error;
    }
  }
}
