# SourceSQL

**C++ style SQL interface for Node.js & TypeScript
inspired by Source / Source2 development**

------------------------------------------------------------------------

## Overview

`SourceSQL` is a lightweight **OOP SQL abstraction layer** designed to
replicate the feel of **SourceMod / Source2 SQL APIs** in modern
JavaScript and TypeScript.

It provides a **virtual-like interface (`ISQL*`)** with familiar methods
such as:

- `Query`
- `GetResultSet`
- `FetchRow`
- `GetInt64`

The goal is to create a **low-level, predictable, and safe SQL layer**
that behaves similarly to C++ plugin environments.

------------------------------------------------------------------------

## Features

-   C++-style API (`ISQLConnection`, `ISQLQuery`, `ISQLResult`, `ISQLRow`)
-   Promise-based & callback-based queries
-   MySQL driver (`mysql2`)
-   Safe queries using prepared statements (`?`)
-   `queryEx` helper (tuple `[result, error]`)
-   Transaction support
-   BigInt-safe (`GetInt64`)
-   Multi-database support (`db.table`)
-   Clean TypeScript typings
-   Easily extensible (SQLite, Postgres, etc.)

------------------------------------------------------------------------

## Installation

```bash
npm install sourcesql mysql2
```

------------------------------------------------------------------------

## Basic Usage

```ts
import { MySQLConnection } from "sourcesql";

const db = new MySQLConnection({
  host: "localhost",
  user: "root",
  password: ""
});

await db.Connect();

const query = await db.Query(
  "SELECT id, name FROM test.users WHERE id = ?",
  [1]
);

const result = query.GetResultSet();

while (result.MoreRows()) {
  const row = result.FetchRow();

  const id = row.GetInt("id");
  const name = row.GetString("name");

  console.log(id, name);
}

await db.Destroy();
```

------------------------------------------------------------------------

## QueryEx (C++ style)

```ts
import { queryEx } from "sourcesql";

const [query, err] = await queryEx(
  db,
  "SELECT * FROM test.users WHERE id = ?",
  [1]
);

if (err) {
  console.error(err);
} else {
  const result = query.GetResultSet();
}
```

------------------------------------------------------------------------

## Safe Queries (SQL Injection Protection)

```ts
// SAFE
await db.Query(
  "SELECT * FROM users WHERE name = ?",
  [name]
);

// UNSAFE (NEVER DO THIS)
await db.Query(`SELECT * FROM users WHERE name = '${name}'`);
```

------------------------------------------------------------------------

## Multi Database Queries

```ts
await db.Query("SELECT * FROM test.users");
await db.Query("SELECT * FROM logs.sessions");
```

Or safely:

```ts
const table = db.EscapeTable("test", "users");
await db.Query(`SELECT * FROM ${table}`);
```

------------------------------------------------------------------------

## Transactions

```ts
await db.ExecuteTransaction(
  [
    "INSERT INTO test.users (name) VALUES ('A')",
    "UPDATE test.users SET name='B' WHERE id=1"
  ],
  (results) => {
    console.log("Transaction success:", results.length);
  },
  (error) => {
    console.error("Transaction failed:", error);
  }
);
```

------------------------------------------------------------------------

## API

### ISQLConnection

```ts
Connect(callback?: (success: boolean) => void): Promise<void>
Query(sql: string, params?: any[]): Promise<ISQLQuery>
QueryCallback(sql: string, callback: (query, err?) => void): void
ExecuteTransaction(...)
Destroy(): Promise<void>

Escape(value: any): string
EscapeId(value: string): string
EscapeTable(db: string, table: string): string
```

------------------------------------------------------------------------

### ISQLQuery

```ts
GetResultSet(): ISQLResult | null
GetInsertId(): number
GetAffectedRows(): number
GetType(): QueryType
```

------------------------------------------------------------------------

### ISQLResult

```ts
GetRowCount(): number
GetFieldCount(): number

FieldNameToNum(name: string): number | null
FieldNumToName(index: number): string | null

MoreRows(): boolean
FetchRow(): ISQLRow | null
CurrentRow(): ISQLRow | null

Rewind(): void
```

------------------------------------------------------------------------

### ISQLRow

```ts
GetString(field: string | number): string | null
GetInt(field: string | number): number
GetFloat(field: string | number): number
GetInt64(field: string | number): string
IsNull(field: string | number): boolean
```

------------------------------------------------------------------------

## Query Types

```ts
import { QueryType } from "sourcesql";

switch (query.GetType()) {
  case QueryType.SELECT:
    break;
  case QueryType.INSERT:
    console.log(query.GetInsertId());
    break;
  case QueryType.UPDATE:
  case QueryType.DELETE:
    console.log(query.GetAffectedRows());
    break;
}
```

------------------------------------------------------------------------

## Example (Field Index)

```ts
const col = result.FieldNameToNum("name");

while (result.MoreRows()) {
  const row = result.FetchRow();
  console.log(row.GetString(col));
}
```

------------------------------------------------------------------------

## Notes

-   Always use **string for BIGINT values** (SteamID, Discord IDs)
-   Use `?` placeholders to prevent SQL injection
-   Do not escape values manually — use prepared params
-   Tables/columns must use `EscapeId`

------------------------------------------------------------------------

## Roadmap

-   SQLite driver
-   PostgreSQL driver
-   Prepared statements cache
-   Query formatter (`%d`, `%s`)
-   Async queue (SourceMod style)
-   Connection manager
-   Typed queries

------------------------------------------------------------------------

## License

MIT

------------------------------------------------------------------------

## Author

**Michal "Slynx" Přikryl**
https://slynxdev.cz
