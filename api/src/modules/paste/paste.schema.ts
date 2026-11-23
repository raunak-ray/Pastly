import z from "zod";

export const createPasteSchema = z.object({
  content: z.string().nonempty(),
  expiresIn: z.enum(["1h", "6h", "1d", "7d", "30d"]).default("1d"),
  language: z.string().nonempty(),
  title: z.string().nonempty(),
});

export const getPasteSchema = z.object({
  code: z.coerce
    .string()
    .nonempty()
    .max(15)
    .regex(/^[a-zA-Z0-9]+$/, {
      error: "Short code must contains only alphanumeric characters",
    }),
});

export type CreatePasteType = z.infer<typeof createPasteSchema>;
export type GetPasteType = z.infer<typeof getPasteSchema>;
