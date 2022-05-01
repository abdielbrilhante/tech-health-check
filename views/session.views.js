import * as yup from 'yup';

import { userMiddleware } from '../middleware/user.middleware.js';
import { View } from '../shared/view.js';
import { SessionService } from '../services/session.service.js';

const service = new SessionService();

export const applyHealthCheck = new View()
  .get('/sessions/apply/:id')
  .params({ id: yup.number().required() })
  .handler(async (req) => {
    const session = await service.getById(req.params.id);
    return View.html({
      template: 'session-apply',
      context: {
        session: session,
      },
    });
  });

export const saveAnswers = new View()
  .post('/sessions/apply/:id')
  .params({ id: yup.number().required() })
  .handler(async (req) => {
    await service.saveAnswers(req.params.id, req.body);
    return View.redirect({ to: '/sessions/success' });
  });

export const sessionSuccess = new View()
  .get('/sessions/success')
  .handler(() => View.html({ template: 'session-success' }));

export const sessionList = new View()
  .get('/sessions')
  .post('/sessions')
  .middleware(userMiddleware)
  .body({
    stack: yup.string().oneOf(['', 'frontend', 'backend', 'mixed']),
    dateFrom: yup.string(),
    dateTo: yup.string(),
    tech: yup.string(),
    team: yup.string(),
    client: yup.string(),
    leadName: yup.string(),
    leadEmail: yup.string().email(),
  })
  .handler(async (req) => {
    const sessions = await service.filterSessions(req.body, req.user);
    return View.html({
      template: 'sessions',
      context: {
        sessions,
        values: req.body,
      },
    });
  });

export const sessionForm = new View()
  .get('/sessions/new')
  .middleware(userMiddleware)
  .handler((req) => {
    return View.html({
      template: 'session-form',
      context: {
        values: req.body,
        errors: req.errors,
      },
    });
  });

export const saveSession = new View()
  .post('/sessions/new')
  .middleware(userMiddleware)
  .body({
    template: yup.string().oneOf(['react']).required(),
    when: yup.date().min(new Date()).required(),
    team: yup.string().required(),
    client: yup.string().required(),
    leadName: yup.string().required(),
    leadEmail: yup.string().email().required(),
  })
  .handler(async (req) => {
    try {
      await service.save(req.body, req.user);
      return View.redirect({ to: '/sessions' });
    } catch (error) {
      if (error.status === 400 && error.data) {
        req.errors = error.data;
        return this.sessionForm();
      }

      throw error;
    }
  });

export const sessionOverview = new View()
  .get('/sessions/manage/:id')
  .params({ id: yup.number().required() })
  .middleware(userMiddleware)
  .handler(async (req) => {
    const session = await service.getById(req.params.id, req.user);
    const stats = await service.computeStats(session);
    return View.html({
      template: 'session-manager',
      context: {
        session: session,
        stats: stats,
      },
    });
  });

export const updateSession = new View()
  .post('/sessions/manage/:id')
  .params({ id: yup.number().required() })
  .body({ notes: yup.string().required() })
  .middleware(userMiddleware)
  .handler(async (req) => {
    const session = await service.closeById(
      req.params.id,
      req.body,
      req.user,
    );
    const stats = await service.computeStats(session);
    return View.html({
      template: 'session-manager',
      context: {
        session: session,
        stats: stats,
      },
    });
  });

export const compareSessions = new View()
  .post('/sessions/compare')
  .middleware(userMiddleware)
  .handler(async (req) => {
    const sessions = await service.getManyById(req.body.session, req.user);

    // TODO: optimize this to have a single SQL query
    await Promise.all(
      sessions.map(async (session) => {
        session.stats = await service.computeStats(session);
      }),
    );

    const stats = sessions[0].stats.map(({ topic }, index) => ({
      topic,
      perSession: sessions.map((session) => session.stats[index]),
    }));

    return View.html({
      template: 'session-compare',
      context: {
        sessions: sessions,
        stats: stats,
      },
    });
  });
