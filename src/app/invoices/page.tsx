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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RotateCcw } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import type { Invoice } from '@/types'
import { formatCurrency, formatDateLocale } from '@/lib/utils'
import { toast } from 'sonner'

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [search, setSearch] = useState('')
  const [month, setMonth] = useState<string>('')
  const [year, setYear] = useState<string>('')

  const months = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ]

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 20 }, (_, i) => (currentYear - i).toString())

  const fetchInvoices = async () => {
    try {
      const res = await axios.get('/api/invoices', {
        params: {
          search,
          month,
          year
        },
      })
      setInvoices(res.data)
    } catch (error) {
      console.error('Failed to fetch invoices', error)
      toast.error('Failed to fetch invoices')
    }
  }

  useEffect(() => {
    fetchInvoices()
  }, [search, month, year])

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

      <div className="flex flex-col md:flex-row items-center gap-4">
        <Input
          placeholder="Search invoices..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select value={month} onValueChange={setMonth}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Month" />
          </SelectTrigger>
          <SelectContent>
            {months.map((m) => (
              <SelectItem key={m.value} value={m.value}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={year} onValueChange={setYear}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent>
            {years.map((y) => (
              <SelectItem key={y} value={y}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(month || year || search) && (
          <Button
            variant="ghost"
            onClick={() => {
              setSearch('')
              setMonth('')
              setYear('')
            }}
            className="h-9 px-2 lg:px-3"
          >
            Reset
            <RotateCcw className="h-4 w-4" />
          </Button>
        )}
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
                  <TableCell>{formatDateLocale(invoice.date)}</TableCell>
                  <TableCell>{formatCurrency(invoice.total)}</TableCell>
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
