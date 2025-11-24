'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils'
import { TAX_RATE, DPP_RATE } from '@/lib/constants'
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
  const [customerComboboxOpen, setCustomerComboboxOpen] = useState(false)
  const [deliveryNoteAddressComboboxOpen, setDeliveryNoteAddressComboboxOpen] = useState(false)
  const [invoiceAddressComboboxOpen, setInvoiceAddressComboboxOpen] = useState(false)
  const [itemComboboxOpen, setItemComboboxOpen] = useState<{ [key: number]: boolean }>({})
  const [formData, setFormData] = useState<InvoiceFormData>({
    invoiceNumber: '',
    customerId: '',
    date: new Date().toISOString().split('T')[0],
    poNumber: '',
    deliveryNoteAddressId: '',
    invoiceAddressId: '',
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
        deliveryNoteAddressId: initialData.deliveryNoteAddressId?.toString() || '',
        invoiceAddressId: initialData.invoiceAddressId?.toString() || '',
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

  useEffect(() => {
    if (isEditing) return

    const fetchInvoiceNumber = async () => {
      try {
        const res = await axios.get(`/api/invoices/generate-invoice-number`)
        setFormData(prev => ({ ...prev, invoiceNumber: res.data.invoiceNumber }))
      } catch (error) {
        console.error('Failed to generate invoice number', error)
        toast.error('Failed to generate invoice number')
      }
    }

    fetchInvoiceNumber()
  }, [formData.date, isEditing])

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

  const calculateValues = () => {
    const subtotal = formData.invoiceDetails.reduce((acc, item) => acc + (item.subtotal || 0), 0)
    const dpp = Math.round(subtotal * DPP_RATE)
    const ppn = Math.round(dpp * TAX_RATE)
    const total = subtotal + ppn
    return { subtotal, dpp, ppn, total }
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

      const { subtotal, dpp, ppn, total } = calculateValues()

      const payload: InvoicePayload = {
        invoiceNumber: formData.invoiceNumber,
        customerId: parseInt(formData.customerId),
        date: new Date(formData.date),
        poNumber: formData.poNumber,
        deliveryNoteAddressId: parseInt(formData.deliveryNoteAddressId),
        invoiceAddressId: parseInt(formData.invoiceAddressId),
        subtotal,
        dpp,
        taxRate: TAX_RATE,
        ppn,
        total,
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
            <Popover open={customerComboboxOpen} onOpenChange={setCustomerComboboxOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={customerComboboxOpen}
                  className="w-full justify-between h-auto whitespace-normal text-left"
                >
                  {formData.customerId
                    ? customers.find((c) => c.id.toString() === formData.customerId)?.name
                    : "Select customer..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Search customer..." />
                  <CommandList>
                    <CommandEmpty>No customer found.</CommandEmpty>
                    <CommandGroup>
                      {customers.map((c: Customer) => (
                        <CommandItem
                          key={c.id}
                          value={c.name}
                          onSelect={() => {
                            setFormData({ ...formData, customerId: c.id.toString(), invoiceAddressId: '', deliveryNoteAddressId: '' })
                            setCustomerComboboxOpen(false)
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              formData.customerId === c.id.toString() ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {c.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
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
          <div className="grid gap-2">
            <Label htmlFor="deliveryNoteAddress">
              Delivery Note Address <span className="text-red-500">*</span>
            </Label>
            <Popover open={deliveryNoteAddressComboboxOpen} onOpenChange={setDeliveryNoteAddressComboboxOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={deliveryNoteAddressComboboxOpen}
                  className="w-full justify-between h-auto whitespace-normal text-left"
                >
                  {formData.deliveryNoteAddressId
                    ? customers.find(c => c.id.toString() === formData.customerId)?.addresses?.find(a => a.id.toString() === formData.deliveryNoteAddressId)?.address
                    : "Select address..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0">
                <Command>
                  <CommandInput placeholder="Search address..." />
                  <CommandList>
                    <CommandEmpty>No address found.</CommandEmpty>
                    <CommandGroup>
                      {customers.find(c => c.id.toString() === formData.customerId)?.addresses?.map((address) => (
                        <CommandItem
                          key={address.id}
                          value={address.address}
                          onSelect={() => {
                            setFormData({ ...formData, deliveryNoteAddressId: address.id.toString() })
                            setDeliveryNoteAddressComboboxOpen(false)
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              formData.deliveryNoteAddressId === address.id.toString() ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {address.address}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="invoiceAddress">
              Invoice Address <span className="text-red-500">*</span>
            </Label>
            <Popover open={invoiceAddressComboboxOpen} onOpenChange={setInvoiceAddressComboboxOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={invoiceAddressComboboxOpen}
                  className="w-full justify-between h-auto whitespace-normal text-left"
                >
                  {formData.invoiceAddressId
                    ? customers.find(c => c.id.toString() === formData.customerId)?.addresses?.find(a => a.id.toString() === formData.invoiceAddressId)?.address
                    : "Select address..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0">
                <Command>
                  <CommandInput placeholder="Search address..." />
                  <CommandList>
                    <CommandEmpty>No address found.</CommandEmpty>
                    <CommandGroup>
                      {customers.find(c => c.id.toString() === formData.customerId)?.addresses?.map((address) => (
                        <CommandItem
                          key={address.id}
                          value={address.address}
                          onSelect={() => {
                            setFormData({ ...formData, invoiceAddressId: address.id.toString() })
                            setInvoiceAddressComboboxOpen(false)
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              formData.invoiceAddressId === address.id.toString() ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {address.address}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
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
                    {(() => {
                      const availableItems = items.filter((i: Item) => {
                        const isSelected = formData.invoiceDetails.some(
                          (d: InvoiceDetailFormData) => d.itemId === i.id
                        )
                        const isCurrentRowItem = detail.itemId === i.id
                        return !isSelected || isCurrentRowItem
                      })

                      return (
                        <Popover
                          open={itemComboboxOpen[index] || false}
                          onOpenChange={(open) => setItemComboboxOpen({ ...itemComboboxOpen, [index]: open })}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={itemComboboxOpen[index] || false}
                              className="w-full justify-between"
                            >
                              {detail.itemId
                                ? items.find((i) => i.id === detail.itemId)?.name
                                : "Select item..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0">
                            <Command>
                              <CommandInput placeholder="Search item..." />
                              <CommandList>
                                <CommandEmpty>
                                  {availableItems.length === 0 ? "No available items." : "No item found."}
                                </CommandEmpty>
                                <CommandGroup>
                                  {availableItems.map((i: Item) => (
                                    <CommandItem
                                      key={i.id}
                                      value={i.name}
                                      onSelect={() => {
                                        handleItemChange(index, 'itemId', i.id.toString())
                                        setItemComboboxOpen({ ...itemComboboxOpen, [index]: false })
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          detail.itemId === i.id ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      {i.name}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      )
                    })()}
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
            <div className="w-1/3 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>{formatCurrency(calculateValues().subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>DPP:</span>
                <span>{formatCurrency(calculateValues().dpp)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>PPN ({(TAX_RATE * 100).toFixed(0)}%):</span>
                <span>{formatCurrency(calculateValues().ppn)}</span>
              </div>
              <div className="flex justify-between text-xl font-bold border-t pt-2">
                <span>Total:</span>
                <span>{formatCurrency(calculateValues().total)}</span>
              </div>
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
