import { Repository } from "../shared/repository.js";

export class UserRepository extends Repository {
  getByEmail(email) {
    return this.knex("users").where({ email }).first();
  }
}
