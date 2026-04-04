import { z } from 'zod';

export const RegisterSchema = z.object({
  email: z.string().email(),
});

export const CreateAlertSchema = z.object({
  master_token: z.string().min(1),
  item: z.string().min(1).max(100),
  location: z.string().min(1).max(100),
  radius_miles: z.number().int().min(1).max(500).default(20),
  interval: z.enum(['hourly', '6h', 'daily', 'weekly']).default('daily'),
});

export const UpdateAlertSchema = z.object({
  item: z.string().min(1).max(100).optional(),
  location: z.string().min(1).max(100).optional(),
  radius_miles: z.number().int().min(1).max(500).optional(),
  interval: z.enum(['hourly', '6h', 'daily', 'weekly']).optional(),
  status: z.enum(['active', 'paused', 'cancelled']).optional(),
});
