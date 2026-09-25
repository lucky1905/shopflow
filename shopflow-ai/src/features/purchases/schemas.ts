import { z } from 'zod';

/** GRN submission: one received/damaged entry per ordered line. */
export const grnFormSchema = z.object({
  receivedBy: z.string().min(2, 'Receiver name is required').max(60),
  note: z.string().max(200, 'Keep the note under 200 characters').optional().default(''),
  lines: z
    .array(
      z.object({
        productId: z.string().min(1),
        receivedQty: z.number().int().min(0).max(9999),
        damagedQty: z.number().int().min(0).max(9999),
      }),
    )
    .min(1, 'At least one line is required'),
});

export type GrnFormValues = z.infer<typeof grnFormSchema>;

/** Supplier payment recording against a purchase order. */
export const paymentFormSchema = z.object({
  amount: z
    .number({ invalid_type_error: 'Enter an amount' })
    .positive('Amount must be greater than zero'),
  method: z.enum(['bank', 'cash', 'check']),
  reference: z.string().max(40, 'Keep the reference under 40 characters').optional().default(''),
});

export type PaymentFormValues = z.infer<typeof paymentFormSchema>;