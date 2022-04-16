import { SessionRepository } from "../repositories/session.repository.js";

export class SessionService {
  filterSessions() {
    const repository = new SessionRepository();
    return repository.getFiltered();
  }
}
