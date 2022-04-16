import { createServer } from "http";
import { createReadStream } from "fs";
import { stat } from "fs/promises";
import { resolve } from "path";

import { RequestError } from "./error.js";
import { mimeTypes } from "./mime.js";
import { __dirname } from "./path.js";
import { ViewSet } from "./viewset.js";

const { NODE_ENV = "development", PORT = 4040 } = process.env;

export class Server {
  constructor() {
    this.server = createServer((req, res) => this.handleRequest(req, res));
    this.views = {
      "GET /*": this.serveStatics.bind(this),
    };
  }

  async handleRequest(req, res) {
    const now = +new Date();
    console.info(`[${now}] > ${req.method} ${req.url}`);

    try {
      const handler = await this.matchHandler(req);
      if (handler) {
        this.sendResponse(res, await handler(req, res));
      } else {
        await this.serveStatics(req, res);
      }
    } catch (error) {
      console.error(error);

      if (error instanceof RequestError) {
        this.sendError(res, error);
      } else {
        this.sendError(res, new RequestError(500));
      }
    }

    const end = +new Date();
    console.info(`[${end}] < ${req.method} ${req.url} (${end - now}ms)`);
  }

  async matchHandler(req) {
    const url = new URL(`https://${req.headers.host}${req.url}`);
    const handlers = this.views[req.method] ?? [];

    for (const [path, handler] of Object.entries(handlers)) {
      const match = this.matchPath(path, url.pathname);
      if (match) {
        req.body = await this.extractRequestBody(req);
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

  async extractRequestBody(req) {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve) => {
      try {
        const buffers = [];

        for await (const chunk of req) {
          buffers.push(chunk);
        }

        const data = Buffer.concat(buffers).toString();
        resolve(new Map(new URLSearchParams(data)));
      } catch (error) {
        resolve(new Map());
      }
    });
  }

  sendResponse(res, response) {
    if (!res.headersSent) {
      const { status, body, ...head } = response;
      res.writeHead(status, { "Content-Type": "text/html", ...head });
      res.end(body);
    }
  }

  async sendError(res, error) {
    const { status, message } = error;
    const viewset = new ViewSet();
    const response = await viewset.html({
      status: status,
      template: "error",
      context: {
        status,
        message,
      },
    });

    return this.sendResponse(res, response);
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
      res.writeHead(200, {
        "Content-Type": mimeTypes[ext] ?? mimeTypes.txt,
        "Content-Length": (await stat(path)).size,
      });

      const readStream = createReadStream(path);
      readStream.pipe(res);
    } catch (error) {
      console.error(error);
      if (error instanceof RequestError) {
        this.sendError(res, error);
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
        console.info(
          `[${+new Date()}] Server listening on http://localhost:${PORT}`
        );
      }
    });
  }
}
