import test, { after, describe } from "node:test";
import { Database } from "../src/index.js";
import assert from "node:assert/strict";
import fs, { globSync } from "node:fs";

after(() => {
  globSync(".dbtest_*").forEach((dir) => fs.rmSync(dir, { recursive: true, force: true }));
});

describe("Wrapper standard functionality", () => {
  test("initializes in memory by default", () => {
    const db = new Database();
    const mode = db.journalMode;

    assert.equal(mode, "memory");
  });

  test("initializes in wal mode with file ", () => {
    const dir = fs.mkdtempSync(".dbtest_");
    const db = new Database(dir + "/test.sqlite");
    const mode = db.journalMode;

    assert.equal(mode, "wal");
  });

  test("initializes sql init statement", () => {
    const db = new Database(
      "",
      `CREATE TABLE my_table(
        key INTEGER PRIMARY KEY,
        value TEXT NOT NULL
    ) STRICT`
    );

    const tables = db.prepare(`SELECT * from sqlite_schema`).all() as {
      type: string;
      name: string;
      tbl_name: string;
    }[];
    const index = tables.findIndex((t) => t.name === "my_table");

    assert(index > -1, "expected to find 'my_table' in list of tables");
  });

  test("runs inserts and query with prepare", () => {
    const db = new Database(
      "",
      `CREATE TABLE my_table(
        key INTEGER PRIMARY KEY,
        value TEXT NOT NULL
    ) STRICT`
    );

    const stmt = db.prepare(`INSERT INTO my_table (key, value) VALUES(?,?)`);
    stmt.run(1, "uno momento");
    stmt.run(2, "dos taquitos");
    stmt.run(3, "tres amigos");

    const rows = db.prepare("SELECT * FROM my_table").all();

    assert.equal(rows.length, 3, "expected to find 3 rows in table");

    // db.prepare(`INSERT INTO test VALUES (1, 'some value')`).run();
  });

  test("initializes sql init statement", () => {
    const db = new Database(
      "",
      `CREATE TABLE my_table(
        key INTEGER PRIMARY KEY,
        value TEXT NOT NULL
    ) STRICT`
    );

    const stmt = db.prepare(`INSERT INTO my_table VALUES(?,?)`);
    stmt.run(1, "uno momento");
    stmt.run(2, "dos taquitos");
    stmt.run(3, "tres amigos");

    const rows = db.prepare("SELECT * FROM my_table").all();

    assert.equal(rows.length, 3, "expected to find 3 rows in table");
  });
});
