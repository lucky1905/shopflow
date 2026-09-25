import { z } from 'zod';

/* -------------------------------------------------------------------------- */
/*  Shared field validators                                                   */
/*  Forms keep amounts as strings (react-hook-form friendly); the store and    */
/*  service layers receive already-converted numbers.                          */
/* -------------------------------------------------------------------------- */

const money = z
  .string()
  .min(1, 'Required')
  .regex(/^\d+(\.\d{1,2})?$/, 'Enter a valid amount (e.g. 12.99)');

/* -------------------------------------------------------------------------- */
/*  Order discount                                                            */
/* -------------------------------------------------------------------------- */

export const discountFormSchema = z
  .object({
    type: z.enum(['percent', 'amount']),
    value: money,
  })
  .refine((data) => data.type !== 'percent' || Number(data.value) <= 100, {
    message: 'Percentage cannot exceed 100',
    path: ['value'],
  });

export type DiscountFormValues = z.infer<typeof discountFormSchema>;

/* -------------------------------------------------------------------------- */
/*  Hold (park) the current cart                                              */
/* -------------------------------------------------------------------------- */

export const holdCartFormSchema = z.object({
  label: z.string().min(2, 'Label is too short').max(40, 'Max 40 characters'),
});

export type HoldCartFormValues = z.infer<typeof holdCartFormSchema>;

/* -------------------------------------------------------------------------- */
/*  Quick customer creation (POS counter)                                     */
/* -------------------------------------------------------------------------- */

export const posCustomerFormSchema = z.object({
  name: z.string().min(2, 'Name is too short').max(60, 'Max 60 characters'),
  phone: z.string().regex(/^$|^[\d\s()+-]{7,20}$/, 'Enter a valid phone number'),
  email: z.string().regex(/^$|^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Enter a valid email address'),
});

export type PosCustomerFormValues = z.infer<typeof posCustomerFormSchema>;

/* -------------------------------------------------------------------------- */
/*  Cash tender                                                               */
/* -------------------------------------------------------------------------- */

export const cashTenderSchema = z.object({
  tendered: money,
});

export type CashTenderFormValues = z.infer<typeof cashTenderSchema>;