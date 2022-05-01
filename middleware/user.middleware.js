import { UserService } from '../services/user.service.js';
import { RequestError } from '../shared/error.js';

export async function userMiddleware(req) {
  if (!req.cookies.auth) {
    throw new RequestError(401);
  }

  req.user = await new UserService().requestUser(req.cookies.auth);
  if (!req.user) {
    throw new RequestError(403);
  }
}
