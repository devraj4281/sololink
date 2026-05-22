import { z } from "zod";

export const sendMessageSchema = z
  .object({
    text: z.string().max(2000, "Message cannot exceed 2000 characters").optional(),
    image: z.string().optional(),
    audio: z.string().optional(),
    audioUrl: z.string().optional(),
    audioDuration: z.number().optional(),
    replyToMessageId: z.string().optional(),
  })
  .refine((data) => data.text || data.image || data.audio || data.audioUrl, {
    message: "Either text, image, or audio must be provided",
    path: ["text"],
  });
