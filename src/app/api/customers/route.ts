import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { customerBackendSchema } from '@/lib/validations'
import { z } from 'zod'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search')

  try {
    const where = search
      ? {
        OR: [
          { name: { contains: search } },
          { phone: { contains: search } },
        ],
      }
      : {}

    const customers = await prisma.customer.findMany({
      where,
      include: {
        addresses: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(customers)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request body
    const validatedData = customerBackendSchema.parse(body)

    const { addresses, ...customerData } = validatedData

    const customer = await prisma.customer.create({
      data: {
        ...customerData,
        addresses: {
          create: addresses || [],
        },
      },
      include: {
        addresses: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })
    return NextResponse.json(customer)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 })
  }
}
