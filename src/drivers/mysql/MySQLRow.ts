import { ISQLRow } from "@core/ISQLRow";

export class MySQLRow implements ISQLRow {
  constructor(private row: any, private fields: string[]) {}

  private resolve(field: string | number): any {
    if (typeof field === "number")
      return this.row[this.fields[field]];
    return this.row[field];
  }

  GetString(field: string | number): string | null {
    const val = this.resolve(field);
    return val == null ? null : String(val);
  }

  GetInt(field: string | number): number {
    const val = this.resolve(field);
    return val == null ? 0 : Number(val);
  }

  GetFloat(field: string | number): number {
    return this.GetInt(field);
  }

  GetInt64(field: string | number): string {
    const val = this.resolve(field);
    return val == null ? "0" : String(val);
  }

  IsNull(field: string | number): boolean {
    return this.resolve(field) == null;
  }
}
