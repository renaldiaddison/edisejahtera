import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { customerBackendSchema } from '@/lib/validations'
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
    const validatedData = customerBackendSchema.parse(body)

    const customer = await prisma.customer.update({
      where: { id: parsedId },
      data: validatedData,
    })
    return NextResponse.json(customer)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const parsedId = parseInt(id)
    await prisma.customer.delete({
      where: { id: parsedId },
    })
    return NextResponse.json({ message: 'Customer deleted' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete customer' }, { status: 500 })
  }
}
