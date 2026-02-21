import { MySQLConnection } from "@drivers/mysql/MySQLConnection";
import { ISQLConnection } from "@core/ISQLConnection";

export function MySQLDatabase(config: any): ISQLConnection {
  return new MySQLConnection(config);
}