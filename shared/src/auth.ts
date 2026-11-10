import { z } from "zod";

const SPECIAL_CHARACTERS = "!@#$%^&*_\\-+=";

export const passwordSchema = z
  .string()
  .min(8, { error: "Password must be at least 8 characters" })
  .regex(new RegExp(`^[A-Za-z0-9${SPECIAL_CHARACTERS}]+$`), {
    error: "Password can only contain letters, numbers, and !@#$%^&*_-+=",
  })
  .regex(/[a-z]/, { error: "Password must contain a lowercase letter" })
  .regex(/[A-Z]/, { error: "Password must contain an uppercase letter" })
  .regex(/[0-9]/, { error: "Password must contain a number" })
  .regex(new RegExp(`[${SPECIAL_CHARACTERS}]`), {
    error: "Password must contain a special character",
  });

export const signupSchema = z.object({
  name: z.string().min(1),
  email: z.email(),
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export const userSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  email: z.email(),
});

export type User = z.infer<typeof userSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
