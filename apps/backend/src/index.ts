// src/index.ts
import Fastify from "fastify";
import initSqlJs from "sql.js";
import fs from "fs";

let db: any;

const DB_FILE = "./db.sqlite";

async function loadDatabase() {
  const SQL = await initSqlJs();
  if (fs.existsSync(DB_FILE)) {
    const filebuffer = fs.readFileSync(DB_FILE);
    db = new SQL.Database(filebuffer);
  } else {
    db = new SQL.Database();
    // Optionally, run schema creation here
  }
}

const fastify = Fastify({ logger: true });
const port = Number(process.env.PORT) || 3000;
const host = process.env.HOST || "0.0.0.0";

const writeDatabase = () => {
  fs.writeFileSync(DB_FILE, Buffer.from(db.export()));
};

fastify.get("/", async (request, reply) => {
  return { message: "Hello from Fastify!" };
});

fastify.get("/bookings", async (request, reply) => {
  try {
    const res = db.exec("SELECT * FROM bookings");
    const rows = res[0]
      ? res[0].values.map((row: any[]) => {
          const obj: any = {};
          res[0].columns.forEach((col: string, i: number) => (obj[col] = row[i]));
          return obj;
        })
      : [];
    reply.send(rows);
  } catch (error) {
    console.error(error);
    reply.status(500).send({ error: "Database error" });
  }
});

fastify.post("/bookings", async (request, reply) => {
  const { name, date } = request.body as { name: string; date: string };
  try {
    db.run("INSERT INTO bookings (name, booking_date) VALUES (?, ?)", [name, date]);
    writeDatabase();

    reply.status(201).send({ name, date });
  } catch (error: any) {
    if (error.message && error.message.includes("UNIQUE constraint failed")) {
      reply.status(409).send({ error: "Booking already exists for this date, try another date" });
    } else {
      reply.status(500).send({ error: "Database error" });
    }
  }
});

const start = async () => {
  await loadDatabase();
  try {
    await fastify.listen({ port });
    console.log(`Server running on port http://${host}:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
