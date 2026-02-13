# SourceSQL

C++ style SQL interface for Node.js and TypeScript.

## Features

- OOP API inspired by Source / Source2 developement style (`ISQL*`)
- Works with MySQL (`mysql2`)
- Promise-based
- Clean TypeScript typings
- Easy to extend (SQLite, Postgres, etc.)

## Installation

```bash
npm install sourcesql
```

## Usage

```ts
import { MySQLConnection } from "sourcesql";

const db = new MySQLConnection({
  host: "localhost",
  user: "root",
});

const query = await db.query("SELECT id, name FROM sampledb.users");

const result = query.getResultSet();

while (result.moreRows()) {
  const row = result.fetchRow();

  const id = row.getInt("id");
  const name = row.getString("name");

  console.log(id, name);
}
```

## QueryEx (C++ style result)

```ts
import { queryEx } from "sourcesql";

const [query, error] = await queryEx(db, "SELECT * FROM sampledb.users");

if (error) {
  console.error(error);
} else {
  const result = query.getResultSet();
}
```

## API

### ISQLConnection

```ts
query(sql: string, params?: any[]): Promise<ISQLQuery>
escape(value: any): string
escapeId(value: string): string
```

### ISQLQuery

```ts
getResultSet(): ISQLResult
getInsertId(): number
getAffectedRows(): number
```

### ISQLResult

```ts
getRowCount(): number
getFieldCount(): number
fieldNameToNum(name: string): number | null
fieldNumToName(index: number): string | null
moreRows(): boolean
fetchRow(): ISQLRow | null
rewind(): void
```

### ISQLRow

```ts
getString(field: string | number): string | null
getInt(field: string | number): number
getFloat(field: string | number): number
isNull(field: string | number): boolean
```

## Example with field index

```ts
const col = result.fieldNameToNum("name");

while (result.moreRows()) {
  const row = result.fetchRow();
  console.log(row.getString(col));
}
```

## Roadmap

- Transactions API
- SQLite driver
- Postgres driver
- Prepared statements cache
- Connection manager

## License

MIT
