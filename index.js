import { Server } from "./shared/server.js";
import { PublicViewSet } from "./views/public.viewset.js";
import { SessionViewSet } from "./views/session.viewset.js";
import { UserViewSet } from "./views/user.viewset.js";

const server = new Server();

server.viewset(new PublicViewSet());
server.viewset(new UserViewSet());
server.viewset(new SessionViewSet());

server.listen();
