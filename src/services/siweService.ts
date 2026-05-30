import { SiweMessage } from "siwe";
import { v4 as uuidv4 } from "uuid";
import { redis } from "../lib/redis";
import { config } from "../config";

const nonceKey = (nonce: string) => `siwe:nonce:${nonce}`;

export const createSiweNonce = async () => {
  const nonce = uuidv4().replace(/-/g, "");
  await redis.setex(nonceKey(nonce), config.siweExpirationSeconds, "1");
  return nonce;
};

export const verifySiweMessage = async (input: {
  message: string;
  signature: string;
  nonce: string;
}) => {
  const exists = await redis.get(nonceKey(input.nonce));
  if (!exists) {
    throw new Error("Nonce expired");
  }
  const siweMessage = new SiweMessage(input.message);
  const allowedDomains = config.siweDomains.length > 0 ? config.siweDomains : [config.siweDomain].filter(Boolean);
  const domain = siweMessage.domain;

  if (allowedDomains.length > 0 && !allowedDomains.includes(domain)) {
    throw new Error(`SIWE domain not allowed: ${domain}`);
  }

  const result = await siweMessage.verify({
    signature: input.signature,
    nonce: input.nonce,
    domain,
    time: new Date().toISOString(),
  });
  await redis.del(nonceKey(input.nonce));
  return result;
};
