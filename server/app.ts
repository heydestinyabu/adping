import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db";
import { registerRoutes } from "./routes/index";
import "dotenv/config";
import fs from "fs";
import path from "path";
import { initializeUploadsDirectory } from "./middlewares/upload.middleware";
import { rateLimitMiddleware } from "./middlewares/rate-limit.middleware";
import { diployLogger, DIPLOY_HEADER_KEY, DIPLOY_HEADER_VALUE, DIPLOY_VERSION, DIPLOY_PRODUCT_NAME } from "@diploy/core";
import { runStartupMigration } from "./startup-migration";
import { capturePublicOriginMiddleware } from "./services/public-origin";
import { csrfMiddleware, csrfTokenEndpoint } from "./middlewares/csrf.middleware";

export const app = express();
app.set("trust proxy", 1);

app.use((_req, res, next) => {
  res.setHeader(DIPLOY_HEADER_KEY, DIPLOY_HEADER_VALUE);
  next();
});

app.get("/api/version", (_req, res) => {
  res.json({ version: DIPLOY_VERSION, product: DIPLOY_PRODUCT_NAME });
});

// Raw webhooks
app.use('/webhooks/stripe', express.raw({ type: 'application/json' }));
app.use('/webhooks/razorpay', express.raw({ type: 'application/json' }));
app.use('/webhooks/paypal', express.raw({ type: 'application/json' }));
app.use('/webhooks/paystack', express.raw({ type: 'application/json' }));
app.use('/webhooks/mercadopago', express.raw({ type: 'application/json' }));

app.use(
  express.json({
    limit: '50mb',
    verify: (req: any, _res, buf) => {
      if (buf && buf.length) req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

app.get(["/favicon.svg", "/favicon.ico"], (_req, res) => {
  const svgPath = path.join(process.cwd(), "public", "favicon.svg");
  if (fs.existsSync(svgPath)) {
    res.setHeader("Content-Type", "image/svg+xml");
    return res.sendFile(svgPath);
  }
  res.status(404).end();
});

app.get(["/laikipay_logo.png", "/assets/splash/laikipay_logo.png"], (_req, res) => {
  const customPath = "/Users/elite/Desktop/Projects/Laiki-pay/mobile-app/assets/splash/laikipay_logo.png";
  if (fs.existsSync(customPath)) {
    res.setHeader("Content-Type", "image/png");
    return res.sendFile(customPath);
  }
  const localPath = path.join(process.cwd(), "client", "public", "laikipay_logo.png");
  if (fs.existsSync(localPath)) {
    res.setHeader("Content-Type", "image/png");
    return res.sendFile(localPath);
  }
  res.status(404).end();
});

app.use("/uploads", express.static("uploads"));
app.use("/uploads", express.static(path.join(process.cwd(), "public", "uploads")));

app.use(
  "/widget",
  express.static(path.join(process.cwd(), "public", "widget"), {
    setHeaders: (res) => {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    },
  })
);

// Get online agents
app.get("/api/agents/online", (req, res) => {
  const { siteId } = req.query;
  const agents = (global as any).io?.getOnlineAgents?.(siteId as string) || [];
  res.json({ agents });
});

try {
  initializeUploadsDirectory();
} catch (e) {
  // Ignored in read-only / serverless environments
}

// Session management
const PostgresSessionStore = connectPgSimple(session);
const isProd = process.env.NODE_ENV === "production";
const sessionSecret = process.env.SESSION_SECRET || "your-secret-key-change-in-production";

app.use(
  session({
    store: new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    }),
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: isProd && process.env.FORCE_HTTPS !== "false",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

app.use(capturePublicOriginMiddleware);
app.use(rateLimitMiddleware);
app.get("/api/csrf-token", csrfTokenEndpoint);
app.use(csrfMiddleware);

let appReadyPromise: Promise<void> | null = null;

export async function getApp(): Promise<express.Express> {
  if (!appReadyPromise) {
    appReadyPromise = (async () => {
      try {
        await runStartupMigration(pool);
      } catch (err) {
        console.warn("[startup-migration] Startup migration warning:", err);
      }

      await registerRoutes(app);

      app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
        const status = err.status || err.statusCode || 500;
        const message = err.message || "Internal Server Error";
        console.error(`[Express] Error ${status}:`, err);
        res.status(status).json({ message });
      });
    })();
  }
  await appReadyPromise;
  return app;
}
