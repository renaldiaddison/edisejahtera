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
          {
            branches: {
              some:
              {
                address: { contains: search },
                phone: { contains: search },
              }
            }
          },
        ],
      }
      : {}

    const customers = await prisma.customer.findMany({
      where,
      include: {
        branches: {
          orderBy: { createdAt: 'asc' },
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

    const { branches, ...customerData } = validatedData

    const customer = await prisma.customer.create({
      data: {
        ...customerData,
        branches: {
          create: branches || [],
        },
      },
      include: {
        branches: {
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
