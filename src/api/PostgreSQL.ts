import { PostgresConnection } from "@drivers/postgres/PostgresConnection";
import { ISQLConnection } from "@core/ISQLConnection";

export function PostgreSQLDatabase(config: any): ISQLConnection {
  return new PostgresConnection(config);
}