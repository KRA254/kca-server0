import { Hono } from "hono";
import { uploadToCloudinary } from "../../services/cloudinaryService";
import { publicUploadRateLimitMiddleware } from "../middleware/rateLimit";

export const uploadsRouter = new Hono();

uploadsRouter.post("/images", publicUploadRateLimitMiddleware, async (c) => {
  const body = await c.req.parseBody();
  const file = body.file;
  if (!(file instanceof File)) {
    return c.json({ status: 400, message: "Image file is required.", code: "VALIDATION_ERROR" }, 400);
  }
  if (!file.type.startsWith("image/")) {
    return c.json({ status: 400, message: "Only image uploads are allowed.", code: "VALIDATION_ERROR" }, 400);
  }
  if (file.size > 5 * 1024 * 1024) {
    return c.json({ status: 400, message: "Image must be 5MB or smaller.", code: "VALIDATION_ERROR" }, 400);
  }
  return c.json(await uploadToCloudinary(file), 201);
});
