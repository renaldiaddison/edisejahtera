'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCurrency, generateInvoiceNumber } from '@/lib/utils'
import type { Customer, Item, Invoice, InvoiceFormData, InvoiceDetailFormData, InvoicePayload } from '@/types'
import { invoiceSchema } from '@/lib/validations'
import { z } from 'zod'
import { toast } from 'sonner'

interface InvoiceFormProps {
  initialData?: Invoice
  isEditing?: boolean
}

export default function InvoiceForm({ initialData, isEditing }: InvoiceFormProps) {
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [formData, setFormData] = useState<InvoiceFormData>({
    invoiceNumber: isEditing ? '' : generateInvoiceNumber(),
    customerId: '',
    date: new Date().toISOString().split('T')[0],
    poNumber: '',
    invoiceDetails: [],
  })

  useEffect(() => {
    const fetchData = async () => {
      const [customersRes, itemsRes] = await Promise.all([
        axios.get('/api/customers'),
        axios.get('/api/items'),
      ])
      setCustomers(customersRes.data)
      setItems(itemsRes.data)
    }
    fetchData()

    if (initialData) {
      setFormData({
        invoiceNumber: initialData.invoiceNumber,
        customerId: initialData.customerId.toString(),
        date: new Date(initialData.date).toISOString().split('T')[0],
        poNumber: initialData.poNumber || '',
        invoiceDetails: initialData.invoiceDetails?.map((d) => ({
          itemId: d.itemId,
          quantity: d.quantity,
          price: d.price,
          unit: d.unit,
          subtotal: d.subtotal,
        })) || [],
      })
    }
  }, [initialData])

  const handleAddItem = () => {
    setFormData({
      ...formData,
      invoiceDetails: [
        ...formData.invoiceDetails,
        { itemId: 0, quantity: 1, price: 0, unit: '', subtotal: 0 },
      ],
    })
  }

  const handleRemoveItem = (index: number) => {
    const newDetails = [...formData.invoiceDetails]
    newDetails.splice(index, 1)
    setFormData({ ...formData, invoiceDetails: newDetails })
  }

  const handleItemChange = (index: number, field: keyof InvoiceDetailFormData, value: any) => {
    const newDetails = [...formData.invoiceDetails]
    const detail = { ...newDetails[index] }

    if (field === 'itemId') {
      const item = items.find((i) => i.id === parseInt(value))
      if (item) {
        detail.itemId = parseInt(value)
        detail.price = item.price
        detail.unit = item.unit
        detail.subtotal = item.price * detail.quantity
      }
    } else if (field === 'quantity') {
      const requestedQuantity = parseInt(value) || 0
      const item = items.find((i) => i.id === detail.itemId)

      if (item && requestedQuantity > item.stockQuantity) {
        toast.error(`Insufficient stock for "${item.name}". Available: ${item.stockQuantity}`)
        return
      }

      detail.quantity = requestedQuantity
      detail.subtotal = detail.price * detail.quantity
    } else if (field === 'price') {
      detail.price = parseFloat(value) || 0
      detail.subtotal = detail.price * detail.quantity
    } else if (field === 'unit') {
      detail.unit = value
    }

    newDetails[index] = detail
    setFormData({ ...formData, invoiceDetails: newDetails })
  }

  const calculateTotal = () => {
    let total: number = 0
    formData.invoiceDetails.forEach((item) => {
      total += item.subtotal || 0
    })
    return total
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      // Validate form data with Zod
      invoiceSchema.parse(formData)

      // Validate stock quantities before submitting
      for (const detail of formData.invoiceDetails) {
        const item = items.find((i) => i.id === detail.itemId)
        if (item && detail.quantity > item.stockQuantity) {
          toast.error(`Insufficient stock for "${item.name}". Available: ${item.stockQuantity}, Requested: ${detail.quantity}`)
          return
        }
      }

      const payload: InvoicePayload = {
        invoiceNumber: formData.invoiceNumber,
        customerId: parseInt(formData.customerId),
        date: new Date(formData.date),
        poNumber: formData.poNumber,
        totalAmount: calculateTotal(),
        invoiceDetails: formData.invoiceDetails.map((d) => ({
          itemId: d.itemId,
          quantity: d.quantity,
          price: d.price,
          unit: d.unit,
          subtotal: d.subtotal,
        })),
      }

      if (isEditing && initialData) {
        await axios.put(`/api/invoices/${initialData.id}`, payload)
        toast.success('Invoice updated successfully')
      } else {
        await axios.post('/api/invoices', payload)
        toast.success('Invoice created successfully')
      }
      router.push('/invoices')
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.issues.forEach((err) => {
          toast.error(err.message)
        })
      } else {
        console.error('Failed to save invoice', error)
        toast.error('Failed to save invoice')
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Invoice Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-6">
          <div className="grid gap-2">
            <Label htmlFor="invoiceNumber">
              Invoice Number <span className="text-red-500">*</span>
            </Label>
            <Input
              id="invoiceNumber"
              value={formData.invoiceNumber}
              onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="customer">
              Customer <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.customerId}
              onValueChange={(value) => setFormData({ ...formData, customerId: value })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select customer" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((c: any) => (
                  <SelectItem key={c.id} value={c.id.toString()}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="date">
              Date <span className="text-red-500">*</span>
            </Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="poNumber">PO Number</Label>
            <Input
              id="poNumber"
              value={formData.poNumber}
              onChange={(e) => setFormData({ ...formData, poNumber: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Items</CardTitle>
          <Button type="button" onClick={handleAddItem}>Add Item</Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Item</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Subtotal</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {formData.invoiceDetails.map((detail, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Select
                      value={detail.itemId.toString()}
                      onValueChange={(value) => handleItemChange(index, 'itemId', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select item" />
                      </SelectTrigger>
                      <SelectContent>
                        {(() => {
                          const availableItems = items.filter((i: Item) => {
                            const isSelected = formData.invoiceDetails.some(
                              (d: InvoiceDetailFormData) => d.itemId === i.id
                            )
                            const isCurrentRowItem = detail.itemId === i.id
                            return !isSelected || isCurrentRowItem
                          })

                          if (availableItems.length === 0) {
                            return <SelectItem value="empty" disabled>Empty</SelectItem>
                          }

                          return availableItems.map((i: any) => (
                            <SelectItem key={i.id} value={i.id.toString()}>
                              {i.name}
                            </SelectItem>
                          ))
                        })()}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="1"
                      value={detail.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={detail.unit}
                      onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      step="100"
                      value={detail.price}
                      onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    {formatCurrency(detail.subtotal)}
                  </TableCell>
                  <TableCell>
                    <Button type="button" variant="destructive" size="sm" onClick={() => handleRemoveItem(index)}>
                      Remove
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex justify-end mt-4">
            <div className="text-xl font-bold">
              Total: {formatCurrency(calculateTotal())}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit">Save Invoice</Button>
      </div>
    </form>
  )
}
