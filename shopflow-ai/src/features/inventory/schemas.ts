import { z } from 'zod';

/* -------------------------------------------------------------------------- */
/*  Shared field validators                                                   */
/*  Forms keep numbers as strings (react-hook-form friendly); the service      */
/*  layer receives already-converted numbers.                                  */
/* -------------------------------------------------------------------------- */

const money = z
  .string()
  .min(1, 'Required')
  .regex(/^\d+(\.\d{1,2})?$/, 'Enter a valid amount (e.g. 12.99)');

const wholeNumber = z
  .string()
  .min(1, 'Required')
  .regex(/^\d+$/, 'Whole number only');

const optionalWhole = z
  .string()
  .regex(/^\d*$/, 'Whole number only');

const optionalEmail = z
  .string()
  .regex(/^$|^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Enter a valid email address');

const optionalPhone = z.string().max(24, 'Too long');

/* -------------------------------------------------------------------------- */
/*  Product                                                                   */
/* -------------------------------------------------------------------------- */

export const productFormSchema = z.object({
  name: z.string().min(2, 'Name is too short').max(80, 'Max 80 characters'),
  description: z.string().max(400, 'Max 400 characters'),
  sku: z
    .string()
    .min(1, 'SKU is required')
    .max(24, 'Max 24 characters')
    .regex(/^[A-Za-z0-9][A-Za-z0-9_-]{2,23}$/, 'Use 3–24 letters, numbers, dashes or underscores'),
  barcode: z.string().regex(/^$|^(\d{8}|\d{12,13})$/, 'Use 8 or 12–13 digits'),
  categoryId: z.string().min(1, 'Select a category'),
  supplierId: z.string(),
  price: money,
  cost: money,
  /** Only used on creation — updates go through stock adjustments. */
  stock: optionalWhole,
  reorderPoint: wholeNumber,
  unit: z.string().min(1, 'Pick a unit'),
  status: z.enum(['active', 'draft', 'archived']),
  imageUrl: z.string().regex(/^$|^(data:image\/|https?:\/\/)/, 'Must be an image URL'),
  isFeatured: z.boolean(),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;

/* -------------------------------------------------------------------------- */
/*  Category                                                                  */
/* -------------------------------------------------------------------------- */

export const categoryFormSchema = z.object({
  name: z.string().min(2, 'Name is too short').max(40, 'Max 40 characters'),
  description: z.string().max(200, 'Max 200 characters'),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Pick a color'),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;

/* -------------------------------------------------------------------------- */
/*  Supplier                                                                  */
/* -------------------------------------------------------------------------- */

export const supplierFormSchema = z.object({
  name: z.string().min(2, 'Name is too short').max(60, 'Max 60 characters'),
  contactName: z.string().max(60, 'Max 60 characters'),
  email: optionalEmail,
  phone: optionalPhone,
  address: z.string().max(160, 'Max 160 characters'),
  leadTimeDays: z
    .string()
    .min(1, 'Required')
    .regex(/^\d+$/, 'Whole number only')
    .refine((value) => Number(value) >= 1 && Number(value) <= 90, 'Between 1 and 90 days'),
  status: z.enum(['active', 'inactive']),
  notes: z.string().max(300, 'Max 300 characters'),
});

export type SupplierFormValues = z.infer<typeof supplierFormSchema>;

/* -------------------------------------------------------------------------- */
/*  Stock adjustment                                                          */
/* -------------------------------------------------------------------------- */

export const adjustStockSchema = z.object({
  mode: z.enum(['in', 'out', 'set']),
  quantity: z
    .string()
    .min(1, 'Enter a quantity')
    .regex(/^\d+$/, 'Whole number only'),
  reason: z.string().min(1, 'Pick a reason'),
  note: z.string().max(200, 'Max 200 characters'),
});

export type AdjustStockFormValues = z.infer<typeof adjustStockSchema>;
