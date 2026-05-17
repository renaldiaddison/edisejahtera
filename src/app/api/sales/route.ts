import { PDF_AUTHOR, PDF_DEFAULT_FONT, PDF_TABLE_CONTENT_STYLE, PDF_TABLE_HEADER_STYLE, PT_NAME } from '@/lib/constants'
import { pdfAddCustomFont, pdfAddPTHeader } from '@/lib/pdf'
import { prisma } from '@/lib/prisma'
import { formatCurrency, formatDateLocale, monthToString } from '@/lib/utils'
import { salesReportBackendSchema } from '@/lib/validations'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)

        const validatedData = salesReportBackendSchema.parse({
            month: searchParams.get('month'),
            year: searchParams.get('year')
        })

        const month = validatedData['month']
        const year = validatedData['year']

        const where: any = {}

        if (year) {
            if (month) {
                const startDate = new Date(year, month - 1, 1)
                const endDate = new Date(year, month, 0, 23, 59, 59)
                where.date = { gte: startDate, lte: endDate }
            } else {
                const startDate = new Date(year, 0, 1)
                const endDate = new Date(year, 11, 31, 23, 59, 59)
                where.date = { gte: startDate, lte: endDate }
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

        const monthString = month ? monthToString(month) : ''
        const periodText = year ? (month ? `${monthString} ${year}` : `Tahun ${year}`) : 'Semua Waktu'

        doc.setProperties({
            title: `Sales Report - ${periodText} - ${PT_NAME}`,
            subject: `Sales Report Document - ${periodText} - ${PT_NAME}`,
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
        doc.text('Periode', leftX, topY + 5)
        doc.text(':', leftX + labelWidth, topY + 5)
        doc.text(periodText, leftX + labelWidth + 2, topY + 5)

        const tableStartY = topY + 8

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
        const total = totalSubtotal + totalPPN

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

        autoTable(doc, {
            startY: (doc as any).lastAutoTable.finalY,
            body: [[formatCurrency(total)]],
            theme: 'plain',
            margin: { left: pageWidth - 120, right: 10 },
            tableWidth: 'auto',
            styles: PDF_TABLE_CONTENT_STYLE,
            columnStyles: {
                0: { cellWidth: 'auto', valign: 'middle', halign: 'center', fontStyle: 'bold' }, // Total
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
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation failed', details: error.issues },
                { status: 400 }
            )
        }
        console.log(error)
        return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
    }
}
