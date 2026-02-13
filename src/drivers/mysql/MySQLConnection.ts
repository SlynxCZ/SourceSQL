import mysql from "mysql2/promise";
import { ISQLConnection } from "@core/ISQLConnection";
import { ISQLQuery } from "@core/ISQLQuery";
import { MySQLQuery } from "@drivers/mysql/MySQLQuery";

export class MySQLConnection implements ISQLConnection {
  private pool: mysql.Pool;

  constructor(config: mysql.PoolOptions) {
    this.pool = mysql.createPool(config);
  }

  async query(sql: string, params?: any[]): Promise<ISQLQuery> {
    const [rows, meta] = await this.pool.query(sql, params);

    if (Array.isArray(rows)) {
      return new MySQLQuery(rows, {});
    }

    return new MySQLQuery([], meta);
  }

  escape(value: any): string {
    return mysql.escape(value);
  }

  escapeId(value: string): string {
    return mysql.escapeId(value);
  }

  escapeTable(database: string, table: string): string {
    return `${this.escapeId(database)}.${this.escapeId(table)}`;
  }
}
