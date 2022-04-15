import { readFile } from "fs/promises";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

import Handlebars from "handlebars";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

  async redirect({ to }) {
    return { status: 301, Location: to };
  }

  async getCompiledTemplate(template) {
    if (!templates[template]) {
      const content = await readFile(
        resolve(__dirname, `../templates/${template}.hbs`)
      );

      templates[template] = Handlebars.compile(content.toString("utf8"));
    }

    return templates[template];
  }
}
