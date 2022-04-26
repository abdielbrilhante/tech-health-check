import * as yup from 'yup';

import { PublicViewSet } from './views/public.viewset.js';
import { SessionViewSet } from './views/session.viewset.js';
import { UserViewSet } from './views/user.viewset.js';

export const apiSchema = {
  'GET /': {
    viewset: PublicViewSet,
    handler: 'homepage',
  },

  'GET /login': {
    viewset: UserViewSet,
    handler: 'loginPage',
  },
  'POST /login': {
    viewset: UserViewSet,
    handler: 'authenticate',
    schema: {
      body: {
        email: yup.string().email().required(),
        password: yup.string().required(),
      },
    },
  },

  'GET /sessions/apply/:id': {
    viewset: SessionViewSet,
    handler: 'applyHealthCheck',
    schema: {
      params: {
        id: yup.number().required(),
      },
    },
  },
  'POST /sessions/apply/:id': {
    viewset: SessionViewSet,
    handler: 'saveAnswers',
    schema: {
      params: {
        id: yup.number().required(),
      },
    },
  },
  'GET /sessions/success': {
    viewset: SessionViewSet,
    handler: 'sessionSuccess',
  },

  'GET /sessions': {
    viewset: SessionViewSet,
    handler: 'sessionList',
    requireUser: true,
  },
  'POST /sessions': {
    viewset: SessionViewSet,
    handler: 'sessionList',
    requireUser: true,
    schema: {
      body: {
        stack: yup.string().oneOf(['', 'frontend', 'backend', 'mixed']),
        dateFrom: yup.string(),
        dateTo: yup.string(),
        tech: yup.string(),
        team: yup.string(),
        client: yup.string(),
        leadName: yup.string(),
        leadEmail: yup.string().email(),
      },
    },
  },
  'GET /sessions/new': {
    viewset: SessionViewSet,
    handler: 'sessionForm',
    requireUser: true,
  },
  'POST /sessions/new': {
    viewset: SessionViewSet,
    handler: 'saveSession',
    requireUser: true,
    schema: {
      body: {
        template: yup.string().oneOf(['react']).required(),
        when: yup.date().min(new Date()).required(),
        team: yup.string().required(),
        client: yup.string().required(),
        leadName: yup.string().required(),
        leadEmail: yup.string().email().required(),
      },
    },
  },
  'GET /sessions/manage/:id': {
    viewset: SessionViewSet,
    handler: 'sessionOverview',
    requireUser: true,
    schema: {
      params: {
        id: yup.number().required(),
      },
    },
  },
  'POST /sessions/manage/:id': {
    viewset: SessionViewSet,
    handler: 'updateSession',
    requireUser: true,
    schema: {
      params: {
        id: yup.number().required(),
      },
      body: {
        notes: yup.string().required(),
      },
    },
  },
  'POST /sessions/compare': {
    viewset: SessionViewSet,
    handler: 'compareSessions',
    requireUser: true,
  },
};
