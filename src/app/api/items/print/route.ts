import { PDF_AUTHOR, PDF_TABLE_CONTENT_STYLE, PDF_TABLE_HEADER_STYLE, PT_NAME } from '@/lib/constants'
import { pdfAddCustomFont, pdfAddPTHeader } from '@/lib/pdf'
import { prisma } from '@/lib/prisma'
import { formatCurrency } from '@/lib/utils'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { NextRequest, NextResponse } from 'next/server'

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

        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
        })

        pdfAddCustomFont(doc)

        doc.setProperties({
            title: `Item List - ${PT_NAME}`,
            subject: `Item List Document - ${PT_NAME}`,
            author: PDF_AUTHOR
        })

        const pageWidth = doc.internal.pageSize.getWidth()

        pdfAddPTHeader(doc, 7)

        const topY = 25
        const tableStartY = topY + 3

        const tableBody = items.map(item => [
            item.name,
            item.unit,
            formatCurrency(item.price.toNumber()),
            item.stockQuantity,
            formatCurrency(item.stockQuantity * item.price.toNumber())
        ])

        autoTable(doc, {
            startY: tableStartY,
            head: [['Name', 'Unit', 'Price', 'Stock', 'Total']],
            body: tableBody,
            theme: 'plain',
            margin: { left: 10, right: 10 },
            tableWidth: 'auto',
            styles: PDF_TABLE_CONTENT_STYLE,
            headStyles: PDF_TABLE_HEADER_STYLE,
            tableLineWidth: 0.3,
            tableLineColor: [0, 0, 0],
            columnStyles: {
                0: { cellWidth: 50, valign: 'middle' }, // Name
                1: { cellWidth: 25, halign: 'center', valign: 'middle' }, // Unit
                2: { cellWidth: 45, valign: 'middle' }, // Price
                3: { cellWidth: 20, halign: "center", valign: 'middle' }, // Stock
                4: { cellWidth: 'auto', valign: 'middle' }, // Total
            },
        })

        const total = items.reduce((sum, item) => sum + item.stockQuantity * item.price.toNumber(), 0)

        const totalBody = [
            ['Total', formatCurrency(total)],
        ]

        autoTable(doc, {
            startY: (doc as any).lastAutoTable.finalY,
            body: totalBody,
            theme: 'plain',
            margin: { left: pageWidth - 80, right: 10 },
            tableWidth: 'auto',
            styles: PDF_TABLE_CONTENT_STYLE,
            columnStyles: {
                0: { cellWidth: 20, valign: 'middle', fontStyle: 'bold' }, // Total
                1: { cellWidth: 'auto', valign: 'middle', fontStyle: 'bold' }, // Total Subtotal
            },
            didParseCell: (data) => {
                data.cell.styles.lineWidth = 0.3;
                data.cell.styles.lineColor = [0, 0, 0];
            }
        })

        const pdfBuffer = doc.output('arraybuffer')

        return new NextResponse(pdfBuffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `inline; filename="Item List - ${PT_NAME}.pdf"`,
            },
        })
    } catch (error) {
        console.log(error)
        return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
    }
}
