import Knex from "knex";
import config from "../knexfile.js";

const knex = Knex(config);

export class Repository {
  get knex() {
    return knex;
  }
}
