import { z } from "zod";

export const createChatRoomSchema = z.object({
  name: z.string().min(1).max(24).nonoptional(),
});

export const updateChatRoomSchema = z.object({
  newName: z.string().min(1).max(24).nonoptional(),
});
