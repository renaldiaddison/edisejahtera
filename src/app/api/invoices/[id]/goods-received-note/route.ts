import { PDF_AUTHOR, PDF_DEFAULT_FONT, PDF_DEFAULT_FONT_SIZE, PDF_HEADER_FONT_SIZE, PT_ADDRESS_LONG, PT_ADDRESS_SECONDARY, PT_EMAIL, PT_NAME, PT_PHONE } from '@/lib/constants'
import { pdfAddCustomFont, pdfAddDirectorSignatureFooter, pdfAddPTHeader } from '@/lib/pdf'
import { prisma } from '@/lib/prisma'
import { formatCurrency, formatDate, numberToRupiahWords } from '@/lib/utils'
import { jsPDF } from 'jspdf'
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
                        item: false,
                    },
                },
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

        pdfAddCustomFont(doc)

        doc.setProperties({
            title: "Goods Received Note " + invoice.invoiceNumber,
            subject: "Goods Received Note Document",
            author: PDF_AUTHOR
        })
        const pageWidth = doc.internal.pageSize.getWidth()

        pdfAddPTHeader(doc, 7)

        const leftX = 10
        const topY = 30.5

        doc.setFontSize(PDF_HEADER_FONT_SIZE)
        doc.setFont(PDF_DEFAULT_FONT, 'bolditalic')
        // doc.text('TANDA TERIMA', leftX, topY)
        doc.text('TANDA TERIMA', pageWidth / 2, topY, { align: 'center' })

        doc.setFontSize(PDF_DEFAULT_FONT_SIZE)
        doc.setFont(PDF_DEFAULT_FONT, 'normal')

        const kepadaYthStr = "Kepada Yth, "

        doc.text(kepadaYthStr, leftX, topY + 5)
        doc.setFont(PDF_DEFAULT_FONT, 'bold')
        doc.text(invoice.customer.name, leftX + doc.getTextWidth(kepadaYthStr), topY + 5)

        doc.setFont(PDF_DEFAULT_FONT, 'normal')
        doc.text('Bersama ini, kami serahkan sejumlah dokumen sebagai berikut:', leftX, topY + 15)

        const labelWidth = 23
        const afterLabelWidth = 2;

        doc.text('Surat Jalan', leftX, topY + 20)
        doc.text(':', leftX + labelWidth, topY + 20)
        doc.text(invoice.invoiceNumber, leftX + labelWidth + afterLabelWidth, topY + 20)

        doc.text('Invoice', leftX, topY + 25)
        doc.text(':', leftX + labelWidth, topY + 25)
        doc.text(invoice.invoiceNumber, leftX + labelWidth + afterLabelWidth, topY + 25)

        doc.text('Total', leftX, topY + 30)
        doc.text(':', leftX + labelWidth, topY + 30)
        doc.text(formatCurrency(invoice.total.toNumber()), leftX + labelWidth + afterLabelWidth, topY + 30)

        doc.text('Terbilang', leftX, topY + 35)
        doc.text(':', leftX + labelWidth, topY + 35)
        doc.setFont(PDF_DEFAULT_FONT, 'italic')
        const terbilang = numberToRupiahWords(Math.floor(invoice.total.toNumber()))
        doc.text(terbilang.trim(), leftX + labelWidth + afterLabelWidth, topY + 35)

        const footerY = topY + 45

        doc.setFont(PDF_DEFAULT_FONT, 'normal')
        doc.text('Yang Menerima,', leftX, footerY)
        doc.text('(                               )', leftX, footerY + 25)

        pdfAddDirectorSignatureFooter(doc, pageWidth - 70, footerY, dayPadded, monthName, year)

        const pdfBuffer = doc.output('arraybuffer')

        return new NextResponse(pdfBuffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `inline; filename="goods-received-note-${invoice.invoiceNumber}.pdf"`,
            },
        })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
    }
}
