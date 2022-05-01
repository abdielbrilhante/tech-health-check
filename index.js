import { Server } from './shared/server.js';

import * as publicViews from './views/public.views.js';
import * as userViews from './views/user.views.js';
import * as sessionViews from './views/session.views.js';
import { View } from './shared/view.js';

View.loadTemplates();

const server = new Server();

server.viewset(publicViews);
server.viewset(userViews);
server.viewset(sessionViews);

server.listen();
