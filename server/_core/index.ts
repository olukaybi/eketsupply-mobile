import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerPaystackWebhook } from "../paystack-webhook";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { authLimiter, paystackLimiter, apiLimiter } from "./rate-limiter";
import helmet from "helmet";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Security headers — set before CORS so headers are always present
  app.use(
    helmet({
      // Allow cross-origin requests needed for the mobile app
      crossOriginResourcePolicy: { policy: "cross-origin" },
      // Disable CSP on API routes (no HTML served here)
      contentSecurityPolicy: false,
    })
  );

  // Enable CORS for all routes - reflect the request origin to support credentials
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      res.header("Access-Control-Allow-Origin", origin);
    }
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization",
    );
    res.header("Access-Control-Allow-Credentials", "true");

    // Handle preflight requests
    if (req.method === "OPTIONS") {
      res.sendStatus(200);
      return;
    }
    next();
  });

  // Paystack webhook MUST be registered BEFORE express.json() so it
  // receives the raw request body needed for HMAC-SHA512 verification
  registerPaystackWebhook(app);

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  registerOAuthRoutes(app);

  // ─── Rate limiting ──────────────────────────────────────────────────────────
  // Auth endpoints: 10 req / 15 min per IP (brute-force protection)
  app.use("/api/auth", authLimiter);
  app.use("/api/trpc/auth", authLimiter);
  // Paystack endpoints: 20 req / 1 min per IP (payment enumeration protection)
  app.use("/api/trpc/paystack", paystackLimiter);
  // General API: 120 req / 1 min per IP (DDoS protection)
  app.use("/api/trpc", apiLimiter);
  // ────────────────────────────────────────────────────────────────────────────

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, timestamp: Date.now() });
  });

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    }),
  );

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`[api] server listening on port ${port}`);
  });
}

startServer().catch(console.error);
