import { z } from 'zod';

export const createSnapSchema = z.object({
  code: z.string().trim().min(5).max(30),
  phone: z.string().trim().min(9).max(20),
});

export const midtransNotificationSchema = z.object({
  order_id: z.string().min(1),
  status_code: z.string().min(1),
  gross_amount: z.string().min(1),
  signature_key: z.string().min(1),
  transaction_status: z.string().min(1),
  fraud_status: z.string().optional(),
  transaction_id: z.string().optional(),
  payment_type: z.string().optional(),
});
