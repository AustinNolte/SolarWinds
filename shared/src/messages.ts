import { z } from "zod";

export const messageSchema = z.object({
  content: z.string().min(1).max(255).nonoptional(),
  userId: z.uuid().nonoptional(),
  roomId: z.uuid().nonoptional(),
});

export type Message = z.infer<typeof messageSchema>;
