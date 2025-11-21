export interface Customer {
  id: number
  name: string
  address: string
  city: string
  postalCode?: string
  phone: string
  fax?: string
  npwp?: string
  createdAt: Date
  updatedAt: Date
}

export interface CustomerFormData {
  name: string
  address: string
  city: string
  postalCode: string
  phone: string
  fax: string
  npwp: string
}

export interface Item {
  id: number
  name: string
  unit: string
  price: number
  stockQuantity: number
  createdAt: Date
  updatedAt: Date
}

export interface ItemFormData {
  name: string
  unit: string
  price: number
  stockQuantity: number
}

export interface InvoiceDetail {
  id: number
  invoiceId: number
  itemId: number
  quantity: number
  price: number
  unit: string
  subtotal: number
  item?: Item
}

export interface InvoiceDetailFormData {
  itemId: number
  quantity: number
  price: number
  unit: string
  subtotal: number
}

export interface Invoice {
  id: number
  invoiceNumber: string
  customerId: number
  date: Date
  poNumber: string | null
  subtotal: number
  dpp: number
  taxRate: number
  ppn: number
  total: number
  createdAt: Date
  updatedAt: Date
  customer?: Customer
  invoiceDetails?: InvoiceDetail[]
}

export interface InvoiceFormData {
  invoiceNumber: string
  customerId: string
  date: string
  poNumber: string
  invoiceDetails: InvoiceDetailFormData[]
}

export interface InvoicePayload {
  invoiceNumber: string
  customerId: number
  date: Date
  poNumber: string
  subtotal: number
  dpp: number
  taxRate: number
  ppn: number
  total: number
  invoiceDetails: {
    itemId: number
    quantity: number
    price: number
    unit: string
    subtotal: number
  }[]
}
