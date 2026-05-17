import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { convertDecimalStrings } from '@/lib/utils'
import { invoiceBackendSchema } from '@/lib/validations'
import { z } from 'zod'
import { TransactionType } from '@/types'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const parsedId = parseInt(id)

    const invoice = await prisma.invoice.findUnique({
      where: { id: parsedId },
      include: {
        customer: true,
        deliveryNoteBranch: true,
        invoiceBranch: true,
        invoiceDetails: { include: { item: true } },
      },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    return NextResponse.json(convertDecimalStrings(invoice))
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch invoice' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const parsedId = parseInt(id)
    const body = await request.json()

    const validatedData = invoiceBackendSchema.parse(body)

    const { invoiceDetails, ...invoiceData } = validatedData

    // Fetch existing invoice to calculate stock differences
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id: parsedId },
      include: { invoiceDetails: true },
    })

    if (!existingInvoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Map existing quantities: itemId -> quantity
    const existingQuantities = new Map<number, number>()
    existingInvoice.invoiceDetails.forEach((d) => {
      existingQuantities.set(d.itemId, d.quantity)
    })

    // Map new quantities: itemId -> quantity
    const newQuantities = new Map<number, number>()
    if (invoiceDetails) {
      invoiceDetails.forEach((d) => {
        newQuantities.set(d.itemId, d.quantity)
      })
    }

    // Identify all unique item IDs involved
    const allItemIds = new Set([
      ...existingQuantities.keys(),
      ...newQuantities.keys(),
    ])

    // Validate stock availability for increases
    for (const itemId of allItemIds) {
      const oldQty = existingQuantities.get(itemId) || 0
      const newQty = newQuantities.get(itemId) || 0
      const diff = newQty - oldQty

      if (diff > 0) {
        const item = await prisma.item.findUnique({
          where: { id: itemId },
        })

        if (!item) {
          return NextResponse.json(
            { error: `Item with ID ${itemId} not found` },
            { status: 400 }
          )
        }

        if (item.stockQuantity < diff) {
          return NextResponse.json(
            {
              error: `Insufficient stock for item "${item.name}". Available: ${item.stockQuantity + oldQty}, Requested: ${newQty}`,
            },
            { status: 400 }
          )
        }
      }
    }

    // Transaction to update invoice, details, and stock
    await prisma.$transaction(async (tx) => {
      // Update Invoice Data
      const updatedInvoice = await tx.invoice.update({
        where: { id: parsedId },
        data: invoiceData,
      })

      // Update invoice details and stock transactions
      for (const itemId of allItemIds) {
        const oldQty = existingQuantities.get(itemId) || 0
        const newQty = newQuantities.get(itemId) || 0
        const oldDetail = existingInvoice.invoiceDetails.find((d) => d.itemId === itemId)
        const newDetail = invoiceDetails?.find((d) => d.itemId === itemId)
        const diff = newQty - oldQty

        // Update Stock for this item if quantity changed
        if (diff !== 0) {
          await tx.item.update({
            where: { id: itemId },
            data: {
              stockQuantity: {
                decrement: diff,
              },
            },
          })
        }

        if (!newDetail) {
          // Item was removed from invoice
          await tx.invoiceDetail.delete({
            where: {
              invoiceId_itemId: {
                invoiceId: parsedId,
                itemId: itemId,
              },
            },
          })
          // Remove corresponding stock transaction
          await tx.itemStockTransaction.deleteMany({
            where: {
              invoiceId: parsedId,
              itemId: itemId,
            },
          })
        } else if (!oldDetail) {
          // Item is newly added to invoice
          await tx.invoiceDetail.create({
            data: {
              invoiceId: parsedId,
              itemId: newDetail.itemId,
              quantity: newDetail.quantity,
              price: newDetail.price,
              unit: newDetail.unit,
              subtotal: newDetail.subtotal,
            },
          })
          // Record as stock OUT
          await tx.itemStockTransaction.create({
            data: {
              itemId: newDetail.itemId,
              invoiceId: parsedId,
              type: TransactionType.OUT,
              quantity: newDetail.quantity,
              price: newDetail.price,
              note: `Sales from Invoice #${updatedInvoice.invoiceNumber}`,
            },
          })
        } else {
          // Item exists in both, update if any detail changed
          await tx.invoiceDetail.update({
            where: {
              invoiceId_itemId: {
                invoiceId: parsedId,
                itemId: itemId,
              },
            },
            data: {
              quantity: newDetail.quantity,
              price: newDetail.price,
              unit: newDetail.unit,
              subtotal: newDetail.subtotal,
            },
          })
          // Update corresponding stock transaction
          await tx.itemStockTransaction.updateMany({
            where: {
              invoiceId: parsedId,
              itemId: itemId,
            },
            data: {
              quantity: newDetail.quantity,
              price: newDetail.price,
              note: `Sales from Invoice #${updatedInvoice.invoiceNumber}`,
            },
          })
        }
      }
    })
    return NextResponse.json({ message: 'Invoice updated' })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }
    console.error(error)
    return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 })
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
      const invoice = await tx.invoice.findUnique({
        where: { id: parsedId },
        include: { invoiceDetails: true },
      })

      if (!invoice) {
        throw new Error('Invoice not found')
      }

      // Restore stock for all items in the invoice
      for (const detail of invoice.invoiceDetails) {
        await tx.item.update({
          where: { id: detail.itemId },
          data: {
            stockQuantity: {
              increment: detail.quantity,
            },
          },
        })
      }

      // Delete the invoice (will cascade to details and transactions if onDelete: Cascade is set)
      // Since it's in a transaction, and we want to be safe if cascade isn't set yet:
      await tx.itemStockTransaction.deleteMany({
        where: { invoiceId: parsedId },
      })

      await tx.invoice.delete({
        where: { id: parsedId },
      })
    })

    return NextResponse.json({ message: 'Invoice deleted' })
  } catch (error) {
    console.error('Failed to delete invoice:', error)
    return NextResponse.json({ error: 'Failed to delete invoice' }, { status: 500 })
  }
}
