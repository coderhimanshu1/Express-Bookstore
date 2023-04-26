process.env.NODE_ENV = "test";

const request = require("supertest");
const app = require("../app");
const db = require("../db");
const { afterEach } = require("node:test");

let testIsbn;

beforeEach(async () => {
  let result = await db.query(`
      INSERT INTO
        books (isbn, amazon_url, author, language, pages, publisher, title,year)
        VALUES(
          '121314151',
          'https://amazon.com/full-stack',
          'Himanshu',
          'English',
          100,
          'test publishers',
          'my first book', 2024)
        RETURNING isbn`);

  testIsbn = result.rows[0].isbn;
});

afterEach(async () => {
  await db.query(`
    DELETE FROM books
  `);
});

afterAll(async () => {
  await db.end();
});
