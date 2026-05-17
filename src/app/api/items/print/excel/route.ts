import { PDF_AUTHOR, PDF_TABLE_CONTENT_STYLE, PDF_TABLE_HEADER_STYLE, PT_NAME } from '@/lib/constants'
import { pdfAddCustomFont, pdfAddPTHeader } from '@/lib/pdf'
import { formatCurrency } from '@/lib/utils'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { NextRequest, NextResponse } from 'next/server'
import ExcelJS from 'exceljs'

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()
        const file = formData.get('file') as File

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 })
        }

        const buffer = await file.arrayBuffer()
        const workbook = new ExcelJS.Workbook()
        await workbook.xlsx.load(buffer)
        const worksheet = workbook.getWorksheet(1)

        if (!worksheet) {
            return NextResponse.json({ error: 'Invalid worksheet' }, { status: 400 })
        }

        const items: any[] = []
        let total = 0

        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return // Skip header

            const name = row.getCell(1).text
            const unit = row.getCell(2).text
            const sellPrice = parseFloat(row.getCell(3).text) || 0
            const buyPrice = parseFloat(row.getCell(4).text) || 0
            const stockQuantity = parseInt(row.getCell(5).text) || 0

            if (name) {
                const subtotal = sellPrice * stockQuantity
                items.push({
                    name,
                    unit,
                    sellPrice,
                    buyPrice,
                    stockQuantity,
                    subtotal
                })
                total += subtotal
            }
        })

        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
        })

        pdfAddCustomFont(doc)

        doc.setProperties({
            title: `Item List (Print from Excel) - ${PT_NAME}`,
            subject: `Item List Document (Print from Excel) - ${PT_NAME}`,
            author: PDF_AUTHOR
        })

        const pageWidth = doc.internal.pageSize.getWidth()

        pdfAddPTHeader(doc, 7)

        const topY = 25
        const tableStartY = topY + 3

        const tableBody = items.map(item => [
            item.name,
            item.unit,
            formatCurrency(item.sellPrice),
            formatCurrency(item.buyPrice),
            item.stockQuantity,
            formatCurrency(item.subtotal)
        ])

        autoTable(doc, {
            startY: tableStartY,
            head: [['Name', 'Unit', 'Sell Price', 'Buy Price', 'Stock', 'Total']],
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
                1: { cellWidth: 20, halign: 'center', valign: 'middle' }, // Unit
                2: { cellWidth: 30, valign: 'middle' }, // Sell Price
                3: { cellWidth: 30, valign: 'middle' }, // Buy Price
                4: { cellWidth: 15, halign: "center", valign: 'middle' }, // Stock
                5: { cellWidth: 'auto', valign: 'middle' }, // Total
            },
        })

        const totalBody = [
            ['Total', formatCurrency(total)],
        ]

        autoTable(doc, {
            startY: (doc as any).lastAutoTable.finalY,
            body: totalBody,
            theme: 'plain',
            margin: { left: pageWidth - 70, right: 10 },
            tableWidth: 'auto',
            styles: PDF_TABLE_CONTENT_STYLE,
            columnStyles: {
                0: { cellWidth: 15, valign: 'middle', fontStyle: 'bold' }, // Total
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
                'Content-Disposition': `inline; filename="Item List (Excl) - ${PT_NAME}.pdf"`,
            },
        })
    } catch (error) {
        console.error('Print from Excel failed:', error)
        return NextResponse.json({ error: 'Failed to process Excel and generate PDF' }, { status: 500 })
    }
}
