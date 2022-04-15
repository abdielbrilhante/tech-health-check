import { readFile } from 'fs';
import { promisify } from 'util';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

import Handlebars from 'handlebars';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cache
const templates = {};
const readFileAsync = promisify(readFile);

export class ViewSet {
  async html({ status, template, context }) {
    const view = await this.getCompiledTemplate(template);
    const body = view(context);
    return { status, body };
  }

  async getCompiledTemplate(template) {
    if (!templates[template]) {
      const content = await readFileAsync(
        resolve(__dirname, `../templates/${template}.hbs`),
      );

      templates[template] = Handlebars.compile(content.toString('utf8'));
    }

    return templates[template];
  }
}
