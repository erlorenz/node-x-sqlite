import { DatabaseSync, type StatementSync } from "node:sqlite";

/** The wrapper class for the DatabaseSync connection. */
export class Database {
  conn: DatabaseSync;
  #statements: Map<string, StatementSync>;
  #begin: StatementSync;
  #commit: StatementSync;
  #rollback: StatementSync;

  /**
   * Creates a wrapper for the built-in DatabaseSync connection.
   * @param location The path to the file. For an in-memory database, pass an empty string or `":memory:"`.
   * @param initSQL An initial SQL statment to run when database is opened.
   */
  constructor(location: string = ":memory:", initSQL?: string) {
    if (location.trim() === "") {
      location = ":memory:";
    }

    this.conn = new DatabaseSync(location, { open: true });
    this.#statements = new Map();

    if (location !== ":memory:") {
      this.conn.exec(`PRAGMA journal_mode=wal`);
    }
    if (initSQL) {
      this.conn.exec(initSQL);
    }

    // Prepare the transaction statements
    this.#begin = this.conn.prepare("BEGIN");
    this.#commit = this.conn.prepare("COMMIT");
    this.#rollback = this.conn.prepare("ROLLBACK");
  }

  /** Executes a block of SQL. Primarily used during initialization. */
  exec(sql: string) {
    this.conn.exec(sql);
  }

  /** Caches the prepared statement before returning it. */
  prepare(sql: string) {
    let statement = this.#statements.get(sql);
    if (statement) {
      return statement;
    }
    statement = this.conn.prepare(sql);

    this.#statements.set(sql, statement);
    return statement;
  }

  /** Template string. Prepares a statement and calls `get` to return the first row. */
  first(strings: TemplateStringsArray, ...values: SQLTemplateValue[]) {
    const template = sql(strings, ...values);
    return this.prepare(template.sql).get(...template.values);
  }

  /** Template string. Prepares a statement and calls `all` to return multiple rows. */
  query(strings: TemplateStringsArray, ...values: SQLTemplateValue[]) {
    const template = sql(strings, ...values);
    return this.prepare(template.sql).all(...template.values);
  }

  /** Template string. Prepares a statement and calls `run` to execute it and only return the changes. */
  run(strings: TemplateStringsArray, ...values: SQLTemplateValue[]) {
    const template = sql(strings, ...values);
    return this.prepare(template.sql).run(...template.values);
  }

  /** Clears the query cache. */
  clearStatementCache() {
    this.#statements.clear();
  }

  /** Closes the DB connection. */
  close() {
    this.conn.close();
  }

  /** BEGINs a transaction and COMMITs it on success, calls ROLLBACK on error. */
  tx<T>(fn: () => T) {
    try {
      this.#begin.run();
      const result = fn();
      this.#commit.run();
      return result;
    } catch (err) {
      this.#rollback.run();
      throw err;
    }
  }

  /** Sets the journal mode or returns it if no argument is passed. */
  get journalMode() {
    const { journal_mode } = this.conn.prepare("PRAGMA journal_mode").get() as {
      journal_mode: string;
    };

    return journal_mode as JournalMode;
  }
}

type JournalMode = "memory" | "wal" | "delete";

type SQLTemplate = { sql: string; values: SQLTemplateValue[] };
type SQLTemplateValue = null | number | bigint | string | Buffer | Uint8Array;

/** Template string. Returns the statement with "?" for the unnamed arguments and an array of values. */
export function sql(strings: TemplateStringsArray, ...values: SQLTemplateValue[]): SQLTemplate {
  return { sql: strings.join("?"), values };
}
