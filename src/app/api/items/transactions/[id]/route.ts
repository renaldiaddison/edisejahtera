import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { updateItemAvgBuyPrice } from '@/lib/stock'
import { TransactionType } from '@/types'
import { stockTransactionBackendSchema } from '@/lib/validations'

const updateTransactionSchema = stockTransactionBackendSchema.omit({ itemId: true })

export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params
        const parsedId = parseInt(id)
        const body = await request.json()
        const validatedData = updateTransactionSchema.parse(body)

        const result = await prisma.$transaction(async (tx) => {
            const transaction = await tx.itemStockTransaction.findUnique({
                where: { id: parsedId },
            })

            if (!transaction) {
                throw new Error('TRANSACTION_NOT_FOUND')
            }

            const item = await tx.item.findUnique({
                where: { id: transaction.itemId }
            })

            if (!item) {
                throw new Error('ITEM_NOT_FOUND')
            }

            // Calculate net stock change
            // Revert old: if it was IN (+), we subtract. if OUT (-), we add.
            const revertDelta = transaction.type === TransactionType.IN ? -Number(transaction.quantity) : Number(transaction.quantity)
            // Apply new: if it will be IN (+), we add. if OUT (-), we subtract.
            const applyDelta = validatedData.type === TransactionType.IN ? validatedData.quantity : -validatedData.quantity
            const netDelta = revertDelta + applyDelta

            // Validation: Resulting stock cannot be negative
            if (item.stockQuantity + netDelta < 0) {
                throw new Error('INSUFFICIENT_STOCK')
            }

            // Update the item stock
            await tx.item.update({
                where: { id: transaction.itemId },
                data: { stockQuantity: { increment: netDelta } }
            })

            // Update the transaction
            const updatedTx = await tx.itemStockTransaction.update({
                where: { id: parsedId },
                data: {
                    quantity: validatedData.quantity,
                    price: validatedData.price,
                    note: validatedData.note,
                    type: validatedData.type,
                }
            })

            // Recalculate Average Buy Price if involved with 'IN'
            if (transaction.type === TransactionType.IN || validatedData.type === TransactionType.IN) {
                await updateItemAvgBuyPrice(tx, transaction.itemId)
            }

            return updatedTx
        })

        return NextResponse.json(result)
    } catch (error: any) {
        if (error.message === 'TRANSACTION_NOT_FOUND') {
            return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
        }
        if (error.message === 'ITEM_NOT_FOUND') {
            return NextResponse.json({ error: 'Item not found' }, { status: 404 })
        }
        if (error.message === 'INSUFFICIENT_STOCK') {
            return NextResponse.json({ error: 'Stock quantity cannot be negative after this change' }, { status: 400 })
        }
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 })
        }
        console.error('Failed to update transaction', error)
        return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 })
    }
}

export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params
        const parsedId = parseInt(id)

        await prisma.$transaction(async (tx) => {
            const transaction = await tx.itemStockTransaction.findUnique({
                where: { id: parsedId },
            })

            if (!transaction) {
                throw new Error('TRANSACTION_NOT_FOUND')
            }

            const item = await tx.item.findUnique({
                where: { id: transaction.itemId }
            })

            if (!item) {
                throw new Error('ITEM_NOT_FOUND')
            }

            // Revert stock
            const stockDelta = transaction.type === TransactionType.IN ? -Number(transaction.quantity) : Number(transaction.quantity)

            // Validation: Resulting stock cannot be negative
            if (item.stockQuantity + stockDelta < 0) {
                throw new Error('INSUFFICIENT_STOCK')
            }

            await tx.item.update({
                where: { id: transaction.itemId },
                data: { stockQuantity: { increment: stockDelta } }
            })

            // Delete transaction
            await tx.itemStockTransaction.delete({
                where: { id: parsedId }
            })

            // Recalculate Average Buy Price if it was an IN transaction
            if (transaction.type === TransactionType.IN) {
                await updateItemAvgBuyPrice(tx, transaction.itemId)
            }
        })

        return NextResponse.json({ message: 'Transaction deleted and stock reverted' })
    } catch (error: any) {
        if (error.message === 'TRANSACTION_NOT_FOUND') {
            return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
        }
        if (error.message === 'ITEM_NOT_FOUND') {
            return NextResponse.json({ error: 'Item not found' }, { status: 404 })
        }
        if (error.message === 'INSUFFICIENT_STOCK') {
            return NextResponse.json({ error: 'Stock quantity cannot be negative after this change' }, { status: 400 })
        }
        console.error('Failed to delete transaction', error)
        return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 })
    }
}
