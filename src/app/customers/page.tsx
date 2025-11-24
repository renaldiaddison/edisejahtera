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
import { Card, CardContent } from '@/components/ui/card'
import type { Customer, CustomerFormData } from '@/types'
import { customerSchema } from '@/lib/validations'
import { z } from 'zod'
import { toast } from 'sonner'
import { Plus, Trash } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [search, setSearch] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState<CustomerFormData>({
    name: '',
    phone: '',
    fax: '',
    npwp: '',
    addresses: [],
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
        phone: '',
        fax: '',
        npwp: '',
        addresses: [],
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
      phone: customer.phone || '',
      fax: customer.fax || '',
      npwp: customer.npwp || '',
      addresses: customer.addresses?.map(addr => ({
        id: addr.id,
        address: addr.address,
        city: addr.city || '',
        postalCode: addr.postalCode || '',
      })) || [],
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

  const addAddress = () => {
    setFormData({
      ...formData,
      addresses: [
        ...formData.addresses,
        { id: undefined, address: '', city: '', postalCode: '' }
      ]
    })
  }

  const removeAddress = (index: number) => {
    const newAddresses = [...formData.addresses]
    newAddresses.splice(index, 1)
    setFormData({ ...formData, addresses: newAddresses })
  }

  const updateAddress = (index: number, field: keyof typeof formData.addresses[0], value: string) => {
    const newAddresses = [...formData.addresses]
    newAddresses[index] = { ...newAddresses[index], [field]: value }
    setFormData({ ...formData, addresses: newAddresses })
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
                phone: '',
                fax: '',
                npwp: '',
                addresses: [],
              })
            }}>Add Customer</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Customer' : 'Add Customer'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4">
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
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Addresses <span className="text-red-500">*</span></h3>
                  <Button type="button" variant="outline" size="sm" onClick={addAddress}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Address
                  </Button>
                </div>

                {formData.addresses.map((address, index) => (
                  <Card key={index}>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium">Address {index + 1}</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => removeAddress(index)}
                        >
                          <Trash className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="grid gap-2">
                        <Label>Address <span className="text-red-500">*</span></Label>
                        <Textarea
                          value={address.address}
                          onChange={(e) => updateAddress(index, 'address', e.target.value)}
                          placeholder="Street address"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label>City</Label>
                          <Input
                            value={address.city}
                            onChange={(e) => updateAddress(index, 'city', e.target.value)}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Postal Code</Label>
                          <Input
                            value={address.postalCode}
                            onChange={(e) => updateAddress(index, 'postalCode', e.target.value)}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {formData.addresses.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground border-2 border-dashed rounded-lg">
                    No addresses added yet
                  </div>
                )}
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
                <TableHead>Phone</TableHead>
                <TableHead>NPWP</TableHead>
                <TableHead>Addresses</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>{customer.name}</TableCell>
                  <TableCell>{customer.phone}</TableCell>
                  <TableCell>{customer.npwp}</TableCell>
                  <TableCell>
                    {customer.addresses && customer.addresses.length > 0 ? (
                      <div className="max-w-[300px]">
                        <ul className="list-disc list-outside ml-4 space-y-1">
                          {customer.addresses.map((addr) => (
                            <li key={addr.id} className="text-sm break-words whitespace-pre-wrap">
                              {addr.address}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <span className="text-muted-foreground italic">No addresses</span>
                    )}
                  </TableCell>
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
