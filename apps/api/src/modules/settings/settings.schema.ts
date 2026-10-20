import { z } from 'zod';

export const DEFAULT_SETTINGS = {
  business: {
    name: 'GCC Web',
    tagline: 'Servis AC dan elektronik rumah, dikerjakan rapi dan bergaransi.',
    phone: '0812-3456-7890',
    whatsapp: '6281234567890',
    email: 'halo@gcc-web.id',
    address: 'Jl. Contoh Raya No. 1',
    city: 'Jakarta Selatan',
    district: 'Kebayoran Baru',
    serviceAreas: [
      'Jakarta Selatan',
      'Jakarta Pusat',
      'Jakarta Barat',
      'Depok',
      'Tangerang Selatan',
    ],
    hours: 'Senin–Sabtu, 08.00–17.00',
    instagram: '',
  },
  payment: {
    bankName: 'BCA',
    bankAccount: '0000000000',
    accountName: 'GCC Web',
    note: 'Konfirmasi bukti transfer melalui WhatsApp agar pesanan segera diproses.',
  },
};

export type SettingsKey = keyof typeof DEFAULT_SETTINGS;

const businessSchema = z.object({
  name: z.string().trim().min(2).max(80),
  tagline: z.string().trim().max(160),
  phone: z.string().trim().max(30),
  whatsapp: z.string().trim().max(30),
  email: z.string().trim().email().max(120),
  address: z.string().trim().max(200),
  city: z.string().trim().max(80),
  district: z.string().trim().max(80),
  serviceAreas: z.array(z.string().trim().min(2).max(60)).max(20),
  hours: z.string().trim().max(120),
  instagram: z.string().trim().max(120),
});

const paymentSchema = z.object({
  bankName: z.string().trim().max(60),
  bankAccount: z.string().trim().max(40),
  accountName: z.string().trim().max(80),
  note: z.string().trim().max(300),
});

export const settingsUpdateSchema = z
  .object({
    business: businessSchema.partial().optional(),
    payment: paymentSchema.partial().optional(),
  })
  .strict();

export type SettingsUpdateInput = z.infer<typeof settingsUpdateSchema>;
