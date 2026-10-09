import type { IncomingMessage, ServerResponse } from "http";
import { getApp } from "../server/app";

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    const app = await getApp();
    return new Promise<void>((resolve, reject) => {
      res.on("finish", () => resolve());
      res.on("close", () => resolve());
      res.on("error", (err) => reject(err));
      app(req as any, res as any, (err: any) => {
        if (err) {
          console.error("[Vercel API] Express error:", err);
          if (!res.headersSent) {
            res.statusCode = err.status || 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: err.message || "Internal Server Error" }));
          }
          resolve();
        }
      });
    });
  } catch (err: any) {
    console.error("[Vercel API] Fatal initialization error:", err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ 
        error: "Internal Server Error", 
        message: err?.message || "Failed to initialize serverless API" 
      }));
    }
  }
}

