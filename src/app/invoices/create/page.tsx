'use client'

import InvoiceForm from '@/components/InvoiceForm'

export default function CreateInvoicePage() {
  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold">Create Invoice</h1>
      <InvoiceForm />
    </div>
  )
}
