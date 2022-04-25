import { ViewSet } from '../shared/viewset.js';
import { UserService } from '../services/user.service.js';

export class UserViewSet extends ViewSet {
  get routes() {
    return {
      public: {
        'GET /login': this.loginPage,
        'POST /login': this.authenticate,
      },
    };
  }

  // GET /login
  loginPage() {
    return this.html({ template: 'login' });
  }

  // POST /login
  async authenticate(req, res) {
    const service = new UserService();
    const token = await service.authenticate(req.body);
    res.setHeader('Set-Cookie', [`auth=${token}`]);
    return this.redirect({ to: '/sessions' });
  }
}
