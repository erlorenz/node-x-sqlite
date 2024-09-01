import test, { after, describe } from "node:test";
import { Database, sql } from "../src/index.js";
import assert from "node:assert/strict";
import fs, { globSync } from "node:fs";

after(() => {
  globSync(".dbtest_*").forEach((dir) => fs.rmSync(dir, { recursive: true, force: true }));
});

describe("Transaction function", () => {
  const db = new Database(
    "",
    `CREATE TABLE my_table(
        key INTEGER PRIMARY KEY,
        value TEXT NOT NULL
    ) STRICT`
  );

  test("commits on success", () => {
    const rows = db.tx(() => {
      db.run`INSERT INTO my_table VALUES (${1},${"uno momento"})`;
      db.run`INSERT INTO my_table VALUES (${2},${"dos minutos"})`;
      db.run`INSERT INTO my_table VALUES (${3},${"tres dias"})`;

      return db.query`SELECT * FROM my_table`;
    });

    assert.equal(rows.length, 3, "expected to find 3 rows in table");
  });

  test("rolls back on error", () => {
    try {
      db.tx(() => {
        db.run`INSERT INTO my_table VALUES (${4},${"quatro semanas"})`;
        db.run`INSERT INTO my_table VALUES (${5},${"cinco anos"})`;
        db.run`INSERT INTO my_table VALUES (${"WRONG_TYPE"},${"cinco anos"})`;
      });
    } catch (err) {}

    const rows = db.query`SELECT * FROM my_table`;
    assert.equal(rows.length, 3, "expected to find 3 rows in table");
  });
});
