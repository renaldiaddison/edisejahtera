import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { convertDecimalStrings } from '@/lib/utils'
import { itemBackendSchema } from '@/lib/validations'
import { z } from 'zod'
import { updateItemAvgBuyPrice } from '@/lib/stock'
import { TransactionType } from '@/types'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const parsedId = parseInt(id)
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const search = searchParams.get('search')

    const item = await prisma.item.findUnique({
      where: { id: parsedId },
      include: {
        stockTransactions: {
          where: {
            AND: [
              type && type !== 'ALL' ? { type: type as any } : {},
              search ? {
                OR: [
                  { note: { contains: search } },
                  { invoice: { invoiceNumber: { contains: search } } }
                ]
              } : {}
            ]
          },
          orderBy: { createdAt: 'desc' },
          include: {
            invoice: true,
          }
        }
      }
    })

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    return NextResponse.json(convertDecimalStrings(item))
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch item' }, { status: 500 })
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
    const { transactionNote, transactionPrice, ...validatedData } = itemBackendSchema.parse(body)

    const item = await prisma.$transaction(async (tx) => {
      const currentItem = await tx.item.findUnique({
        where: { id: parsedId },
      })

      if (!currentItem) {
        throw new Error('ITEM_NOT_FOUND')
      }

      const updatedItem = await tx.item.update({
        where: { id: parsedId },
        data: validatedData,
      })

      const diff = updatedItem.stockQuantity - currentItem.stockQuantity
      if (diff !== 0) {
        const type = diff > 0 ? TransactionType.IN : TransactionType.OUT
        const quantity = Math.abs(diff)
        const tPrice = transactionPrice || 0

        await tx.itemStockTransaction.create({
          data: {
            itemId: updatedItem.id,
            type,
            quantity,
            price: tPrice,
            note: transactionNote || 'Manual stock adjustment',
          },
        })

        if (type === TransactionType.IN) {
          await updateItemAvgBuyPrice(tx, parsedId)
        }
      }

      return updatedItem
    })
    return NextResponse.json(convertDecimalStrings(item))
  } catch (error: any) {
    if (error.message === 'ITEM_NOT_FOUND') {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const parsedId = parseInt(id)
    await prisma.item.delete({
      where: { id: parsedId },
    })
    return NextResponse.json({ message: 'Item deleted' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 })
  }
}
