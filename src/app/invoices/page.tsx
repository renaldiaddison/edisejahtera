'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent } from '@/components/ui/card'
import type { Invoice } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [search, setSearch] = useState('')

  const fetchInvoices = async () => {
    try {
      const res = await axios.get('/api/invoices', {
        params: { search },
      })
      setInvoices(res.data)
    } catch (error) {
      console.error('Failed to fetch invoices', error)
      toast.error('Failed to fetch invoices')
    }
  }

  useEffect(() => {
    fetchInvoices()
  }, [search])

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return
    try {
      await axios.delete(`/api/invoices/${id}`)
      fetchInvoices()
    } catch (error) {
      console.error('Failed to delete invoice', error)
      toast.error('Failed to delete invoice')
    }
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Invoices</h1>
        <Link href="/invoices/create">
          <Button>Create Invoice</Button>
        </Link>
      </div>

      <div className="flex items-center space-x-2">
        <Input
          placeholder="Search invoices..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice Number</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Total</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell>{invoice.invoiceNumber}</TableCell>
                  <TableCell>{invoice.customer?.name}</TableCell>
                  <TableCell>{new Date(invoice.date).toLocaleDateString()}</TableCell>
                  <TableCell>{formatCurrency(invoice.totalAmount)}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <a href={`/api/invoices/${invoice.id}/goods-received-note`} target="_blank" rel="noopener noreferrer">
                      <Button variant="default" size="sm">Goods Received Note</Button>
                    </a>
                    <a href={`/api/invoices/${invoice.id}/delivery-note`} target="_blank" rel="noopener noreferrer">
                      <Button variant="default" size="sm">Delivery Note</Button>
                    </a>
                    <a href={`/api/invoices/${invoice.id}/invoice`} target="_blank" rel="noopener noreferrer">
                      <Button variant="default" size="sm">Invoice</Button>
                    </a>
                    <Link href={`/invoices/${invoice.id}`}>
                      <Button variant="outline" size="sm">Edit</Button>
                    </Link>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(invoice.id)}>Delete</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
