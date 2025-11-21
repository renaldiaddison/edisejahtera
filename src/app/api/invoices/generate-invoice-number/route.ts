import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
    const date = new Date()

    try {
        const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1)
        const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0)

        const invoices = await prisma.invoice.findMany({
            where: {
                date: {
                    gte: startOfMonth,
                    lte: endOfMonth,
                },
            },
            select: {
                invoiceNumber: true,
            },
        })

        let maxSequence = 0
        for (const invoice of invoices) {
            const parts = invoice.invoiceNumber.split('/')
            if (parts.length >= 1) {
                const sequence = parseInt(parts[0], 10)
                if (!isNaN(sequence) && sequence > maxSequence) {
                    maxSequence = sequence
                }
            }
        }

        const nextNumber = maxSequence + 1
        const paddedNumber = nextNumber.toString().padStart(3, '0')

        const months = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']
        const monthIndex = date.getMonth()
        const romanMonth = months[monthIndex]

        const year = date.getFullYear()

        const invoiceNumber = `${paddedNumber}/${romanMonth}/${year}`

        return NextResponse.json({ invoiceNumber })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to generate invoice number' }, { status: 500 })
    }
}