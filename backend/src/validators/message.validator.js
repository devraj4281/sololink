import { z } from "zod";

export const sendMessageSchema = z
  .object({
    text: z.string().max(2000, "Message cannot exceed 2000 characters").optional(),
    image: z.string().optional(),
  })
  .refine((data) => data.text || data.image, {
    message: "Either text or image must be provided",
    path: ["text"],
  });
