import http from 'http';
import { RequestError } from './error.js';

const { NODE_ENV = 'development', PORT = 4040 } = process.env;

export class Server {
  constructor() {
    this.server = http.createServer((req, res) => this.handleRequest(req, res));
    this.views = {};
  }

  async handleRequest(req, res) {
    if (req.url === '/favicon.ico') {
      this.sendResponse(res, new RequestError(404));
      return;
    }

    try {
      const handler = this.matchHandler(req);

      if (handler) {
        this.sendResponse(res, await handler(req, res))
      } else {
        throw new RequestError(405);
      }
    } catch (error) {
      console.error(error);

      if (error instanceof RequestError) {
        this.sendResponse(res, error);
      } else {
        this.sendResponse(res, new RequestError(500));
      }
    }
  }

  matchHandler(req) {
    const url = new URL(`https://${req.headers.host}${req.url}`);
    const handlers = this.views[req.method] ?? [];
    let handler = null;

    for (const [path, handler] of Object.entries(handlers)) {
      const match = this.matchPath(path, url.pathname);
      if (match) {
        req.params = match;
        req.query = Object.fromEntries(new URLSearchParams(url.search));
        return handler;
      }
    }

    return null;
  }

  matchPath(path, input) {
    const pathSegments = path.split('/').filter(Boolean);
    const inputSegments = input.split('/').filter(Boolean);

    if (pathSegments.length > inputSegments) {
      return null;
    }

    const params = {};

    for (const [index, segment] of pathSegments.entries()) {
      if (segment.startsWith(':')) {
        params[segment.substring(1)] = inputSegments[index];
      } else if (segment !== inputSegments[index]) {
        return null;
      }
    }

    return params;
  }

  sendResponse(res, response) {
    res.writeHead(response.status, { 'Content-Type': 'text/html' });
    res.end(response.body);
  }

  viewset(viewset) {
    for (const [endpoint, handler] of Object.entries(viewset.routes)) {
      const [method, path] = endpoint.split(' ');
      this.views[method] = this.views[method] ?? {};
      this.views[method][path] = handler.bind(viewset);
    }
  }

  listen() {
    this.server.listen(PORT, () => {
      if (NODE_ENV === 'development') {
        console.log(`Server listening on http://localhost:${PORT}`);
      }
    });
  }
}
