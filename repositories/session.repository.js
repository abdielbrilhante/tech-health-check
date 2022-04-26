import { Repository } from '../shared/repository.js';

import { react } from '../data/react.js';

const templates = { react };

export class SessionRepository extends Repository {
  getFiltered(filters) {
    const query = this.knex('sessions');

    if (filters.stack) {
      query.andWhere('stack', '=', filters.stack);
    }

    if (filters.dateFrom) {
      query.andWhere('when', '>=', filters.dateFrom);
    }

    if (filters.dateTo) {
      query.andWhere('when', '<=', filters.dateTo);
    }

    const applyTextSearch = (field) => {
      if (filters[field]) {
        query.whereRaw(
          `lower(${field}) like ?`,
          `%${filters[field].toLowerCase()}%`,
        );
      }
    };

    applyTextSearch('tech');
    applyTextSearch('team');
    applyTextSearch('client');
    applyTextSearch('leadName');
    applyTextSearch('leadEmail');

    return query.orderBy('created', 'desc');
  }

  getById(id) {
    return this.knex('sessions').where('id', '=', id).first();
  }

  getByInIds(ids, user) {
    return this.knex('sessions')
      .whereIn('id', ids)
      .andWhere('ownerId', '=', user.id);
  }

  create(data) {
    const { template, ...payload } = data;
    const { stack, tech, topics } = templates[template];
    return this.knex('sessions').insert({
      ...payload,
      stack,
      tech,
      topics: JSON.stringify(topics),
    });
  }

  updateById(id, data) {
    return this.knex('sessions').where('id', '=', id).update(data);
  }

  async saveAnswers(sessionId, answers) {
    await this.knex('answers').insert({
      sessionId: sessionId,
      answers: JSON.stringify(answers),
    });
  }

  sessionAnswers(session) {
    return this.knex('answers').where('sessionId', '=', session.id);
  }
}
