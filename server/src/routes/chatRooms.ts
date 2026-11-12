import { Router } from "express";
import { z } from "zod";
import { db } from "../db/index.js";
import { chatRooms, users, usersToChatRooms } from "../db/schema.js";
import { and, eq } from "drizzle-orm";
import { createChatRoomSchema, updateChatRoomSchema } from "shared";

export const chatRoomRouter = Router();

chatRoomRouter.post("/rooms", async (req, res) => {
  const parsed = createChatRoomSchema.safeParse(req.body);

  if (!parsed.success) return res.status(400).json({ error: z.prettifyError(parsed.error) });
  if (!req.user) return res.status(401).json({ error: "not logged in" });

  const { name } = parsed.data;
  const userId = req.user.id;
  try {
    const chatRoom = await db.transaction(async (tx) => {
      const [newChatRoom] = await tx
        .insert(chatRooms)
        .values({ name: name, ownerId: userId })
        .returning();
      if (!newChatRoom) return tx.rollback();

      const [newMembership] = await tx
        .insert(usersToChatRooms)
        .values({ userId: userId, roomId: newChatRoom.id })
        .returning();
      if (!newMembership) return tx.rollback();

      return newChatRoom;
    });
    if (chatRoom) return res.status(201).json({ chatRoom: chatRoom });
  } catch {
    return res.status(500).json({ error: "error creating room, please try again later" });
  }
});

chatRoomRouter.get("/rooms", async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "not logged in" });
  const reqUserId = req.user.id;

  const memberships = await db.query.usersToChatRooms.findMany({
    where: { userId: reqUserId },
    with: { room: true },
  });

  const rooms = memberships.map((membership) => membership.room);

  return res.status(200).json({ rooms });
});

chatRoomRouter.post("/rooms/:id/join", async (req, res) => {
  const id = z.uuid().safeParse(req.params.id);
  if (!id.success) return res.status(400).json({ error: z.prettifyError(id.error) });
  if (!req.user) return res.status(401).json({ error: "not logged in" });
  const reqUserId = req.user.id;

  try {
    await db
      .insert(usersToChatRooms)
      .values({ userId: reqUserId, roomId: id.data });

    return res.status(201).end();
  } catch (err) {
    const code =
      (err as { code?: string; cause?: { code?: string } }).cause?.code ??
      (err as { code?: string }).code;
    if (code === "23505") {
      return res.status(409).json({ error: "already a member of this room" });
    }
    if (code === "23503") {
      return res.status(404).json({ error: "room not found" });
    }
    throw err;
  }
});

chatRoomRouter.patch("/rooms/:id", async (req, res) => {
  const id = z.uuid().safeParse(req.params.id);
  if (!id.success) return res.status(400).json({ error: z.prettifyError(id.error) });

  const parsed = updateChatRoomSchema.safeParse(req.body);

  if (!parsed.success) return res.status(400).json({ error: z.prettifyError(parsed.error) });

  if (!req.user) return res.status(401).json({ error: "not logged in" });
  const reqUserId = req.user.id;

  const { newName } = parsed.data;
  try {
    const [updated] = await db
      .update(chatRooms)
      .set({ name: newName })
      .where(and(eq(chatRooms.id, id.data), eq(chatRooms.ownerId, reqUserId)))
      .returning();

    if (!updated) return res.status(404).json({ error: "Chat Room Not Found" });
    res.status(200).json({ room: updated });
  } catch {
    return res.status(500).json({ error: "error updating room, please try again later" });
  }
});

chatRoomRouter.delete("/rooms/:id", async (req, res) => {
  const id = z.uuid().safeParse(req.params.id);
  if (!id.success) return res.status(400).json({ error: z.prettifyError(id.error) });
  if (!req.user) return res.status(401).json({ error: "not logged in" });
  const reqUserId = req.user.id;

  const [deleted] = await db
    .delete(chatRooms)
    .where(and(eq(chatRooms.id, id.data), eq(chatRooms.ownerId, reqUserId)))
    .returning();

  if (!deleted) {
    return res.status(404).json({ error: "Chat Room not Found" });
  }

  res.status(204).end();
});
