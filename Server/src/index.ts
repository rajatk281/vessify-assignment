import { Hono } from "hono";
import { cors } from "hono/cors";
import { auth } from "../lib/auth";
import { organizationRouter } from "./routes/organization";
import { transactionsRouter } from "./routes/transactions";

const app = new Hono();

// CORS for frontend integration
app.use(
  "/*",
  cors({
    origin: ["http://localhost:3001", "http://localhost:5173", "https://vessify-assignment-topaz.vercel.app", "https://vessify-assignment-ev1s.onrender.com"],
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

// Health check
app.get("/", (c) => {
  return c.json({ status: "ok", message: "Vessify API is running" });
});

// Better Auth handler
app.on(["POST", "GET"], "/api/auth/*", async (c) => {
  return await auth.handler(c.req.raw);
});

// Routes
app.route("/api/organization", organizationRouter);
app.route("/api/transactions", transactionsRouter);

export default app;
