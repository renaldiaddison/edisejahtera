'use client'

import { useState, useEffect, use } from 'react'
import axios from 'axios'
import { ArrowLeft, ArrowUpRight, ArrowDownLeft, Package, DollarSign, Tag, Calendar, FileText, Search, Filter, Edit, Trash2, History } from 'lucide-react'
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
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { formatCurrency, formatDateLocale } from '@/lib/utils'
import Link from 'next/link'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import type { Item, ItemStockTransaction } from '@/types'
import { TransactionType } from '@/types'

interface ItemDetailPageProps {
    params: Promise<{ id: string }>
}

export default function ItemDetailPage({ params }: ItemDetailPageProps) {
    const { id } = use(params)
    const [item, setItem] = useState<(Item & { stockTransactions: (ItemStockTransaction & { invoice?: { invoiceNumber: string } })[] }) | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [type, setType] = useState('ALL')

    // Edit transaction state
    const [editingTx, setEditingTx] = useState<ItemStockTransaction | null>(null)
    const [editForm, setEditForm] = useState({
        quantity: 0,
        price: 0,
        type: TransactionType.IN,
        note: ''
    })
    const [isSaving, setIsSaving] = useState(false)

    const fetchItem = async () => {
        try {
            const res = await axios.get(`/api/items/${id}`, {
                params: { search, type }
            })
            setItem(res.data)
        } catch (error: any) {
            const msg = error.response?.data?.error || error.message
            toast.error(msg)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchItem()
    }, [id, search, type])

    const handleDelete = async (txId: number) => {
        if (!confirm('Are you sure you want to delete this transaction? This will revert the item stock.')) return
        try {
            await axios.delete(`/api/items/transactions/${txId}`)
            fetchItem()
            toast.success('Transaction deleted successfully')
        } catch (error: any) {
            const msg = error.response?.data?.error || error.message
            toast.error(msg)
        }
    }

    const handleEditClick = (tx: ItemStockTransaction) => {
        setEditingTx(tx)
        setEditForm({
            quantity: Number(tx.quantity),
            price: Number(tx.price),
            type: tx.type,
            note: tx.note || ''
        })
    }

    const handleUpdateTx = async () => {
        if (!editingTx) return
        setIsSaving(true)
        try {
            await axios.patch(`/api/items/transactions/${editingTx.id}`, editForm)
            setEditingTx(null)
            fetchItem()
            toast.success('Transaction updated successfully')
        } catch (error: any) {
            const msg = error.response?.data?.error || error.message
            toast.error(msg)
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        )
    }

    if (!item) {
        return (
            <div className="p-8 text-center">
                <h2 className="text-2xl font-bold">Item not found</h2>
                <Button asChild className="mt-4">
                    <Link href="/items">Back to Items</Link>
                </Button>
            </div>
        )
    }

    return (
        <div className="p-8 space-y-6 max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" asChild>
                        <Link href="/items">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{item.name}</h1>
                        <p className="text-muted-foreground">Product ID: {item.id}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Badge variant={item.stockQuantity > 0 ? "outline" : "destructive"} className="text-sm px-3 py-1">
                        {item.stockQuantity} {item.unit} available
                    </Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            Inventory Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{item.stockQuantity}</div>
                        <p className="text-xs text-muted-foreground">{item.unit}</p>
                        <div className="mt-4 pt-4 border-t border-blue-100 flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Total Value</span>
                            <span className="font-semibold">{formatCurrency(item.sellPrice * item.stockQuantity)}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            Selling Price
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{formatCurrency(item.sellPrice)}</div>
                        <p className="text-xs text-muted-foreground">Current price per {item.unit}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Tag className="h-4 w-4" />
                            Average Cost
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{formatCurrency(item.buyPrice)}</div>
                        <p className="text-xs text-muted-foreground">Average purchase price</p>
                        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Gross Profit Margin</span>
                            {(() => {
                                const margin = item.sellPrice > 0
                                    ? Math.round(((Number(item.sellPrice) - Number(item.buyPrice)) / Number(item.sellPrice)) * 100)
                                    : 0;
                                return (
                                    <span className={`font-semibold ${margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {margin}%
                                    </span>
                                );
                            })()}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <CardTitle className="flex items-center gap-2">
                            <History className="h-5 w-5 text-primary" />
                            Stock History
                        </CardTitle>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <div className="relative">
                                <Input
                                    placeholder="Search by note or invoice..."
                                    className="w-full sm:w-[250px]"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                            <Select value={type} onValueChange={setType}>
                                <SelectTrigger className="w-full sm:w-[130px]">
                                    <SelectValue placeholder="All types" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">All Types</SelectItem>
                                    <SelectItem value={TransactionType.IN}>Stock In</SelectItem>
                                    <SelectItem value={TransactionType.OUT}>Stock Out</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[200px]">Date</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead className="text-right">Quantity</TableHead>
                                <TableHead className="text-right">Price</TableHead>
                                <TableHead>Note / Reference</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {item.stockTransactions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        No transactions found for this item.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                item.stockTransactions.map((tx) => (
                                    <TableRow key={tx.id} className="group transition-colors">
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                                {formatDateLocale(tx.createdAt)}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {tx.type === TransactionType.IN ? (
                                                <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-none">
                                                    <ArrowUpRight className="h-3 w-3 mr-1" />
                                                    STOCK IN
                                                </Badge>
                                            ) : (
                                                <Badge className="bg-red-100 text-red-700 hover:bg-red-200 border-none">
                                                    <ArrowDownLeft className="h-3 w-3 mr-1" />
                                                    STOCK OUT
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className={`text-right font-bold ${tx.type === TransactionType.IN ? 'text-green-600' : 'text-red-600'}`}>
                                            {tx.type === TransactionType.IN ? '+' : '-'}{tx.quantity} {item.unit}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {formatCurrency(tx.price)}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 max-w-[300px]">
                                                {tx.invoiceId ? (
                                                    <Link
                                                        href={`/invoices/${tx.invoiceId}`}
                                                        className="flex items-center gap-1.5 text-blue-600 hover:underline font-medium"
                                                    >
                                                        <FileText className="h-3.5 w-3.5" />
                                                        Invoice #{tx.invoice?.invoiceNumber}
                                                    </Link>
                                                ) : (
                                                    <span className="text-sm">{tx.note || '-'}</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right space-x-2">
                                            {!tx.invoiceId ? (<>
                                                <Button variant="outline" size="sm" onClick={() => handleEditClick(tx)}>Edit</Button>
                                                <Button variant="destructive" size="sm" onClick={() => handleDelete(tx.id)}>Delete</Button>
                                            </>
                                            ) : (
                                                <></>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={!!editingTx} onOpenChange={(open) => !open && setEditingTx(null)}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Edit Stock Transaction</DialogTitle>
                    </DialogHeader>
                    {item && (
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="edit-type">Type</Label>
                                <Select
                                    value={editForm.type}
                                    onValueChange={(v) => setEditForm(prev => ({ ...prev, type: v as TransactionType }))}

                                >
                                    <SelectTrigger id="edit-type" className='w-full'>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={TransactionType.IN}>Stock In</SelectItem>
                                        <SelectItem value={TransactionType.OUT}>Stock Out</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-quantity">Quantity ({item.unit})</Label>
                                <Input
                                    id="edit-quantity"
                                    type="number"
                                    step="any"
                                    value={editForm.quantity}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-price">Price (per {item.unit})</Label>
                                <Input
                                    id="edit-price"
                                    type="number"
                                    step="any"
                                    value={editForm.price}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, price: Number(e.target.value) }))}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-note">Note / Reference</Label>
                                <Input
                                    id="edit-note"
                                    value={editForm.note}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, note: e.target.value }))}
                                />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingTx(null)}>Cancel</Button>
                        <Button onClick={handleUpdateTx} disabled={isSaving}>
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
