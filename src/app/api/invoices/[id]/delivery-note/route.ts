import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

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

        doc.setProperties({
            title: "Delivery Note",
            subject: "Delivery Note Document",
            author: "EdiSejahtera"
        })

        doc.setCharSpace(0.1)

        const pageWidth = doc.internal.pageSize.getWidth()
        const pageHeight = doc.internal.pageSize.getHeight()

        doc.setFont('helvetica', 'bold')
        doc.setFontSize(16)
        doc.text('PT EDI SEJAHTERA', pageWidth / 2, 15, { align: 'center' })

        doc.setFontSize(12)
        doc.setFont('helvetica', 'normal')
        doc.text('Thinner & Paint Auxiliaries', pageWidth / 2, 20, { align: 'center' })
        doc.text('edisejahtera@yahoo.com or edisejahtera02@gmail.com', pageWidth / 2, 25, { align: 'center' })

        doc.setLineWidth(0.5)
        doc.line(10, 28, pageWidth - 10, 28)

        const leftX = 10
        const topY = 33
        const labelWidth = 25

        doc.setFont('helvetica', 'bold')
        doc.text('Customer', leftX, topY)

        doc.setFont('helvetica', 'normal')
        doc.text('Nama', leftX, topY + 5)
        doc.text(':', leftX + labelWidth, topY + 5)
        doc.text(invoice.customer.name, leftX + labelWidth + 2, topY + 5)

        doc.text('Alamat', leftX, topY + 10)
        doc.text(':', leftX + labelWidth, topY + 10)
        const addressLines = doc.splitTextToSize(invoice.customer.address || '-', 60)
        doc.text(addressLines, leftX + labelWidth + 2, topY + 10)
        console.log(addressLines)
        const afterAddressY = topY + 10 + (addressLines.length * 5)

        doc.text('Kota', leftX, afterAddressY)
        doc.text(':', leftX + labelWidth, afterAddressY)
        doc.text(invoice.customer.city || '-', leftX + labelWidth + 2, afterAddressY)

        doc.text('NPWP', leftX, afterAddressY + 5)
        doc.text(':', leftX + labelWidth, afterAddressY + 5)
        doc.text(invoice.customer.npwp || '-', leftX + labelWidth + 2, afterAddressY + 5)

        doc.text('Kode Pos', leftX, afterAddressY + 10)
        doc.text(':', leftX + labelWidth, afterAddressY + 10)
        doc.text(invoice.customer.postalCode || '-', leftX + labelWidth + 2, afterAddressY + 10)

        doc.text('No. Telp', leftX, afterAddressY + 15)
        doc.text(':', leftX + labelWidth, afterAddressY + 15)
        doc.text(invoice.customer.phone || '-', leftX + labelWidth + 2, afterAddressY + 15)

        const rightX = pageWidth / 2 + 10
        const rightLabelWidth = 25

        doc.text('Surat Jalan', rightX, topY + 5)
        doc.text(':', rightX + rightLabelWidth, topY + 5)

        doc.setFont('helvetica', 'bold')
        doc.text(invoice.invoiceNumber, rightX + rightLabelWidth + 2, topY + 5)

        doc.setFont('helvetica', 'normal')
        const date = new Date(invoice.date)
        const day = date.getDate().toString().padStart(2, '0')
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        const month = monthNames[date.getMonth()]
        const year = date.getFullYear().toString().slice(-2)
        const formattedDate = `${day}-${month}-${year}`

        doc.text('Tanggal', rightX, topY + 10)
        doc.text(':', rightX + rightLabelWidth, topY + 10)
        doc.text(formattedDate, rightX + rightLabelWidth + 2, topY + 10)

        doc.text('No. PO', rightX, topY + 15)
        doc.text(':', rightX + rightLabelWidth, topY + 15)
        doc.text(invoice.poNumber || '-', rightX + rightLabelWidth + 2, topY + 15)

        const tableStartY = Math.max(afterAddressY + 15, topY + 30) + 5

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
            styles: {
                fontSize: 12,
                cellPadding: 2,
                lineColor: [0, 0, 0],
                lineWidth: 0.1,
                textColor: [0, 0, 0],
                fillColor: [255, 255, 255],
            },
            headStyles: {
                fontSize: 12,
                fillColor: [255, 255, 255],
                textColor: [0, 0, 0],
                fontStyle: 'bold',
                lineWidth: 0.1,
                lineColor: [0, 0, 0],
                halign: 'center'
            },
            columnStyles: {
                0: { cellWidth: 20, halign: 'center', valign: 'middle' }, // Qty
                1: { cellWidth: 25, halign: 'center', valign: 'middle' }, // Unit
                2: { cellWidth: 'auto', valign: 'middle' } // Description
            },
            // Draw borders for all cells
            didParseCell: (data) => {
                data.cell.styles.lineWidth = 0.3;
                data.cell.styles.lineColor = [0, 0, 0];
            }
        })

        const finalY = (doc as any).lastAutoTable.finalY + 10

        doc.setFontSize(12)
        doc.text('Penerima :', 10, finalY)
        doc.line(10, finalY + 26, 50, finalY + 26)

        const fullYear = date.getFullYear()
        const footerDate = `${date.getDate()} ${monthNames[date.getMonth()]} ${fullYear}`
        doc.text(`Jakarta, ${footerDate}`, pageWidth - 60, finalY)

        doc.setFont('helvetica', 'bold')
        doc.text('PT EDI SEJAHTERA', pageWidth - 60, finalY + 5)
        doc.setFont('helvetica', 'normal')
        doc.text('EDI LIAN', pageWidth - 60, finalY + 25) // Name

        const pdfBuffer = doc.output('arraybuffer')

        return new NextResponse(pdfBuffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `inline; filename="DeliveryNote-${invoice.invoiceNumber}.pdf"`,
            },
        })
    } catch (error) {
        console.error('Failed to generate PDF', error)
        return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
    }
}
