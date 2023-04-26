process.env.NODE_ENV = "test";

const request = require("supertest");
const app = require("../app");
const db = require("../db");
const { afterEach, describe, test } = require("node:test");

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
          'my first book', 2022)
        RETURNING isbn`);

  testIsbn = result.rows[0].isbn;
});

describe("GET/books", () => {
  test("Get a list of 1 book", async () => {
    const response = await request(app).get("/books");
    const books = response.body.books;

    expect(books).toHaveLength(1);
    expect(books[0]).toHaveProperty("isbn");
    expect(books[0]).toHaveProperty("amazon_url");
  });
});

describe("GET/books/:isbn", () => {
  test("Get a book by its isbn", async () => {
    const response = await request(app).get(`/books/${testIsbn}`);
    const book = response.body.book;

    expect(book).toHaveProperty("isbn");
    expect(book.isbn).toBe(testIsbn);
  });
});

describe("POST/books", () => {
  test("Create a new book", async () => {
    const response = await request(app).post("/books").send({
      isbn: "923848598",
      amazon_url: "https://software.com",
      author: "testWriter",
      language: "english",
      pages: 500,
      publisher: "Diaries",
      title: "Full Stack Development",
      year: 2022,
    });
    expect(response.statusCode).toBe(201);
    expect(response.body.book).toHaveProperty("isbn");
  });
});

describe("PUT/books/:isbn", () => {
  test("Update a book", async () => {
    const response = (await request(app).put(`/books/${testIsbn}`)).send({
      amazon_url: "https://software.com",
      author: "testWriter",
      language: "english",
      pages: 500,
      publisher: "Diaries",
      title: "Full Stack Development",
      year: 2022,
    });
    expect(response.body.book.title).toBe("Full Stack Development");
    expect(response.body.book).toHaveProperty("isbn");
  });

  test("prevent invalid update", async function () {
    const response = await request(app).put(`/books/${testIsbn}`).send({
      amazon_url: "https://software.com",
      randomField: "I am here",
      author: "testWriter",
      language: "english",
      pages: 500,
      publisher: "Diaries",
      title: "Full Stack Development",
      year: 2022,
    });
    expect(response.statusCode).toBe(400);
  });

  test("Responds 404 if book not found", async function () {
    await request(app).delete(`/books/${testIsbn}`);
    const response = await request(app).put(`/books/${testIsbn}`);
    expect(response.statusCode).toBe(404);
  });
});

describe("DELETE/books/:isbn", () => {
  test("Delete a book", async () => {
    const response = await request(app).delete(`/books/${testIsbn}`);
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual('{ message: "Book deleted" }');
  });
});

afterEach(async () => {
  await db.query(`
    DELETE FROM books
  `);
});

afterAll(async () => {
  await db.end();
});
