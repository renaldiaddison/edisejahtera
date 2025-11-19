'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Customer, CustomerFormData } from '@/types'
import { customerSchema } from '@/lib/validations'
import { z } from 'zod'
import { toast } from 'sonner'

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [search, setSearch] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState<CustomerFormData>({
    name: '',
    address: '',
    city: '',
    postalCode: '',
    phone: '',
    fax: '',
    npwp: '',
  })

  const fetchCustomers = async () => {
    try {
      const res = await axios.get('/api/customers', {
        params: { search },
      })
      setCustomers(res.data)
    } catch (error) {
      console.error('Failed to fetch customers', error)
      toast.error('Failed to fetch customers')
    }
  }

  useEffect(() => {
    fetchCustomers()
  }, [search])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // Validate form data with Zod
      customerSchema.parse(formData)
      
      if (editingId) {
        await axios.put(`/api/customers/${editingId}`, formData)
        toast.success('Customer updated successfully')
      } else {
        await axios.post('/api/customers', formData)
        toast.success('Customer created successfully')
      }
      setIsOpen(false)
      setEditingId(null)
      setFormData({
        name: '',
        address: '',
        city: '',
        postalCode: '',
        phone: '',
        fax: '',
        npwp: '',
      })
      fetchCustomers()
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.issues.forEach((err) => {
          toast.error(err.message)
        })
      } else {
        console.error('Failed to save customer', error)
        toast.error('Failed to save customer')
      }
    }
  }

  const handleEdit = (customer: Customer) => {
    setEditingId(customer.id)
    setFormData({
      name: customer.name,
      address: customer.address || '',
      city: customer.city || '',
      postalCode: customer.postalCode || '',
      phone: customer.phone || '',
      fax: customer.fax || '',
      npwp: customer.npwp || '',
    })
    setIsOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this customer?')) return
    try {
      await axios.delete(`/api/customers/${id}`)
      fetchCustomers()
    } catch (error) {
      console.error('Failed to delete customer', error)
      toast.error('Failed to delete customer')
    }
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Customers</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingId(null)
              setFormData({
                name: '',
                address: '',
                city: '',
                postalCode: '',
                phone: '',
                fax: '',
                npwp: '',
              })
            }}>Add Customer</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Customer' : 'Add Customer'}</DialogTitle>
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
              <div className="grid gap-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input
                    id="postalCode"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="fax">Fax</Label>
                  <Input
                    id="fax"
                    value={formData.fax}
                    onChange={(e) => setFormData({ ...formData, fax: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="npwp">NPWP</Label>
                <Input
                  id="npwp"
                  value={formData.npwp}
                  onChange={(e) => setFormData({ ...formData, npwp: e.target.value })}
                />
              </div>
              <Button type="submit" className="w-full">Save</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center space-x-2">
        <Input
          placeholder="Search customers..."
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
                <TableHead>Name</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>NPWP</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>{customer.name}</TableCell>
                  <TableCell>{customer.city}</TableCell>
                  <TableCell>{customer.phone}</TableCell>
                  <TableCell>{customer.npwp}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(customer)}>Edit</Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(customer.id)}>Delete</Button>
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
