import { z } from 'zod'

// Customer validation schema
export const customerAddressSchema = z.object({
    id: z.number().optional(),
    address: z.string().min(1, 'Address is required'),
    city: z.string().optional(),
    postalCode: z.string().optional(),
})

export const customerSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    phone: z.string().optional(),
    fax: z.string().optional(),
    npwp: z.string().optional(),
    addresses: z.array(customerAddressSchema)
        .min(1, 'At least one address is required'),
})

export type CustomerFormValues = z.infer<typeof customerSchema>

// Item validation schema (frontend - uses strings)
export const itemSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    unit: z.string().min(1, 'Unit is required'),
    price: z.number()
        .min(0, 'Price cannot be negative'),
    stockQuantity: z.number()
        .int('Stock quantity must be a whole number')
        .min(0, 'Stock quantity cannot be negative'),
})

export type ItemFormValues = z.infer<typeof itemSchema>

// Invoice detail validation schema
export const invoiceDetailSchema = z.object({
    itemId: z.number().min(1, 'Item is required'),
    quantity: z.number()
        .min(1, 'Quantity must be at least 1')
        .int('Quantity must be a whole number'),
    price: z.number()
        .min(0, 'Price cannot be negative'),
    unit: z.string().min(1, 'Unit is required'),
    subtotal: z.number().min(0, 'Subtotal cannot be negative'),
})

// Invoice validation schema
export const invoiceSchema = z.object({
    invoiceNumber: z.string()
        .min(1, 'Invoice number is required')
        .regex(/^\d{3}\/(I|II|III|IV|V|VI|VII|VIII|IX|X|XI|XII)\/\d{4}$/, 'Format must be XXX/ROMAN/YYYY (e.g., 031/XII/2023)'),
    customerId: z.string().min(1, 'Customer is required'),
    date: z.string().min(1, 'Date is required'),
    poNumber: z.string().optional(),
    deliveryNoteAddressId: z.string().min(1, 'Delivery note address is required'),
    invoiceAddressId: z.string().min(1, 'Invoice address is required'),
    invoiceDetails: z.array(invoiceDetailSchema)
        .min(1, 'At least one item is required'),
})

export type InvoiceFormValues = z.infer<typeof invoiceSchema>

// ============================================
// BACKEND VALIDATION SCHEMAS (for API routes)
// ============================================

// Backend customer validation schema (same as frontend)
export const customerBackendSchema = customerSchema

// Backend item validation schema (uses numbers instead of strings)
export const itemBackendSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    unit: z.string().min(1, 'Unit is required'),
    price: z.number()
        .min(0, 'Price cannot be negative'),
    stockQuantity: z.number()
        .int('Stock quantity must be a whole number')
        .min(0, 'Stock quantity cannot be negative'),
})

// Backend invoice detail validation schema
export const invoiceDetailBackendSchema = z.object({
    itemId: z.number().min(1, 'Item is required'),
    quantity: z.number()
        .min(1, 'Quantity must be at least 1')
        .int('Quantity must be a whole number'),
    price: z.number()
        .min(0, 'Price cannot be negative'),
    unit: z.string().min(1, 'Unit is required'),
    subtotal: z.number().min(0, 'Subtotal cannot be negative'),
})

// Backend invoice validation schema (uses numbers and Date)
export const invoiceBackendSchema = z.object({
    invoiceNumber: z.string()
        .min(1, 'Invoice number is required')
        .regex(/^\d{3}\/(I|II|III|IV|V|VI|VII|VIII|IX|X|XI|XII)\/\d{4}$/, 'Format must be XXX/ROMAN/YYYY (e.g., 031/XII/2023)'),
    customerId: z.number().min(1, 'Customer ID is required'),
    date: z.string().min(1, 'Date is required'),
    poNumber: z.string().optional(),
    deliveryNoteAddressId: z.number().min(1, 'Delivery Note Address ID is required'),
    invoiceAddressId: z.number().min(1, 'Invoice Address ID is required'),
    subtotal: z.number().min(0, 'Subtotal cannot be negative'),
    dpp: z.number().min(0, 'DPP cannot be negative'),
    dppRateNumerator: z.number().int(),
    dppRateDenominator: z.number().int(),
    taxRateNumerator: z.number().int(),
    taxRateDenominator: z.number().int(),
    ppn: z.number().min(0, 'PPN cannot be negative'),
    total: z.number().min(0, 'Total cannot be negative'),
    invoiceDetails: z.array(invoiceDetailBackendSchema)
        .min(1, 'At least one item is required'),
})

