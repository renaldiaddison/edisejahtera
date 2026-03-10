import { PDF_AUTHOR, PDF_DEFAULT_FONT, PDF_TABLE_CONTENT_STYLE, PDF_TABLE_HEADER_STYLE, PT_NAME } from '@/lib/constants'
import { pdfAddCustomFont, pdfAddPTHeader } from '@/lib/pdf'
import { prisma } from '@/lib/prisma'
import { formatCurrency, formatDateLocale, monthToString } from '@/lib/utils'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month')
    const year = searchParams.get('year')

    try {
        const where: any = {}

        if (month && year) {
            const startDate = new Date(parseInt(year), parseInt(month) - 1, 1)
            const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59)

            where.date = {
                gte: startDate,
                lte: endDate,
            }
        }

        const invoices = await prisma.invoice.findMany({
            where,
            orderBy: { createdAt: 'asc' },
        })

        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
        })

        pdfAddCustomFont(doc)

        const monthString = monthToString(parseInt(month!))

        doc.setProperties({
            title: `Sales Report - ${month && year ? `${monthString} ${year}` : 'All Time'} - ${PT_NAME}`,
            subject: `Sales Report Document - ${month && year ? `${monthString} ${year}` : 'All Time'} - ${PT_NAME}`,
            author: PDF_AUTHOR
        })

        const pageWidth = doc.internal.pageSize.getWidth()

        pdfAddPTHeader(doc, 7)

        const leftX = 10
        const topY = 30
        const labelWidth = 17

        doc.setFont(PDF_DEFAULT_FONT, 'bold')
        doc.text('Sales Report', leftX, topY)

        doc.setFont(PDF_DEFAULT_FONT, 'normal')
        doc.text('Bulan', leftX, topY + 5)
        doc.text(':', leftX + labelWidth, topY + 5)
        doc.text(monthString || '-', leftX + labelWidth + 2, topY + 5)

        doc.text('Tahun', leftX, topY + 10)
        doc.text(':', leftX + labelWidth, topY + 10)
        doc.text(year! || '-', leftX + labelWidth + 2, topY + 10)

        const tableStartY = topY + 13

        const tableBody = invoices.map(invoice => [
            invoice.invoiceNumber,
            formatDateLocale(invoice.date),
            formatCurrency(invoice.subtotal.toNumber()),
            formatCurrency(invoice.ppn.toNumber())
        ])

        autoTable(doc, {
            startY: tableStartY,
            head: [['Invoice Number', 'Date', 'Subtotal', 'PPN']],
            body: tableBody,
            theme: 'plain',
            margin: { left: 10, right: 10 },
            tableWidth: 'auto',
            styles: PDF_TABLE_CONTENT_STYLE,
            headStyles: PDF_TABLE_HEADER_STYLE,
            tableLineWidth: 0.3,
            tableLineColor: [0, 0, 0],
            columnStyles: {
                0: { cellWidth: 50, valign: 'middle' }, // Invoice Number
                1: { cellWidth: 30, halign: 'center', valign: 'middle' }, // Date
                2: { cellWidth: 55, valign: 'middle' }, // Subtotal
                3: { cellWidth: 'auto', valign: 'middle' }, // PPN
            },
        })

        const totalSubtotal = invoices.reduce((sum, invoice) => sum + invoice.subtotal.toNumber(), 0);
        const totalPPN = invoices.reduce((sum, invoice) => sum + invoice.ppn.toNumber(), 0);

        const totalBody = [
            ['Total', formatCurrency(totalSubtotal), formatCurrency(totalPPN)],
        ]

        autoTable(doc, {
            startY: (doc as any).lastAutoTable.finalY,
            body: totalBody,
            theme: 'plain',
            margin: { left: pageWidth - 150, right: 10 },
            tableWidth: 'auto',
            styles: PDF_TABLE_CONTENT_STYLE,
            columnStyles: {
                0: { cellWidth: 30, valign: 'middle', fontStyle: 'bold' }, // Total
                1: { cellWidth: 55, valign: 'middle', fontStyle: 'bold' }, // Total Subtotal
                2: { cellWidth: 'auto', valign: 'middle', fontStyle: 'bold' }, // Total PPN
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
                'Content-Disposition': `inline; filename="Sales Report - ${monthString} ${year} - ${PT_NAME}.pdf"`,
            },
        })
    } catch (error) {
        console.log(error)
        return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
    }
}
