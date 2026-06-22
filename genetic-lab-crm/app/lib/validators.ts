import { z } from 'zod';

export const statusValues = ['IN_COMMUNICATION', 'NDA_SIGNED', 'CONTRACT_SIGNED'] as const;
export const stateValues = ['ACTIVE', 'ARCHIVED'] as const;

export const laboratorySchema = z.object({
  companyName: z.string().min(1, 'Laboratory/company name is required'),
  contactName: z.string().optional().nullable(),
  email: z.string().email('Invalid email').optional().or(z.literal('')).nullable(),
  telephone: z.string().optional().nullable(),
  region: z.string().optional().nullable(),
  status: z.enum(statusValues).default('IN_COMMUNICATION'),
  state: z.enum(stateValues).default('ACTIVE'),
  notes: z.string().optional().nullable(),
  representativeId: z.string().optional().nullable(),
});

export const representativeSchema = z.object({
  name: z.string().min(1, 'Representative name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')).nullable(),
  region: z.string().optional().nullable(),
});

export function displayStatus(status: string) {
  return status.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}
