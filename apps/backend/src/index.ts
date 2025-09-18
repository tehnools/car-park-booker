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

fastify.get(
  "/bookings",
  {
    schema: {
      querystring: {
        type: "object",
        properties: {
          month: { type: "string", pattern: "^\\d{4}-\\d{2}$" }, // YYYY-MM
        },
      },
      response: {
        200: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "integer" },
              name: { type: "string" },
              booking_date: { type: "string", format: "date" },
            },
          },
        },
        "5xx": { type: "object", properties: { error: { type: "string" } } },
      },
    },
  },
  async (request, reply) => {
    try {
      const { month } = request.query as { month?: string };
      let query = "SELECT * FROM bookings";
      let params: any[] = [];
      if (month) {
        // SQLite: strftime('%Y-%m', booking_date) = 'YYYY-MM'
        query += " WHERE strftime('%Y-%m', booking_date) = ?";
        params.push(month);
      }
      const res = db.exec(query, params);
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
  }
);

fastify.post(
  "/bookings",
  {
    schema: {
      body: {
        type: "object",
        required: ["name", "date", "time"],
        properties: {
          name: { type: "string" },
          date: { type: "string", format: "date" },
          time: { type: "string", pattern: "^\\d{2}:\\d{2}$" },
        },
      },
      response: {
        201: {
          type: "object",
          properties: {
            name: { type: "string" },
            date: { type: "string", format: "date" },
          },
        },
        "4xx": {
          type: "object",
          properties: {
            error: { type: "string" },
          },
        },
        "5xx": {
          type: "object",
          properties: {
            error: { type: "string" },
          },
        },
      },
    },
  },
  async (request, reply) => {
    const { name, date, time } = request.body as { name: string; date: string; time: string };
    try {
      const tz = "Pacific/Auckland";
      const bookingDateTime = new Date(
        new Date(`${date}T${time}:00`).toLocaleString("en-US", { timeZone: tz })
      );
      const now = new Date(new Date().toLocaleString("en-US", { timeZone: tz }));
      if (bookingDateTime <= now) {
        return reply.status(400).send({ error: "Cannot book a date/time in the past." });
      }
      db.run("INSERT INTO bookings (name, booking_date) VALUES (?, ?)", [name, `${date} ${time}`]);
      writeDatabase();

      return reply.status(201).send({ name, date, time });
    } catch (error: any) {
      if (error.message && error.message.includes("UNIQUE constraint failed")) {
        return reply
          .status(409)
          .send({ error: "Booking already exists for this date, try another date" });
      } else {
        return reply.status(500).send({ error: "Database error" });
      }
    }
  }
);

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
