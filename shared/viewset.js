import { readFile } from 'fs/promises';
import { resolve } from 'path';
import Handlebars from 'handlebars';

import { __dirname } from './path.js';
import { RequestError } from './error.js';

// Cache
const templates = {};

export class ViewSet {
  get routes() {
    return {};
  }

  async html({ status = 200, template, context }) {
    const view = await this.getCompiledTemplate(template);
    const body = view(context);
    return { status, body };
  }

  redirect({ to }) {
    return { status: 301, Location: to };
  }

  async getCompiledTemplate(template) {
    if (!templates[template]) {
      const content = await readFile(
        resolve(__dirname, `../templates/${template}.hbs`),
      );

      templates[template] = Handlebars.compile(content.toString('utf8'));
    }

    return templates[template];
  }

  requireUser(req) {
    if (!req.user) {
      throw new RequestError(401);
    }
  }
}
