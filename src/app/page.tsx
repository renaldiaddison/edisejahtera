'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import { Download, Loader2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Invoice, Customer, Item } from '@/types'
import { formatCurrency, formatDateLocale } from '@/lib/utils'
import { toast } from 'sonner'

export default function Dashboard() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [topCustomers, setTopCustomers] = useState<{ name: string; totalRevenue: number }[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [isBackupLoading, setIsBackupLoading] = useState(false)
  const [isImportLoading, setIsImportLoading] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [invoicesRes, itemsRes, topCustomersRes] = await Promise.all([
        axios.get('/api/invoices', { params: { limit: 5 } }),
        axios.get('/api/items', { params: { stockStatus: 'out', all: true } }),
        axios.get('/api/customers/top', { params: { limit: 5 } }),
      ])
      setInvoices(invoicesRes.data.data)
      setItems(itemsRes.data.data)
      setTopCustomers(topCustomersRes.data.data)
    } catch (error) {
      console.error('Failed to fetch data:', error)
      toast.error('Failed to fetch data')
    }
  }

  const handleBackup = async () => {
    try {
      setIsBackupLoading(true)
      toast.loading('Creating backup...')

      // Fetch the backup file as a blob
      const response = await axios.get('/api/backup', {
        responseType: 'blob',
      })

      // Create a download link and trigger download
      const blob = new Blob([response.data], {
        type: 'application/zip',
      })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url

      // Extract filename from Content-Disposition header or use default
      const contentDisposition = response.headers['content-disposition']
      let filename = 'edi-sejahtera-backup.zip'
      if (contentDisposition) {
        // Match filename with or without quotes, and remove any trailing quotes
        const filenameMatch = contentDisposition.match(/filename="([^"]+)"|filename=([^;\s]+)/)
        if (filenameMatch) {
          filename = filenameMatch[1] || filenameMatch[2]
        }
      }

      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()

      // Cleanup
      link.remove()
      window.URL.revokeObjectURL(url)

      toast.dismiss()
      toast.success('Backup downloaded successfully')
    } catch (error) {
      toast.dismiss()
      console.error('Backup failed:', error)
      toast.error('Failed to create backup')
    } finally {
      setIsBackupLoading(false)
    }
  }

  const handleImport = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.zip'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      try {
        setIsImportLoading(true)
        toast.loading('Importing data...')

        const formData = new FormData()
        formData.append('file', file)

        await axios.post('/api/import', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })

        toast.dismiss()
        toast.success('Data imported successfully')
        fetchData() // Refresh the data
      } catch (error) {
        toast.dismiss()
        console.error('Import failed:', error)
        toast.error('Failed to import data')
      } finally {
        setIsImportLoading(false)
      }
    }
    input.click()
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Edi Sejahtera Dashboard</h1>
        <div className='flex gap-2'>
          <Button onClick={handleImport} disabled={isImportLoading}>
            {isImportLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            Import Data
          </Button>
          <Button onClick={handleBackup} disabled={isBackupLoading}>
            {isBackupLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Backup Data
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice Number</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>{invoice.invoiceNumber}</TableCell>
                    <TableCell>{invoice.customer?.name}</TableCell>
                    <TableCell>{formatDateLocale(invoice.date)}</TableCell>
                    <TableCell>{formatCurrency(invoice.total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Customers by Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Total Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topCustomers.map((customer, index) => (
                  <TableRow key={index}>
                    <TableCell>{customer.name}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(customer.totalRevenue)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Out of Stock Items</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id} className={item.stockQuantity === 0 ? 'bg-red-50' : ''}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {item.name}
                        {item.stockQuantity === 0 && (
                          <span className="px-2 py-0.5 text-xs font-semibold text-white bg-red-500 rounded">
                            OUT OF STOCK
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell>{formatCurrency(item.price)}</TableCell>
                    <TableCell>{item.stockQuantity}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
