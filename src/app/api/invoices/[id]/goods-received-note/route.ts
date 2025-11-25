import { PDF_AUTHOR, PDF_DEFAULT_FONT, PDF_DEFAULT_FONT_SIZE, PT_ADDRESS_LONG, PT_ADDRESS_SECONDARY, PT_EMAIL, PT_NAME, PT_PHONE } from '@/lib/constants'
import { pdfAddDirectorSignatureFooter } from '@/lib/pdf'
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

        doc.setProperties({
            title: "Goods Received Note " + invoice.invoiceNumber,
            subject: "Goods Received Note Document",
            author: PDF_AUTHOR
        })

        const pageWidth = doc.internal.pageSize.getWidth()

        const leftX = 6

        doc.setFontSize(PDF_DEFAULT_FONT_SIZE)
        doc.setFont(PDF_DEFAULT_FONT, 'bold')
        doc.text(PT_NAME, leftX, 15)

        doc.setFontSize(PDF_DEFAULT_FONT_SIZE)
        doc.setFont(PDF_DEFAULT_FONT, 'normal')
        doc.text(PT_ADDRESS_LONG, leftX, 20)
        doc.text(PT_ADDRESS_SECONDARY, leftX, 25)
        doc.text(`Telp: ${PT_PHONE}`, leftX, 30)
        doc.text(`Email: ${PT_EMAIL}`, leftX, 35)

        doc.setFontSize(15)
        doc.setFont(PDF_DEFAULT_FONT, 'italic', 'bold')
        doc.text('TANDA TERIMA', leftX + 50, 42)
        doc.setLineWidth(0.5)
        doc.line(leftX + 50, 43, leftX + 91, 43)

        doc.setFontSize(PDF_DEFAULT_FONT_SIZE)
        doc.setFont(PDF_DEFAULT_FONT, 'normal')
        doc.text('Kepada Yth,', leftX, 47)
        doc.setFont(PDF_DEFAULT_FONT, 'bold')
        doc.text(invoice.customer.name, leftX + 25, 47)

        doc.setFont(PDF_DEFAULT_FONT, 'normal')
        doc.text('Bersama ini, kami serahkan sejumlah dokumen sebagai berikut:', leftX, 57)

        doc.text('Surat Jalan', leftX, 62)
        doc.text(':', leftX + 25, 62)
        doc.text(invoice.invoiceNumber, leftX + 27, 62)

        doc.text('Invoice', leftX, 67)
        doc.text(':', leftX + 25, 67)
        doc.text(invoice.invoiceNumber, leftX + 27, 67)

        doc.text('Total', leftX, 72)
        doc.text(':', leftX + 25, 72)
        doc.text(formatCurrency(invoice.total.toNumber()), leftX + 27, 72)

        doc.text('Terbilang', leftX, 77)
        doc.text(':', leftX + 25, 77)
        doc.setFont(PDF_DEFAULT_FONT, 'italic')
        const terbilang = numberToRupiahWords(Math.floor(invoice.total.toNumber()))
        doc.text(terbilang.trim(), leftX + 27, 77)

        const footerY = 87

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
