import { Server } from './shared/server.js';
import { PublicViewSet } from './views/public.js';

const server = new Server();

server.viewset(new PublicViewSet());

server.listen();
