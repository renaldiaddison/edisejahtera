import { Customer, CustomerAddress } from "@prisma/client";
import jsPDF from "jspdf";
import { PDF_DEFAULT_FONT, PDF_DEFAULT_FONT_SIZE, PDF_HEADER_FONT_SIZE, PT_ADDRESS_SHORT, PT_DIRECTOR, PT_DOMICILE, PT_EMAIL, PT_NAME, PT_PHONE } from "./constants";

export const pdfAddPTHeader = (doc: jsPDF, startY: number) => {
    const pageWidth = doc.internal.pageSize.getWidth()
    doc.setFont(PDF_DEFAULT_FONT, 'bold')
    doc.setFontSize(PDF_HEADER_FONT_SIZE)
    console.log(pageWidth)
    doc.text(PT_NAME, pageWidth / 2, startY, { align: 'center' })

    doc.setFont(PDF_DEFAULT_FONT, 'normal')
    doc.setFontSize(PDF_DEFAULT_FONT_SIZE)

    doc.text(PT_ADDRESS_SHORT, pageWidth / 2, startY + 5, { align: 'center' })
    doc.text(`Telp: ${PT_PHONE}`, pageWidth / 2, startY + 10, { align: 'center' })
    doc.text(`Email: ${PT_EMAIL}`, pageWidth / 2, startY + 15, { align: 'center' })
    doc.setLineWidth(0.5)
    doc.line(10, startY + 18, pageWidth - 10, startY + 18)
}

export const pdfAddCustomerData = (doc: jsPDF, customer: Customer, address: CustomerAddress, startX: number, startY: number, labelWidth: number) => {
    doc.setFont(PDF_DEFAULT_FONT, 'bold')
    doc.text('Customer', startX, startY)

    doc.setFont(PDF_DEFAULT_FONT, 'normal')
    doc.text('Nama', startX, startY + 5)
    doc.text(':', startX + labelWidth, startY + 5)
    doc.text(customer.name, startX + labelWidth + 2, startY + 5)

    doc.text('Alamat', startX, startY + 10)
    doc.text(':', startX + labelWidth, startY + 10)
    const addressLines = doc.splitTextToSize(address.address, 90)
    let startAddressY = startY + 10
    for (const addressLine of addressLines) {
        doc.text(addressLine, startX + labelWidth + 2, startAddressY)
        startAddressY += 5
    }
    const afterAddressY = startAddressY

    doc.text('Kota', startX, afterAddressY)
    doc.text(':', startX + labelWidth, afterAddressY)
    doc.text(address.city || '-', startX + labelWidth + 2, afterAddressY)

    doc.text('Kode Pos', startX, afterAddressY + 5)
    doc.text(':', startX + labelWidth, afterAddressY + 5)
    doc.text(address.postalCode || '-', startX + labelWidth + 2, afterAddressY + 5)

    doc.text('NPWP', startX, afterAddressY + 10)
    doc.text(':', startX + labelWidth, afterAddressY + 10)
    doc.text(customer.npwp || '-', startX + labelWidth + 2, afterAddressY + 10)

    doc.text('No. Telp', startX, afterAddressY + 15)
    doc.text(':', startX + labelWidth, afterAddressY + 15)
    doc.text(customer.phone || '-', startX + labelWidth + 2, afterAddressY + 15)

    const afterCustomerDataY = afterAddressY + 13
    return afterCustomerDataY;
}

export const pdfAddDirectorSignatureFooter = (doc: jsPDF, startX: number, startY: number, day: string | number, month: string | number, year: string | number) => {
    const footerDate = `${day} ${month} ${year}`
    doc.text(`${PT_DOMICILE}, ${footerDate}`, startX, startY)

    doc.setFont(PDF_DEFAULT_FONT, 'normal')
    doc.text(PT_DIRECTOR, startX, startY + 25)
}