import mysql from "mysql2/promise";
import { Client } from "pg";

export async function POST(req) {
  try {
    const body = await req.json();
    const { dbType, host, port, user, password } = body;

    let data = [];
    console.log(`Connecting to ${dbType} database at ${host}:${port} as ${user}`);
    if (dbType === "MySQL") {
      const conn = await mysql.createConnection({ host, port, user, password });

      const [rows] = await conn.execute(`
        SELECT 
            TABLE_SCHEMA AS database_name,
            TABLE_NAME AS table_name
        FROM 
            information_schema.tables
        WHERE 
            TABLE_TYPE = 'BASE TABLE'
            AND TABLE_SCHEMA NOT IN ('information_schema', 'mysql', 'performance_schema', 'sys')
        ORDER BY 
            TABLE_SCHEMA, TABLE_NAME;

      `);
      await conn.end();

      data = rows;

    } else if (dbType === "PostgreSQL") {
      const client = new Client({ host, port, user, password, database: "postgres" });
      await client.connect();

      const result = await client.query(`
        SELECT 
            table_schema AS database_name,
            table_name AS table_name
        FROM 
            information_schema.tables
        WHERE 
            table_type = 'BASE TABLE'
            AND table_schema NOT IN ('pg_catalog', 'information_schema')
        ORDER BY 
            table_schema, table_name;

      `);

      await client.end();

      data = result.rows;
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
