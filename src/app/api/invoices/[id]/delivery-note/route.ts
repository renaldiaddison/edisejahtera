import { PDF_AUTHOR, PDF_DEFAULT_FONT, PDF_TABLE_CONTENT_STYLE, PDF_TABLE_HEADER_STYLE } from '@/lib/constants'
import { pdfAddCustomerData, pdfAddDirectorSignatureFooter, pdfAddPTHeader } from '@/lib/pdf'
import { prisma } from '@/lib/prisma'
import { formatDate } from '@/lib/utils'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params
        const invoiceId = parseInt(id)

        const invoice = await prisma.invoice.findUnique({
            where: { id: invoiceId },
            include: {
                customer: true,
                invoiceDetails: {
                    include: {
                        item: true,
                    },
                },
                deliveryNoteBranch: true,
            },
        })

        if (!invoice) {
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
        }

        const { dayPadded, monthName, year } = formatDate(invoice.date)

        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
        })

        doc.setProperties({
            title: "Delivery Note " + invoice.invoiceNumber,
            subject: "Delivery Note Document",
            author: PDF_AUTHOR
        })

        const pageWidth = doc.internal.pageSize.getWidth()

        pdfAddPTHeader(doc, 7)

        const leftX = 10
        const topY = 30
        const labelWidth = 20

        const afterCustomerDataY = pdfAddCustomerData(doc, invoice.customer, invoice.deliveryNoteBranch, leftX, topY, labelWidth)

        const rightX = pageWidth / 2 + 25
        const rightLabelWidth = 20

        doc.text('Surat Jalan', rightX, topY)
        doc.text(':', rightX + rightLabelWidth, topY)

        doc.setFont(PDF_DEFAULT_FONT, 'bold')
        doc.text(invoice.invoiceNumber, rightX + rightLabelWidth + 2, topY)

        doc.setFont(PDF_DEFAULT_FONT, 'normal')
        const formattedDate = `${dayPadded} ${monthName} ${year}`

        doc.text('Tanggal', rightX, topY + 5)
        doc.text(':', rightX + rightLabelWidth, topY + 5)
        doc.text(formattedDate, rightX + rightLabelWidth + 2, topY + 5)

        doc.text('No. PO', rightX, topY + 10)
        doc.text(':', rightX + rightLabelWidth, topY + 10)
        doc.text(invoice.poNumber || '-', rightX + rightLabelWidth + 2, topY + 10)

        const tableStartY = Math.max(afterCustomerDataY, topY + 28) + 5

        const tableBody = invoice.invoiceDetails.map(detail => [
            detail.quantity.toString(),
            detail.unit,
            detail.item.name
        ])

        autoTable(doc, {
            startY: tableStartY,
            head: [['Qty', 'Unit', 'Description']],
            body: tableBody,
            theme: 'plain',
            margin: { left: 10, right: 10 },
            tableWidth: 'auto',
            styles: PDF_TABLE_CONTENT_STYLE,
            headStyles: PDF_TABLE_HEADER_STYLE,
            columnStyles: {
                0: { cellWidth: 20, halign: 'center', valign: 'middle' },
                1: { cellWidth: 25, halign: 'center', valign: 'middle' },
                2: { cellWidth: 'auto', valign: 'middle' }
            },
            didParseCell: (data) => {
                data.cell.styles.lineWidth = 0.3;
                data.cell.styles.lineColor = [0, 0, 0];
            }
        })

        const finalY = (doc as any).lastAutoTable.finalY + 6

        doc.setFontSize(12)
        doc.text('Penerima :', leftX, finalY)
        doc.text('(                               )', leftX, finalY + 25)

        pdfAddDirectorSignatureFooter(doc, pageWidth - 70, finalY, dayPadded, monthName, year)

        const pdfBuffer = doc.output('arraybuffer')

        return new NextResponse(pdfBuffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `inline; filename="delivery-note-${invoice.invoiceNumber}.pdf"`,
            },
        })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
    }
}
