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

    // Validate request body
    const validatedData = invoiceBackendSchema.parse(body)

    const { invoiceDetails, ...invoiceData } = validatedData

    // Validate stock quantities
    if (invoiceDetails) {
      for (const detail of invoiceDetails) {
        const item = await prisma.item.findUnique({
          where: { id: detail.itemId },
        })

        if (!item) {
          return NextResponse.json(
            { error: `Item with ID ${detail.itemId} not found` },
            { status: 400 }
          )
        }

        if (detail.quantity > item.stockQuantity) {
          return NextResponse.json(
            {
              error: `Insufficient stock for item "${item.name}". Available: ${item.stockQuantity}, Requested: ${detail.quantity}`
            },
            { status: 400 }
          )
        }
      }
    }

    // Transaction to update invoice and details
    const invoice = await prisma.$transaction(async (tx) => {
      // Update invoice basic info
      const updatedInvoice = await tx.invoice.update({
        where: { id: parsedId },
        data: invoiceData,
      })

      if (invoiceDetails) {
        // Delete existing details
        await tx.invoiceDetail.deleteMany({
          where: { invoiceId: parsedId },
        })

        // Create new details
        await tx.invoiceDetail.createMany({
          data: invoiceDetails.map((detail: any) => ({
            ...detail,
            invoiceId: parsedId,
          })),
        })
      }

      return updatedInvoice
    })

    return NextResponse.json(invoice)
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
