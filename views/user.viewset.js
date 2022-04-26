import { ViewSet } from '../shared/viewset.js';
import { UserService } from '../services/user.service.js';

export class UserViewSet extends ViewSet {
  routes = {
    'GET /login': this.loginPage,
    'POST /login': this.authenticate,
  };

  loginPage() {
    return this.html({ template: 'login' });
  }

  async authenticate() {
    const service = new UserService();
    const token = await service.authenticate(this.req.body);
    this.res.setHeader('Set-Cookie', [`auth=${token}`]);
    return this.redirect({ to: '/sessions' });
  }
}
