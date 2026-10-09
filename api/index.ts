import type { IncomingMessage, ServerResponse } from "http";
import { getApp } from "../server/app";

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const app = await getApp();
  return app(req as any, res as any);
}
