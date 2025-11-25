import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { convertDecimalStrings } from '@/lib/utils'
import { invoiceBackendSchema } from '@/lib/validations'
import { z } from 'zod'

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
      await tx.invoice.update({
        where: { id: parsedId },
        data: invoiceData,
      })

      // Update Stock for all items
      for (const itemId of allItemIds) {
        const oldQty = existingQuantities.get(itemId) || 0
        const newQty = newQuantities.get(itemId) || 0
        const diff = newQty - oldQty

        if (diff !== 0) {
          await tx.item.update({
            where: { id: itemId },
            data: {
              stockQuantity: {
                decrement: diff, // decrement by positive diff (removes stock), or negative diff (adds stock)
              },
            },
          })
        }
      }

      if (invoiceDetails) {
        // Delete all existing details for this invoice
        await tx.invoiceDetail.deleteMany({
          where: { invoiceId: parsedId },
        })

        // Create new details
        for (const detail of invoiceDetails) {
          await tx.invoiceDetail.create({
            data: {
              invoiceId: parsedId,
              itemId: detail.itemId,
              quantity: detail.quantity,
              price: detail.price,
              unit: detail.unit,
              subtotal: detail.subtotal,
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
    await prisma.invoice.delete({
      where: { id: parsedId },
    })
    return NextResponse.json({ message: 'Invoice deleted' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete invoice' }, { status: 500 })
  }
}
