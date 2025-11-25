export interface CustomerBranch {
  id: number
  customerId: number
  address: string
  city?: string
  postalCode?: string
  phone?: string
  email?: string
  createdAt: Date
  updatedAt: Date
}

export interface CustomerBranchFormData {
  id?: number
  address: string
  city: string
  postalCode: string
  phone: string
  email: string
}

export interface Customer {
  id: number
  name: string
  npwp: string
  branches?: CustomerBranch[]
  createdAt: Date
  updatedAt: Date
}

export interface CustomerFormData {
  name: string
  npwp: string
  branches: CustomerBranchFormData[]
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
  dppRateNumerator: number
  dppRateDenominator: number
  taxRateNumerator: number
  taxRateDenominator: number
  ppn: number
  total: number
  deliveryNoteBranchId?: number
  invoiceBranchId?: number
  createdAt: Date
  updatedAt: Date
  customer?: Customer
  invoiceDetails?: InvoiceDetail[]
  deliveryNoteBranch?: CustomerBranch
  invoiceBranch?: CustomerBranch
}

export interface InvoiceFormData {
  invoiceNumber: string
  customerId: string
  date: string
  poNumber: string
  deliveryNoteBranchId: string
  invoiceBranchId: string
  invoiceDetails: InvoiceDetailFormData[]
}

export interface InvoicePayload {
  invoiceNumber: string
  customerId: number
  date: Date
  poNumber: string
  deliveryNoteBranchId: number
  invoiceBranchId: number
  subtotal: number
  dpp: number
  dppRateNumerator: number
  dppRateDenominator: number
  taxRateNumerator: number
  taxRateDenominator: number
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
