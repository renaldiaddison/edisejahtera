'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import { Printer, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import type { Item, ItemFormData } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { itemSchema } from '@/lib/validations'
import { z } from 'zod'
import { toast } from 'sonner'

export default function ItemsPage() {
  const [items, setItems] = useState<Item[]>([])
  const [search, setSearch] = useState('')
  const [stockStatus, setStockStatus] = useState('all')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')
  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState<ItemFormData>({
    name: '',
    unit: '',
    price: 0,
    stockQuantity: 0,
  })

  const fetchItems = async () => {
    try {
      const res = await axios.get('/api/items', {
        params: {
          search,
          stockStatus: stockStatus === 'all' ? undefined : stockStatus,
          sortBy,
          sortOrder,
        },
      })
      setItems(res.data)
    } catch (error) {
      console.error('Failed to fetch items', error)
      toast.error('Failed to fetch items')
    }
  }

  useEffect(() => {
    fetchItems()
  }, [search, stockStatus, sortBy, sortOrder])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      // Validate form data with Zod
      itemSchema.parse(formData)

      const data = {
        ...formData,
        price: formData.price,
        stockQuantity: formData.stockQuantity,
      }

      if (editingId) {
        await axios.put(`/api/items/${editingId}`, data)
        toast.success('Item updated successfully')
      } else {
        await axios.post('/api/items', data)
        toast.success('Item created successfully')
      }
      setIsOpen(false)
      setEditingId(null)
      setFormData({
        name: '',
        unit: '',
        price: 0,
        stockQuantity: 0,
      })
      fetchItems()
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.issues.forEach((err) => {
          toast.error(err.message)
        })
      } else {
        console.error('Failed to save item', error)
        toast.error('Failed to save item')
      }
    }
  }

  const handleEdit = (item: Item) => {
    setEditingId(item.id)
    setFormData({
      name: item.name,
      unit: item.unit,
      price: item.price,
      stockQuantity: item.stockQuantity,
    })
    setIsOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this item?')) return
    try {
      await axios.delete(`/api/items/${id}`)
      fetchItems()
    } catch (error) {
      console.error('Failed to delete item', error)
      toast.error('Failed to delete item')
    }
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Items</h1>
        <div className='flex gap-2'>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingId(null)
                setFormData({
                  name: '',
                  unit: '',
                  price: 0,
                  stockQuantity: 0,
                })
              }}>Add Item</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingId ? 'Edit Item' : 'Add Item'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">
                    Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="unit">
                      Unit <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="unit"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="price">
                      Price <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="stockQuantity">
                      Stock <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="stockQuantity"
                      type="number"
                      min="0"
                      value={formData.stockQuantity}
                      onChange={(e) => setFormData({ ...formData, stockQuantity: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full">Save</Button>
              </form>
            </DialogContent>
          </Dialog>
          <a
            href={`/api/items/print?search=${search}&stockStatus=${stockStatus}&sortBy=${sortBy}&sortOrder=${sortOrder}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button>
              <Printer className="h-4 w-4" />
              Print Items
            </Button>
          </a>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-wrap items-center gap-2 w-full md:max-w-4xl">
          <Input
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
          <Select value={stockStatus} onValueChange={setStockStatus}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Stock Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stock</SelectItem>
              <SelectItem value="low">Low Stock</SelectItem>
              <SelectItem value="out">Out of Stock</SelectItem>
            </SelectContent>
          </Select>
          <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
            const [field, order] = value.split('-')
            setSortBy(field)
            setSortOrder(order)
          }}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt-desc">Newest First</SelectItem>
              <SelectItem value="name-asc">Name (A-Z)</SelectItem>
              <SelectItem value="name-desc">Name (Z-A)</SelectItem>
              <SelectItem value="price-asc">Price (Low to High)</SelectItem>
              <SelectItem value="price-desc">Price (High to Low)</SelectItem>
              <SelectItem value="stockQuantity-asc">Stock (Low to High)</SelectItem>
              <SelectItem value="stockQuantity-desc">Stock (High to Low)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {/* <div className="text-sm text-muted-foreground whitespace-nowrap">
          Showing {items.length} {items.length === 1 ? 'item' : 'items'}
        </div> */}
      </div>

      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Total</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id} className={item.stockQuantity === 0 ? 'bg-red-50' : ''}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {item.name}
                      {item.stockQuantity < 10 && item.stockQuantity > 0 && (
                        <span className="px-2 py-0.5 text-xs font-semibold text-white bg-orange-500 rounded">
                          LOW STOCK
                        </span>
                      )}
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
                  <TableCell>{formatCurrency(item.price * item.stockQuantity)}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(item)}>Edit</Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(item.id)}>Delete</Button>
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
