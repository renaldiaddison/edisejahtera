import { PDF_AUTHOR, PDF_DEFAULT_FONT, PDF_TABLE_CONTENT_STYLE, PDF_TABLE_HEADER_STYLE, PT_BANK, PT_BANK_ACCOUNT, PT_NAME } from '@/lib/constants'
import { pdfAddCustomerData, pdfAddDirectorSignatureFooter, pdfAddPTHeader } from '@/lib/pdf'
import { prisma } from '@/lib/prisma'
import { decimalToPercentString, decimalToPercentString2, formatCurrency, formatDate } from '@/lib/utils'
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
                invoiceBranch: true,
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
            title: "Invoice " + invoice.invoiceNumber,
            subject: "Invoice Document",
            author: PDF_AUTHOR
        })

        const pageWidth = doc.internal.pageSize.getWidth()

        pdfAddPTHeader(doc, 7)

        const leftX = 10
        const topY = 30
        const labelWidth = 20

        const afterCustomerDataY = pdfAddCustomerData(doc, invoice.customer, invoice.invoiceBranch, leftX, topY, labelWidth)

        const rightX = pageWidth / 2 + 25
        const rightLabelWidth = 20

        doc.text('Invoice', rightX, topY)
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

        doc.text('No. SJ', rightX, topY + 15)
        doc.text(':', rightX + rightLabelWidth, topY + 15)
        doc.text(invoice.invoiceNumber, rightX + rightLabelWidth + 2, topY + 15)

        const tableStartY = Math.max(afterCustomerDataY, topY + 28) + 5

        const tableBody = invoice.invoiceDetails.map(detail => [
            detail.quantity.toString(),
            detail.unit,
            detail.item.name,
            formatCurrency(detail.price.toNumber()),
            formatCurrency(detail.subtotal.toNumber())
        ])

        autoTable(doc, {
            startY: tableStartY,
            head: [['Qty', 'Unit', 'Description', 'Unit Price', 'TOTAL']],
            body: tableBody,
            theme: 'plain',
            margin: { left: 10, right: 10 },
            tableWidth: 'auto',
            styles: PDF_TABLE_CONTENT_STYLE,
            headStyles: PDF_TABLE_HEADER_STYLE,
            columnStyles: {
                0: { cellWidth: 20, halign: 'center', valign: 'middle' }, // Qty
                1: { cellWidth: 25, halign: 'center', valign: 'middle' }, // Unit
                2: { cellWidth: 60, valign: 'middle' }, // Description
                3: { cellWidth: 40, halign: "left", valign: 'middle' }, // Price
                4: { cellWidth: 'auto', halign: "right", valign: 'middle' }, // Total
            },
            didParseCell: (data) => {
                data.cell.styles.lineWidth = 0.3;
                data.cell.styles.lineColor = [0, 0, 0];
            }
        })

        const subTotalBody = [
            ['Sub Total', formatCurrency(invoice.subtotal.toNumber())],
        ]

        const taxBody = [
            [`DPP (${invoice.dppRateNumerator}/${invoice.dppRateDenominator})`,
            formatCurrency(invoice.dpp.toNumber()), `PPN ${decimalToPercentString2(invoice.taxRateNumerator, invoice.taxRateDenominator, 0)}`, formatCurrency(invoice.ppn.toNumber())],
        ]

        const totalBody = [
            ['Total', formatCurrency(invoice.total.toNumber())]
        ]

        autoTable(doc, {
            startY: (doc as any).lastAutoTable.finalY,
            body: subTotalBody,
            theme: 'plain',
            margin: { left: pageWidth - 95, right: 10 },
            tableWidth: 'auto',
            showHead: 'never',
            styles: PDF_TABLE_CONTENT_STYLE,
            columnStyles: {
                0: { cellWidth: 40, halign: 'left', valign: 'middle', fontStyle: 'bold' },
                1: { cellWidth: 'auto', halign: 'right', valign: 'middle', fontStyle: 'bold' }
            },
            didParseCell: (data) => {
                data.cell.styles.lineWidth = 0.3;
                data.cell.styles.lineColor = [0, 0, 0];
            }
        })

        autoTable(doc, {
            startY: (doc as any).lastAutoTable.finalY,
            body: taxBody,
            theme: 'plain',
            margin: { left: pageWidth - 185, right: 10 },
            tableWidth: 'auto',
            showHead: 'never',
            styles: PDF_TABLE_CONTENT_STYLE,
            columnStyles: {
                0: { cellWidth: 40, halign: 'left', valign: 'middle', fontStyle: 'bold' },
                1: { cellWidth: 50, halign: 'left', valign: 'middle', fontStyle: 'bold' },
                2: { cellWidth: 40, halign: 'left', valign: 'middle', fontStyle: 'bold' },
                3: { cellWidth: 'auto', halign: 'right', valign: 'middle', fontStyle: 'bold' }
            },
            didParseCell: (data) => {
                data.cell.styles.lineWidth = 0.3;
                data.cell.styles.lineColor = [0, 0, 0];
            }
        })

        autoTable(doc, {
            startY: (doc as any).lastAutoTable.finalY,
            body: totalBody,
            theme: 'plain',
            margin: { left: pageWidth - 95, right: 10 },
            tableWidth: 'auto',
            showHead: 'never',
            styles: PDF_TABLE_CONTENT_STYLE,
            columnStyles: {
                0: { cellWidth: 40, halign: 'left', valign: 'middle', fontStyle: 'bold' },
                1: { cellWidth: 'auto', halign: 'right', valign: 'middle', fontStyle: 'bold' }
            },
            didParseCell: (data) => {
                data.cell.styles.lineWidth = 0.3;
                data.cell.styles.lineColor = [0, 0, 0];
            }
        })

        const finalYAfterTotals = (doc as any).lastAutoTable.finalY + 6

        doc.setFont(PDF_DEFAULT_FONT, 'normal')
        doc.text(`Nomor Rekening ${PT_BANK}:`, leftX, finalYAfterTotals)
        doc.setFont(PDF_DEFAULT_FONT, 'bold')
        doc.text(`${PT_BANK_ACCOUNT} a/n ${PT_NAME}`, leftX, finalYAfterTotals + 5)
        doc.setFont(PDF_DEFAULT_FONT, 'normal')

        pdfAddDirectorSignatureFooter(doc, pageWidth - 70, finalYAfterTotals, dayPadded, monthName, year)

        const pdfBuffer = doc.output('arraybuffer')

        return new NextResponse(pdfBuffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `inline; filename="invoice-${invoice.invoiceNumber}.pdf"`,
            },
        })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
    }
}
