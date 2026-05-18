import { z } from 'zod';

const socialItem = z.object({
    display_name: z.string(),
    icon: z.string().optional(),
    value: z.string().url('URL tidak valid').optional().or(z.literal('')),
});

const marketplaceItem = z.object({
    display_name: z.string(),
    icon: z.string().optional(),
    value: z.string().url('URL tidak valid').optional().or(z.literal('')),
});

export const generalSchema = z.object({
    site_title: z.string().min(3, 'Site title minimal 3 karakter'),
    tagline: z.string().optional(),
    description: z.string().optional(),
    short_description: z.string().optional(),

    users_can_register: z.boolean(),

    alamat_instansi: z.string().optional(),
    email_instansi: z
        .string()
        .email('Email tidak valid')
        .optional()
        .or(z.literal('')),
    phone_instansi: z.string().optional(),
    whatsapp_instansi: z.string().optional(),

    instansi_map: z.string().optional(),

    marketplace: z.array(marketplaceItem),
    social_media: z.array(socialItem),

    favicon_ico: z.any().nullable(),
    favicon_ico_url: z.string().optional(),

    logo: z.any().nullable(),
    logo_url: z.string().optional(),

    logo_footer: z.any().nullable(),
    logo_footer_url: z.string().optional(),

    logo_mobile: z.any().nullable(),
    logo_mobile_url: z.string().optional(),
});
