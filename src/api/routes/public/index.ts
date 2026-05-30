import { Hono } from "hono";
import { healthRouter } from "./health";

export const publicRouter = new Hono();

publicRouter.route("/", healthRouter);
