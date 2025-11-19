'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import InvoiceForm from '@/components/InvoiceForm'
import { useParams } from 'next/navigation'
import type { Invoice } from '@/types'
import { toast } from 'sonner'

export default function EditInvoicePage() {
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const params = useParams()

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const res = await axios.get(`/api/invoices/${params.id}`)
        setInvoice(res.data)
      } catch (error) {
        console.error('Failed to fetch invoice', error)
        toast.error('Failed to fetch invoice')
      }
    }
    fetchInvoice()
  }, [params.id])

  if (!invoice) {
    return <div className='flex items-center justify-center h-screen'>Loading...</div>
  }

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold">Edit Invoice</h1>
      <InvoiceForm initialData={invoice} isEditing />
    </div>
  )
}
