# SourceSQL

C++-style SQL interface for Node.js inspired by Source / Source2 development.

------------------------------------------------------------------------

## Overview

SourceSQL is a lightweight SQL abstraction layer designed to replicate
the feel of SourceMod / Source2 database APIs in modern JavaScript and TypeScript.

It provides a predictable, low-level, and type-safe interface similar to C++ plugin environments,
while still supporting async/await and modern Node.js patterns.

Unlike ORMs, SourceSQL gives you full control over your queries while maintaining safety and clarity.

------------------------------------------------------------------------

## Why SourceSQL?

Most Node.js database libraries fall into two extremes:

- Raw SQL (unsafe, repetitive)
- ORMs (complex, abstract, slow)

SourceSQL sits in the middle:

- Full control over SQL
- Safe parameter binding
- Minimal abstraction
- Familiar C++-style workflow

------------------------------------------------------------------------

## Features

- C++-style API (ISQLConnection, ISQLQuery, ISQLResult, ISQLRow)
- Promise-based & callback-based queries
- MySQL (mysql2) driver
- PostgreSQL (pg) driver
- Prepared statement support (`?` placeholders)
- queryEx helper (`[result, error]` tuple)
- Transaction support
- BigInt-safe (`GetInt64`)
- Nullable-safe getters
- Multi-database support (`db.table`)
- Serverless-friendly (no required pooling)
- Clean TypeScript typings
- Easily extensible (SQLite, etc.)

------------------------------------------------------------------------

## Installation

```bash
npm install sourcesql
```

------------------------------------------------------------------------

## Creating a Database

### MySQL

```ts
import { MySQLDatabase } from "sourcesql";

const db = MySQLDatabase({
  host: "localhost",
  user: "root",
  password: "",
  database: "test"
});
```

### PostgreSQL

```ts
import { PostgreSQLDatabase } from "sourcesql";

const db = PostgreSQLDatabase({
  host: "localhost",
  user: "postgres",
  password: "password",
  database: "test",
  ssl: {
    rejectUnauthorized: false
  }
});
```

------------------------------------------------------------------------

## Basic Usage

```ts
import { queryEx } from "sourcesql";

const [query, err] = await queryEx(
  db,
  "SELECT id, name FROM users WHERE id = ?",
  [1]
);

if (err || !query) {
  console.error("Query failed:", err);
  return;
}

const result = query.GetResultSet();

if (!result) {
  console.warn("No result set");
  return;
}

while (result.MoreRows()) {
  const row = result.FetchRow();

  if (!row) continue;

  const id = row.GetInt("id");
  const name = row.GetString("name");

  console.log(id, name);
}
```

------------------------------------------------------------------------

## Row Access

SourceSQL supports both **name-based** and **index-based** access:

### Name-based (recommended)

```ts
row.GetInt("id");
row.GetString("name");
```

### Index-based (C++ style)

```ts
row.GetInt(0);
row.GetString(1);
```

> Note: Index-based access depends on SELECT order.

------------------------------------------------------------------------

## Nullable Handling

Database values may be `NULL`.

```ts
const name = row.GetString("name"); // string | null
```

Safe fallback:

```ts
const name = row.GetString("name") ?? "";
```

------------------------------------------------------------------------

## queryEx Helper

Returns a tuple instead of throwing:

```ts
const [query, err] = await queryEx(db, "SELECT * FROM users");

if (err) {
  console.error(err);
}
```

------------------------------------------------------------------------

## Transactions

```ts
await db.ExecuteTransaction(
  [
    { sql: "INSERT INTO users (name) VALUES (?)", args: ["John"] },
    { sql: "UPDATE stats SET count = count + 1" }
  ],
  (results) => {
    console.log("Transaction success");
  },
  (error) => {
    console.error("Transaction failed:", error);
  }
);
```

------------------------------------------------------------------------

## Express Example

```ts
import express from "express";
import { MySQLDatabase, queryEx } from "sourcesql";

const app = express();

const db = MySQLDatabase({
  host: "localhost",
  user: "root",
  password: "",
  database: "test"
});

app.get("/users", async (req, res) => {
  const [query, err] = await queryEx(db, "SELECT * FROM users");

  if (err || !query) {
    return res.status(500).json({ error: err ?? "Query failed" });
  }

  const result = query.GetResultSet();

  if (!result) {
    return res.json([]);
  }

  const data = [];

  while (result.MoreRows()) {
    const row = result.FetchRow();
    if (!row) continue;

    data.push({
      id: row.GetInt("id"),
      name: row.GetString("name")
    });
  }

  res.json(data);
});

app.listen(3000);
```

------------------------------------------------------------------------

## Next.js Example

```ts
import { NextResponse } from "next/server";
import { MySQLDatabase, queryEx } from "sourcesql";

const db = MySQLDatabase({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
});

export async function GET() {
  const [query, err] = await queryEx(db, "SELECT * FROM users");

  if (err || !query) {
    return NextResponse.json(
      { error: err ?? "Query failed" },
      { status: 500 }
    );
  }

  const result = query.GetResultSet();

  if (!result) {
    return NextResponse.json([]);
  }

  const data = [];

  while (result.MoreRows()) {
    const row = result.FetchRow();
    if (!row) continue;

    data.push({
      id: row.GetInt("id"),
      name: row.GetString("name")
    });
  }

  return NextResponse.json(data);
}
```

------------------------------------------------------------------------

## Best Practices

- Create the database connection once and reuse it
- Always use `?` placeholders to prevent SQL injection
- Avoid `SELECT *` in production
- Handle `NULL` values properly
- Use `GetInt64` for BIGINT columns
- Prefer name-based access for stability

------------------------------------------------------------------------

## Design Philosophy

SourceSQL follows a simple rule:

> "Stay close to SQL, not away from it."

- No hidden query builders
- No magic mapping
- No heavy ORM abstraction

Just predictable, low-level database access — like in C++.

------------------------------------------------------------------------

## License

MIT

------------------------------------------------------------------------

## Author

Michal "Slynx" Přikryl