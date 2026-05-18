import { z } from 'zod';

export const categorySchema = z.object({
    category_name: z.string().min(3, 'Nama kategori minimal 3 karakter'),

    description: z
        .string()
        .max(500, 'Deskripsi maksimal 500 karakter')
        .optional()
        .or(z.literal('')),

    parent_id: z.string().optional(),

    featured_image: z
        .string()
        .url('URL tidak valid')
        .optional()
        .or(z.literal('')),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;
