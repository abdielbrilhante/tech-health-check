import { Repository } from "../shared/repository.js";

import { react } from "../data/react.js";

const templates = { react };

export class SessionRepository extends Repository {
  getFiltered() {
    return this.knex("sessions");
  }

  create(data) {
    const { template, ...payload } = data;
    const { stack, tech, topics } = templates[template];
    return this.knex("sessions").insert({
      ...payload,
      stack,
      tech,
      topics: JSON.stringify(topics),
    });
  }
}
