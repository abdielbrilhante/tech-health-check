import { createServer } from "http";
import { createReadStream } from "fs";
import { stat } from "fs/promises";
import { resolve } from "path";
import { RequestError } from "./error.js";
import { mimeTypes } from "./mime.js";
import { __dirname } from "./path.js";

const { NODE_ENV = "development", PORT = 4040 } = process.env;

export class Server {
  constructor() {
    this.server = createServer((req, res) => this.handleRequest(req, res));
    this.views = {
      "GET /*": this.serveStatics.bind(this),
    };
  }

  async handleRequest(req, res) {
    try {
      const handler = this.matchHandler(req);
      if (handler) {
        this.sendResponse(res, await handler(req, res));
      } else {
        await this.serveStatics(req, res);
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
    if (path === input) {
      return {};
    }

    const pathSegments = path.split("/").filter(Boolean);
    const inputSegments = input.split("/").filter(Boolean);

    if (pathSegments.length !== inputSegments && !input.includes("*")) {
      return null;
    }

    const params = {};

    for (const [index, segment] of pathSegments.entries()) {
      if (segment.startsWith(":")) {
        params[segment.substring(1)] = inputSegments[index];
      } else if (segment !== inputSegments[index]) {
        return null;
      }
    }

    return params;
  }

  sendResponse(res, response) {
    res.writeHead(response.status, { "Content-Type": "text/html" });
    res.end(response.body);
  }

  async serveStatics(req, res) {
    try {
      if (!req.url.includes(".")) {
        throw new RequestError(404);
      }

      const path = resolve(
        __dirname,
        `../public/${req.url.replace(/^\/public/u, "")}`
      );
      const [ext] = req.url.split(".").slice(-1);
      console.log(path, ext);
      res.writeHead(200, {
        "Content-Type": mimeTypes[ext] ?? mimeTypes.txt,
        "Content-Length": (await stat(path)).size,
      });

      const readStream = createReadStream(path);
      readStream.pipe(res);
    } catch (error) {
      console.error(error);
      if (error instanceof RequestError) {
        this.sendResponse(res, error);
      } else {
        res.writeHead(500, { "Content-Type": mimeTypes.txt });
        res.end();
      }
    }
  }

  viewset(viewset) {
    for (const [endpoint, handler] of Object.entries(viewset.routes)) {
      const [method, path] = endpoint.split(" ");
      this.views[method] = this.views[method] ?? {};
      this.views[method][path] = handler.bind(viewset);
    }
  }

  listen() {
    this.server.listen(PORT, () => {
      if (NODE_ENV === "development") {
        console.log(`Server listening on http://localhost:${PORT}`);
      }
    });
  }
}
