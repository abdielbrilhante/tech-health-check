import { Server } from './shared/server.js';
import { apiSchema } from './schema.js';

new Server(apiSchema).listen();
