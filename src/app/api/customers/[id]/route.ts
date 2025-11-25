import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { customerBackendSchema } from '@/lib/validations'
import { z } from 'zod'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const parsedId = parseInt(id)

    const customer = await prisma.customer.findUnique({
      where: { id: parsedId },
      include: {
        branches: true,
      },
    })

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    return NextResponse.json(customer)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch customer' }, { status: 500 })
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
    const validatedData = customerBackendSchema.parse(body)
    const { branches, ...customerData } = validatedData

    // Transaction to update customer and branches
    await prisma.$transaction(async (tx) => {
      // Update customer basic info
      await tx.customer.update({
        where: { id: parsedId },
        data: customerData,
      })

      const existingBranches = await tx.customerBranch.findMany({
        where: { customerId: parsedId },
      })

      for (const branch of existingBranches) {
        if (branches.find(b => b.id === branch.id)) {
          continue
        }
        await tx.customerBranch.delete({
          where: { id: branch.id },
        })
      }

      for (const branch of branches) {
        if (branch.id) {
          await tx.customerBranch.update({
            where: { id: branch.id },
            data: branch,
          })
        } else {
          await tx.customerBranch.create({
            data: {
              ...branch,
              customerId: parsedId,
            },
          })
        }
      }
    })

    return NextResponse.json({ message: 'Customer updated' })
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
