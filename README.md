# SourceSQL

High-performance C++-style SQL interface for Node.js inspired by Source
/ Source2 development.

------------------------------------------------------------------------

## Overview

SourceSQL is a lightweight SQL abstraction layer designed to replicate
the feel of SourceMod / Source2 database APIs in modern JavaScript and
TypeScript.

It provides a predictable, low-level, and type-safe interface similar to
C++ plugin environments, while still supporting async/await and modern
Node.js patterns.

Unlike ORMs, SourceSQL gives you full control over your queries while
maintaining safety and clarity.

------------------------------------------------------------------------

## Why SourceSQL?

Most Node.js database libraries fall into two extremes:

-   Raw SQL (unsafe, repetitive)
-   ORMs (complex, abstract, slow)

SourceSQL sits in the middle:

-   Full control over SQL
-   Safe parameter binding
-   Minimal abstraction
-   Predictable performance
-   Familiar C++-style workflow

------------------------------------------------------------------------

## Features

-   C++-style API (`ISQLConnection`, `ISQLQuery`, `ISQLResult`,
    `ISQLRow`)
-   Promise-based & callback-based queries
-   MySQL (`mysql2`) driver
-   PostgreSQL (`pg`) driver
-   Built-in connection pooling
-   Prepared statement support (`?` placeholders)
-   Automatic placeholder conversion (Postgres `$1, $2, ...`)
-   `queryEx` helper (`[result, error]` tuple)
-   Transaction support
-   BigInt-safe (`GetInt64`)
-   Nullable-safe getters
-   Multi-database support (`db.table`)
-   Serverless-compatible
-   Clean TypeScript typings
-   Easily extensible (SQLite, etc.)

------------------------------------------------------------------------

## Installation

``` bash
npm install sourcesql
```

------------------------------------------------------------------------

## Creating a Database

### MySQL

``` ts
import { MySQLDatabase } from "sourcesql";

const db = MySQLDatabase({
  host: "localhost",
  user: "root",
  password: "",
  database: "test"
});
```

### PostgreSQL

``` ts
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

## Connection Management

SourceSQL uses connection pooling internally for optimal performance.

You do not need to manually manage connections --- simply create the
database once and reuse it across your application.

------------------------------------------------------------------------

## Basic Usage

``` ts
import { queryEx } from "sourcesql";

const [query, err] = await queryEx(
  db,
  "SELECT id, name FROM users WHERE id = ?",
  [1]
);
```

------------------------------------------------------------------------

## Performance

SourceSQL is designed to be extremely lightweight:

-   No query builders
-   No object mapping
-   No reflection
-   No runtime schema parsing

Queries are executed directly with minimal overhead.

------------------------------------------------------------------------

## License

MIT

------------------------------------------------------------------------

## Author

Michal "Slynx" Přikryl
