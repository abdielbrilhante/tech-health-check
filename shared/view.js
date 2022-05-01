import * as yup from 'yup';
import UrlPattern from 'url-pattern';
import { readFile, readdir } from 'fs/promises';
import { resolve } from 'path';
import Handlebars from 'handlebars';

import { __dirname } from './path.js';

export class View {
  static templatesPromise;
  static templates = {};

  routes = [];
  middlewares = [];
  validations = [];

  static async html({ status = 200, template, context }) {
    await this.templatesPromise;

    const view = this.templates[template];
    const body = view(context);
    return { status, body };
  }

  static redirect({ to }) {
    return { status: 301, Location: to };
  }

  static async loadTemplates() {
    const files = await readdir(resolve(__dirname, '../templates'));

    this.templatesPromise = Promise.all(files.map(async (template) => {
      const content = await readFile(resolve(__dirname, '../templates', template));
      this.templates[template.replace('.hbs', '')] = Handlebars.compile(content.toString('utf8'));
    }));
  }

  get(path) {
    this.routes.push({ method: 'GET', pattern: new UrlPattern(path) });
    return this;
  }

  post(path) {
    this.routes.push({ method: 'POST', pattern: new UrlPattern(path) });
    return this;
  }

  middleware(MiddlewareClass) {
    this.middlewares.push(MiddlewareClass);
    return this;
  }

  params(schema) {
    this.validations.push(['params', yup.object().shape(schema)]);
    return this;
  }

  query(schema) {
    this.validations.push(['query', yup.object().shape(schema)]);
    return this;
  }

  body(schema) {
    this.validations.push(['body', yup.object().shape(schema)]);
    return this;
  }

  handler(handler) {
    this.routeHandler = handler;
    return this;
  }

  // Called by the server
  async handleRequest(req, res) {
    for (const middleware of this.middlewares) {
      await middleware(req, res);
    }

    for (const [section, schema] of this.validations) {
      const values = schema.cast(req[section]);
      req[section] = await schema.validate(values, { abortEarly: false, strict: true });
    }

    return this.routeHandler(req, res);
  }
}
