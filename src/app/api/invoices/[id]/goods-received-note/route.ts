import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { jsPDF } from 'jspdf'
import { formatCurrency, numberToRupiahWords } from '@/lib/utils'

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
            },
        })

        if (!invoice) {
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
        }

        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
        })

        const X = 6

        doc.setProperties({
            title: "Goods Received Note",
            subject: "Goods Received Note Document",
            author: "EdiSejahtera"
        })

        doc.setCharSpace(0.1)

        doc.setFontSize(16)
        doc.setFont('helvetica', 'bold')
        doc.text('PT EDI SEJAHTERA', X, 15)

        doc.setFontSize(12)
        doc.setFont('helvetica', 'normal')
        doc.text('KOMPLEK PERMATA KOTA BLOCK I 3 JL. PANGERAN TUBAGUS ANGKE NO. 170 RT 010 RW 01', X, 20)
        doc.text('PEJAGALAN PENJARINGAN JAKARTA UTARA', X, 25)

        doc.setFont('helvetica', 'bold')
        doc.text('Telp. (021) 6397322, 63864624, 08161816486', X, 30)

        doc.setFont('helvetica', 'normal')
        doc.text('Email : edisejahtera@yahoo.com or edisejahtera02@gmail.com', X, 35)

        // Title
        doc.setFontSize(15)
        doc.setFont('helvetica', 'italic', 'bold')
        doc.text('TANDA TERIMA', X + 50, 42)
        doc.setLineWidth(0.5)
        doc.line(X + 50, 43, X + 91, 43) // Underline

        // Recipient
        doc.setFontSize(12)
        doc.setFont('helvetica', 'normal')
        doc.text('Kepada Yth,', X, 47)
        doc.setFont('helvetica', 'bold')
        doc.text(invoice.customer.name, X + 25, 47)

        // Body
        doc.setFont('helvetica', 'italic', 'bold')
        doc.text('Bersama ini kami serahkan sejumlah dokumen sebagai berikut:', X, 57)

        doc.setFont('helvetica', 'italic')
        doc.text('Surat Jalan', X, 62)
        doc.setFont('helvetica', 'normal')
        doc.text(':', X + 25, 62)
        doc.text(invoice.invoiceNumber, X + 30, 62)

        doc.setFont('helvetica', 'italic')
        doc.text('Invoice', X, 67)
        doc.setFont('helvetica', 'normal')
        doc.text(':', X + 25, 67)
        doc.text(invoice.invoiceNumber, X + 30, 67)

        // Details
        doc.setFont('helvetica', 'italic')
        doc.text('Total', X, 77)
        doc.setFont('helvetica', 'normal')
        doc.text(':', X + 25, 77)
        doc.text(formatCurrency(invoice.totalAmount.toNumber()), X + 30, 77)

        doc.setFont('helvetica', 'italic')
        doc.text('Terbilang', X, 82)
        doc.setFont('helvetica', 'normal')
        doc.text(':', X + 25, 82)
        doc.setFont('helvetica', 'italic')
        const terbilang = numberToRupiahWords(Math.floor(invoice.totalAmount.toNumber()))
        console.log(terbilang)
        doc.text(terbilang.trim(), X + 30, 82)

        // Footer
        const footerY = 100
        doc.setFont('helvetica', 'normal')

        // Left Signature
        doc.text('Yang Menerima,', X, footerY)
        doc.text('(                               )', X, footerY + 25)

        // Right Signature
        const date = new Date(invoice.date)
        const day = date.getDate().toString().padStart(2, '0')
        const month = (date.getMonth() + 1).toString().padStart(2, '0')
        const year = date.getFullYear()
        const formattedDate = `${day}/${month}/${year}`

        doc.text(`Jakarta, ${formattedDate}`, X + 105, footerY)
        doc.text('(   EDI LIAN   )', X + 105, footerY + 25)

        const pdfBuffer = doc.output('arraybuffer')

        return new NextResponse(pdfBuffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `inline; filename="goods-received-note-${invoice.invoiceNumber}.pdf"`,
            },
        })
    } catch (error) {
        console.error('Failed to generate PDF', error)
        return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
    }
}
