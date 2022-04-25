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

  async authenticate(req, res) {
    const service = new UserService();
    const token = await service.authenticate(req.body);
    res.setHeader('Set-Cookie', [`auth=${token}`]);
    return this.redirect({ to: '/sessions' });
  }
}
