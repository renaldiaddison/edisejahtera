import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { convertDecimalStrings } from '@/lib/utils'
import { itemBackendSchema } from '@/lib/validations'
import { z } from 'zod'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search')
  const stockStatus = searchParams.get('stockStatus')
  const sortBy = searchParams.get('sortBy') || 'createdAt'
  const sortOrder = searchParams.get('sortOrder') || 'desc'

  try {
    const where: any = {}

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { unit: { contains: search } },
      ]
    }

    if (stockStatus === 'low') {
      where.stockQuantity = { gt: 0, lt: 10 }
    } else if (stockStatus === 'out') {
      where.stockQuantity = 0
    }

    const items = await prisma.item.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
    })
    return NextResponse.json(convertDecimalStrings(items))
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request body
    const validatedData = itemBackendSchema.parse(body)

    const item = await prisma.item.create({
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
    return NextResponse.json({ error: 'Failed to create item' }, { status: 500 })
  }
}
