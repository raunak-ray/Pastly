import z from "zod";

export const createPasteSchema = z.object({
  content: z.string().nonempty(),
  expiresIn: z.enum(["1h", "6h", "1d", "7d", "30d"]).default("1d"),
  language: z.string().nonempty(),
  title: z.string().nonempty(),
});

export type CreatePasteType = z.infer<typeof createPasteSchema>;
