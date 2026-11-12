import { Router } from "express";
import { z } from "zod";
import { db } from "../db/index.js";
import { messages, users, usersToChatRooms } from "../db/schema.js";
import { eq } from "drizzle-orm";
