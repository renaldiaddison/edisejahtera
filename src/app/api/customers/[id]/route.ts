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
        addresses: true,
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
    const { addresses, ...customerData } = validatedData

    // if (addresses) {
    //   for (const address of addresses) {
    //     const item = await prisma.customerAddress.findUnique({
    //       where: { id: address. },
    //     })

    //     if (!item) {
    //       return NextResponse.json(
    //         { error: `Item with ID ${detail.itemId} not found` },
    //         { status: 400 }
    //       )
    //     }

    //   }
    // }

    // Transaction to update customer and addresses
    await prisma.$transaction(async (tx) => {
      // Update customer basic info
      await tx.customer.update({
        where: { id: parsedId },
        data: customerData,
      })

      const existingAddresses = await tx.customerAddress.findMany({
        where: { customerId: parsedId },
      })

      for (const address of existingAddresses) {
        if (addresses.find(addr => addr.id === address.id)) {
          continue
        }
        await tx.customerAddress.delete({
          where: { id: address.id },
        })
      }

      for (const address of addresses) {
        if (address.id) {
          await tx.customerAddress.update({
            where: { id: address.id },
            data: address,
          })
        } else {
          await tx.customerAddress.create({
            data: {
              ...address,
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
