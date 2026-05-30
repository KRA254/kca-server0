import crypto from "node:crypto";
import { config } from "../config";

export const uploadToCloudinary = async (file: File) => {
  if (!config.cloudinaryCloudName || !config.cloudinaryApiKey || !config.cloudinaryApiSecret) {
    throw new Error("Cloudinary is not configured.");
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const paramsToSign = `folder=${config.cloudinaryFolder}&timestamp=${timestamp}${config.cloudinaryApiSecret}`;
  const signature = crypto.createHash("sha1").update(paramsToSign).digest("hex");
  const form = new FormData();
  form.set("file", file);
  form.set("api_key", config.cloudinaryApiKey);
  form.set("timestamp", String(timestamp));
  form.set("folder", config.cloudinaryFolder);
  form.set("signature", signature);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${config.cloudinaryCloudName}/image/upload`, {
    method: "POST",
    body: form,
  });
  const body = await response.json() as Record<string, any>;
  if (!response.ok) {
    throw new Error(body.error?.message ?? "Image upload failed.");
  }

  return {
    url: body.secure_url as string,
    publicId: body.public_id as string,
    width: body.width as number | undefined,
    height: body.height as number | undefined,
    format: body.format as string | undefined,
  };
};
