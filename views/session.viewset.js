import { ViewSet } from "../shared/viewset.js";
import { SessionService } from "../services/session.service.js";

export class SessionViewSet extends ViewSet {
  get routes() {
    return {
      "GET /sessions": this.sessionList,
      "POST /sessions": this.sessionList,
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
}
