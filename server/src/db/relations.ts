import { defineRelations } from "drizzle-orm";
import * as schema from "./schema.js";

export const relations = defineRelations(schema, (r) => ({
  messages: {
    owner: r.one.users({ from: r.messages.userId, to: r.users.id }),
    room: r.one.chatRooms({ from: r.messages.roomId, to: r.chatRooms.id }),
  },
  users: {
    messages: r.many.messages(),
    sessions: r.many.sessions(),
    membership: r.many.usersToChatRooms(),
  },
  sessions: {
    user: r.one.users({ from: r.sessions.userId, to: r.users.id }),
  },
  chatRooms: {
    messages: r.many.messages(),
    membership: r.many.usersToChatRooms(),
  },
}));
