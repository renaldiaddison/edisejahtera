import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { convertDecimalStrings } from '@/lib/utils'
import { itemBackendSchema } from '@/lib/validations'
import { z } from 'zod'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search')

  try {
    const where = search
      ? {
        name: { contains: search },
      }
      : {}

    const items = await prisma.item.findMany({
      where,
      orderBy: { createdAt: 'desc' },
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
