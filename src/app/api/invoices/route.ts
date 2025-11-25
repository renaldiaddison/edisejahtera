import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { convertDecimalStrings } from '@/lib/utils'
import { invoiceBackendSchema } from '@/lib/validations'
import { z } from 'zod'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search')

  try {
    const where = search
      ? {
        OR: [
          { invoiceNumber: { contains: search } },
          { customer: { name: { contains: search } } },
        ],
      }
      : {}

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        customer: true,
        deliveryNoteBranch: true,
        invoiceBranch: true,
        invoiceDetails: {
          include: {
            item: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(convertDecimalStrings(invoices))
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request body
    const validatedData = invoiceBackendSchema.parse(body)

    const { invoiceDetails, ...invoiceData } = validatedData

    // Validate stock quantities
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

    // Use transaction to create invoice and update stock atomically
    const invoice = await prisma.$transaction(async (tx) => {
      // Create invoice
      const newInvoice = await tx.invoice.create({
        data: {
          ...invoiceData,
          invoiceDetails: {
            create: invoiceDetails,
          },
        },
        include: {
          invoiceDetails: true,
        },
      })

      // Reduce stock for each item
      for (const detail of invoiceDetails) {
        await tx.item.update({
          where: { id: detail.itemId },
          data: {
            stockQuantity: {
              decrement: detail.quantity,
            },
          },
        })
      }

      return newInvoice
    })

    return NextResponse.json(convertDecimalStrings(invoice))
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }
    console.error(error)
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 })
  }
}
