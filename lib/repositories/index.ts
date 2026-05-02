import { JsonMediaRepository } from "@/lib/repositories/json-media-repository";
import { PrismaMediaRepository } from "@/lib/repositories/prisma-media-repository";
import type { MediaRepository } from "@/lib/repositories/types";

export function createMediaRepository(): MediaRepository {
  if (process.env.NK_DATA_PROVIDER === "prisma") {
    return new PrismaMediaRepository();
  }

  return new JsonMediaRepository();
}
