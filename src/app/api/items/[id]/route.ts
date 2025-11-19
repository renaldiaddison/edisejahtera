import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { convertDecimalStrings } from '@/lib/utils'
import { itemBackendSchema } from '@/lib/validations'
import { z } from 'zod'

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const parsedId = parseInt(id)
    const body = await request.json()

    // Validate request body
    const validatedData = itemBackendSchema.parse(body)

    const item = await prisma.item.update({
      where: { id: parsedId },
      data: validatedData,
    })
    return NextResponse.json(convertDecimalStrings(item))
  } catch (error) {
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
