import * as yup from 'yup';
import { UserService } from '../services/user.service.js';
import { View } from '../shared/view.js';

export const loginPage = new View()
  .get('/login')
  .handler(() => View.html({ template: 'login' }));

export const authenticate = new View()
  .post('/login')
  .body({
    email: yup.string().email().required(),
    password: yup.string().required(),
  })
  .handler(async (req, res) => {
    const service = new UserService();
    const token = await service.authenticate(req.body);
    res.setHeader('Set-Cookie', [`auth=${token}`]);
    return View.redirect({ to: '/sessions' });
  });
