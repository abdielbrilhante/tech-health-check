import Branca from 'branca';
import bcrypt from 'bcrypt';

import { RequestError } from '../shared/error.js';
import { UserRepository } from '../repositories/user.repository.js';

const branca = Branca(process.env.JWT_SALT);

export class UserService {
  constructor() {
    this.repository = new UserRepository();
  }

  async requestUser(token) {
    try {
      const email = branca.decode(token).toString('utf8');
      const user = await this.repository.getByEmail(email);
      return user;
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  async authenticate(form) {
    const user = await this.repository.getByEmail(form.email);
    if (!user) {
      throw new RequestError(401);
    }

    const matches = await bcrypt.compare(form.password, user.password);
    if (!matches) {
      throw new RequestError(401);
    }

    return branca.encode(user.email);
  }
}
