export interface CustomerAddress {
  id: number
  customerId: number
  address: string
  city?: string
  postalCode?: string
  createdAt: Date
  updatedAt: Date
}

export interface CustomerAddressFormData {
  id?: number
  address: string
  city: string
  postalCode: string
}

export interface Customer {
  id: number
  name: string
  phone: string
  fax?: string
  npwp?: string
  addresses?: CustomerAddress[]
  createdAt: Date
  updatedAt: Date
}

export interface CustomerFormData {
  name: string
  phone: string
  fax: string
  npwp: string
  addresses: CustomerAddressFormData[]
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
  deliveryNoteAddressId?: number
  invoiceAddressId?: number
  createdAt: Date
  updatedAt: Date
  customer?: Customer
  invoiceDetails?: InvoiceDetail[]
  deliveryNoteAddress?: CustomerAddress
  invoiceAddress?: CustomerAddress
}

export interface InvoiceFormData {
  invoiceNumber: string
  customerId: string
  date: string
  poNumber: string
  deliveryNoteAddressId: string
  invoiceAddressId: string
  invoiceDetails: InvoiceDetailFormData[]
}

export interface InvoicePayload {
  invoiceNumber: string
  customerId: number
  date: Date
  poNumber: string
  deliveryNoteAddressId: number
  invoiceAddressId: number
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
