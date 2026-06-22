import crypto from "crypto";
import { prisma } from "./prisma";

export function generateApiKey(): string {
  return "tlk_" + crypto.randomBytes(32).toString("hex");
}

export function hashApiKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

export async function validateApiKey(raw: string) {
  const hash = hashApiKey(raw);
  const record = await prisma.apiKey.findUnique({
    where: { keyHash: hash },
    include: { user: true },
  });
  if (!record) return null;
  await prisma.apiKey.update({
    where: { id: record.id },
    data: { lastUsedAt: new Date() },
  });
  return record.user;
}
