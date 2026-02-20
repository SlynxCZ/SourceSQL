# SourceSQL

C++ style SQL interface for Node.js inspired by Source / Source2 development

------------------------------------------------------------------------

## Overview

SourceSQL is a lightweight OOP SQL abstraction layer designed to
replicate the feel of SourceMod / Source2 SQL APIs in modern
JavaScript and TypeScript.

It provides a virtual-like interface (ISQL*) with familiar methods such as:

- Query
- GetResultSet
- FetchRow
- GetInt64

The goal is to create a low-level, predictable, and safe SQL layer
that behaves similarly to C++ plugin environments.

------------------------------------------------------------------------

## Features

- C++-style API (ISQLConnection, ISQLQuery, ISQLResult, ISQLRow)
- Promise-based & callback-based queries
- MySQL driver (mysql2)
- Serverless-style connection (no pool required)
- Safe queries using prepared statements (?)
- queryEx helper (tuple [result, error])
- Transaction support
- BigInt-safe (GetInt64)
- Multi-database support (db.table)
- Clean TypeScript typings
- Easily extensible (SQLite, Postgres, etc.)

------------------------------------------------------------------------

## Installation

npm install sourcesql mysql2

------------------------------------------------------------------------

## Create Database

```ts
import { MySQLDatabase } from "sourcesql";

const db = MySQLDatabase({
  host: "localhost",
  user: "root",
  password: "",
  database: "test"
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

## NestJS Example

```ts
import { Injectable } from "@nestjs/common";
import { queryEx, MySQLDatabase } from "sourcesql";

const db = MySQLDatabase({
  host: "localhost",
  user: "root",
  password: "",
  database: "test"
});

@Injectable()
export class UsersService {
  async getUsers() {
    const [query, err] = await queryEx(db, "SELECT * FROM users");

    if (err || !query) {
      throw err ?? new Error("Query failed");
    }

    const result = query.GetResultSet();

    if (!result) {
      return [];
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

    return data;
  }
}
```

------------------------------------------------------------------------

## Next.js Example

```ts
import { NextResponse } from "next/server";
import { queryEx, MySQLDatabase } from "sourcesql";

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

## Notes

- Do not call db.end() after every query
- Create DB once and reuse
- Use ? placeholders to prevent SQL injection
- Use GetInt64 for BIGINT values

------------------------------------------------------------------------

## License

MIT

------------------------------------------------------------------------

## Author

Michal "Slynx" Přikryl
