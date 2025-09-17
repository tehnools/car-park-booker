// src/index.ts
import Fastify from "fastify";
import sqlite3 from "sqlite3";

const db = new sqlite3.Database("./db.sqlite");

const fastify = Fastify({ logger: true });
const port = Number(process.env.PORT) || 3000;
const host = process.env.HOST || "0.0.0.0";

fastify.get("/", async (request, reply) => {
  return { message: "Hello from Fastify!" };
});

const start = async () => {
  try {
    await fastify.listen({ port });
    console.log(`Server running on port http://${host}:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
