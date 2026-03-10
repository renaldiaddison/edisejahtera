import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    try {
        const totalCountResult = await prisma.invoice.groupBy({
            by: ['customerId'],
        })
        const totalCount = totalCountResult.length

        const topCustomersRaw = await prisma.invoice.groupBy({
            by: ['customerId'],
            _sum: {
                total: true,
            },
            orderBy: {
                _sum: {
                    total: 'desc',
                },
            },
            skip: (page - 1) * limit,
            take: limit,
        })

        const topCustomers = await Promise.all(
            topCustomersRaw.map(async (item) => {
                const customer = await prisma.customer.findUnique({
                    where: { id: item.customerId },
                    select: { name: true },
                })
                return {
                    id: item.customerId,
                    name: customer?.name || 'Unknown',
                    totalRevenue: item._sum.total ? Number(item._sum.total) : 0,
                }
            })
        )

        return NextResponse.json({
            data: topCustomers,
            metadata: {
                total: totalCount,
                page,
                limit,
                totalPages: Math.ceil(totalCount / limit)
            }
        })
    } catch (error) {
        console.error('Failed to fetch top customers:', error)
        return NextResponse.json({ error: 'Failed to fetch top customers' }, { status: 500 })
    }
}
