import mysql from "mysql2/promise";
import { Client } from "pg";

export async function POST(req) {
  try {
    const body = await req.json();
    const { dbType, host, port, user, password, tableName } = body;

    let data;
    console.log(`Connecting to ${dbType} database at ${host}:${port} as ${user}`);
    if (dbType === "MySQL") {
      const conn = await mysql.createConnection({ host, port, user, password });
      const [rows] = await conn.query(`SHOW CREATE TABLE ${tableName}`);
      await conn.end();

      data = rows?.[0]?.["Create Table"] || null;

    } else if (dbType === "PostgreSQL") {
      const client = new Client({ host, port, user, password, database: "postgres" });
      await client.connect();

      const query = `SELECT pg_get_tabledef($1::regclass) AS definition;`;

      const result = await client.query(query, [tableName]);
      await client.end();

      data = result.rows?.[0]?.definition || null;
    } else {
      return new Response(JSON.stringify({ error: `Unsupported DB type ${dbType}` }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ data }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("❌ Error fetching data:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
