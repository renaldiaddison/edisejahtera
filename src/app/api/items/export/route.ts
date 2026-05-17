import { prisma } from '@/lib/prisma'
import { PT_NAME } from '@/lib/constants'
import ExcelJS from 'exceljs'
import { NextResponse } from 'next/server'

export async function GET() {
    try {
        const items = await prisma.item.findMany({
            orderBy: { createdAt: 'desc' },
        })

        const workbook = new ExcelJS.Workbook()
        const worksheet = workbook.addWorksheet('Items')

        worksheet.columns = [
            { header: 'Name', key: 'name', width: 30 },
            { header: 'Unit', key: 'unit', width: 10 },
            { header: 'Sell Price', key: 'sellPrice', width: 15 },
            { header: 'Buy Price', key: 'buyPrice', width: 15 },
            { header: 'Stock Quantity', key: 'stockQuantity', width: 15 },
        ]

        items.forEach((item) => {
            worksheet.addRow({
                name: item.name,
                unit: item.unit,
                sellPrice: item.sellPrice.toNumber(),
                buyPrice: item.buyPrice.toNumber(),
                stockQuantity: item.stockQuantity,
            })
        })

        // Style the header
        worksheet.getRow(1).font = { bold: true }

        const buffer = await workbook.xlsx.writeBuffer()

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="Items - ${PT_NAME}.xlsx"`,
            },
        })
    } catch (error) {
        console.error('Export failed:', error)
        return NextResponse.json({ error: 'Failed to export items' }, { status: 500 })
    }
}
