import test, { describe } from "node:test";
import { Database, sql } from "../src/index.js";
import assert from "node:assert/strict";

describe("Template helpers", () => {
  const db = new Database(
    "",
    `CREATE TABLE my_table(
        key INTEGER PRIMARY KEY,
        value TEXT NOT NULL
    ) STRICT`
  );

  test("runs inserts with run", () => {
    db.run`INSERT INTO my_table VALUES (${1},${"uno momento"})`;
    db.run`INSERT INTO my_table VALUES (${2},${"dos equis"})`;
    db.run`INSERT INTO my_table VALUES (${3},${"tres amigos"})`;

    const rows = db.prepare("SELECT * FROM my_table").all();
    console.log(rows);

    assert.equal(rows.length, 3, "expected to find 3 rows in table");
  });

  test("creates template", () => {
    const template = sql`SELECT * FROM my_table WHERE key = ${1}`;

    assert.equal(template.sql, "SELECT * FROM my_table WHERE key = ?");
    assert.deepEqual(template.values, [1]);
  });

  test("runs prepared statement from template with all", () => {
    const template = sql`SELECT * FROM my_table WHERE key = ${1}`;
    const rows = db.prepare(template.sql).all(...template.values);

    assert.equal(rows.length, 1, "expected to get 1 row back");
  });

  test("runs prepared statement from template with get", () => {
    const template = sql`SELECT * FROM my_table WHERE key = ${1}`;
    const row = db.prepare(template.sql).get(...template.values);

    assert.ok(row, "expected to get row back");
  });

  test("runs query and gets 1", () => {
    const row = db.first`SELECT * FROM my_table WHERE key = ${1}`;
    assert.ok(row, "expected to find row");
  });

  test("runs query and gets undefined", () => {
    const row = db.first`SELECT * FROM my_table WHERE key = ${99}`;
    assert.equal(row, undefined, "expected not to find row");
  });

  test("runs query all and gets rows", () => {
    const rows = db.query`SELECT * FROM my_table`;
    console.log(rows);
    assert.equal(rows.length, 3, "expected 3 rows");
  });
});
