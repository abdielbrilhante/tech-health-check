import { Repository } from "../shared/repository.js";

import { react } from "../data/react.js";

const templates = { react };

export class SessionRepository extends Repository {
  getFiltered(filters) {
    const query = this.knex("sessions").whereNull("archived");

    if (filters.get("stack")) {
      query.andWhere("stack", "=", filters.get("stack"));
    }

    if (filters.get("dateFrom")) {
      query.andWhere("when", ">=", filters.get("dateFrom"));
    }

    if (filters.get("dateTo")) {
      query.andWhere("when", "<=", filters.get("dateTo"));
    }

    const applyTextSearch = (field) => {
      if (filters.get(field)) {
        query.whereRaw(
          `lower(${field}) like ?`,
          `%${filters.get(field).toLowerCase()}%`
        );
      }
    };

    applyTextSearch("tech");
    applyTextSearch("team");
    applyTextSearch("client");
    applyTextSearch("leadName");
    applyTextSearch("leadEmail");

    return query.orderBy("created", "desc");
  }

  getById(id) {
    return this.knex("sessions").where("id", "=", id).first();
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

  async saveAnswers(sessionId, answers) {
    await this.knex("answers").insert({
      sessionId: sessionId,
      answers: JSON.stringify(answers),
    });
  }

  sessionAnswers(session) {
    return this.knex('answers').where('sessionId', '=', session.id);
  }
}
