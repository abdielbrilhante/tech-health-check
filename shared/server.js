import { createServer } from 'http';
import { createReadStream } from 'fs';
import { stat } from 'fs/promises';
import { resolve } from 'path';
import { ValidationError } from 'yup';

import { RequestError } from './error.js';
import { mimeTypes } from './mime.js';
import { __dirname } from './path.js';
import { View } from './view.js';

const { NODE_ENV = 'development', PORT = 4040 } = process.env;

export class Server {
  constructor() {
    this.server = createServer((req, res) => this.handleRequest(req, res));
    this.views = [];
  }

  async handleRequest(req, res) {
    const now = +new Date();
    console.info(`[${now}] > ${req.method} ${req.url}`);

    try {
      const handler = await this.matchHandler(req, res);
      if (handler) {
        this.sendResponse(res, await handler(req, res));
      } else {
        await this.serveStatics(req, res);
      }
    } catch (error) {
      console.error(error);

      if (error instanceof RequestError) {
        this.sendError(res, error);
      } else if (error instanceof ValidationError) {
        this.sendError(res, new RequestError(400, error));
      } else {
        this.sendError(res, new RequestError(500));
      }
    }

    const end = +new Date();
    console.info(
      `[${end}] < ${req.method} ${req.url} (${res.statusCode}) (${end - now}ms)`,
    );
  }

  async matchHandler(req) {
    const url = new URL(`https://${req.headers.host}${req.url}`);

    const [view, match] = this.matchPath(req.method, url.pathname);
    if (view) {
      req.cookies = Object.fromEntries(
        new URLSearchParams(req.headers.cookie?.replace(/; /gu, '&')),
      );

      req.params = match;
      req.query = new URLSearchParams(url.search);
      req.body = await this.extractRequestBody(req);

      return view.handleRequest.bind(view);
    }

    return null;
  }

  matchPath(method, path) {
    for (const [route, view] of this.views) {
      if (route.method === method) {
        const match = route.pattern.match(path);
        if (match) {
          return [view, match];
        }
      }
    }

    return [];
  }

  extractRequestBody(req) {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolvePromise) => {
      try {
        const buffers = [];

        for await (const chunk of req) {
          buffers.push(chunk);
        }

        const data = Buffer.concat(buffers).toString();
        const params = new URLSearchParams(data);
        const result = {};
        for (const [key, value] of params) {
          if (!(key in result)) {
            result[key] = value;
          } else if (Array.isArray(result[key])) {
            result[key].push(value);
          } else {
            result[key] = [result[key], value];
          }
        }

        resolvePromise(result);
      } catch (error) {
        resolvePromise({});
      }
    });
  }

  sendResponse(res, response) {
    if (!res.headersSent) {
      const { status, body, ...head } = response;
      res.writeHead(status, { 'Content-Type': 'text/html', ...head });
      res.end(body);
    }
  }

  async sendError(res, error) {
    const { status, message } = error;
    const response = await View.html({
      status: status,
      template: 'error',
      context: {
        status,
        message,
      },
    });

    return this.sendResponse(res, response);
  }

  async serveStatics(req, res) {
    try {
      if (!req.url.includes('.')) {
        throw new RequestError(404);
      }

      const path = resolve(
        __dirname,
        `../public/${req.url.replace(/^\/public/u, '')}`,
      );
      const [ext] = req.url.split('.').slice(-1);
      res.writeHead(200, {
        'Content-Type': mimeTypes[ext] ?? mimeTypes.txt,
        'Content-Length': (await stat(path)).size,
      });

      const readStream = createReadStream(path);
      readStream.pipe(res);
    } catch (error) {
      console.error(error);
      if (error instanceof RequestError) {
        this.sendError(res, error);
      } else {
        res.writeHead(500, { 'Content-Type': mimeTypes.txt });
        res.end();
      }
    }
  }

  viewset(viewset) {
    for (const view of Object.values(viewset)) {
      this.views.push(...view.routes.map((route) => [route, view]));
    }
  }

  listen() {
    this.server.listen(PORT, () => {
      if (NODE_ENV === 'development') {
        console.info(
          `[${+new Date()}] Server listening on http://localhost:${PORT}`,
        );
      }
    });
  }
}
