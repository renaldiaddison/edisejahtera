import { Customer, CustomerBranch } from "@prisma/client";
import jsPDF from "jspdf";
import { PDF_DEFAULT_FONT, PDF_DEFAULT_FONT_SIZE, PDF_HEADER_FONT_SIZE, PT_ADDRESS_SHORT, PT_DIRECTOR, PT_DOMICILE, PT_EMAIL, PT_NAME, PT_PHONE } from "./constants";
import { CALIBRI_BASE64, CALIBRI_BOLD_BASE64, CALIBRI_BOLD_ITALIC_BASE64, CALIBRI_ITALIC_BASE64 } from "./fonts";

export const pdfAddCustomFont = async (doc: jsPDF) => {
    const fontFiles = [
        { path: "public/fonts/calibri.ttf", name: "calibri", style: "normal", base64: CALIBRI_BASE64 },
        { path: "public/fonts/calibri-bold.ttf", name: "calibri", style: "bold", base64: CALIBRI_BOLD_BASE64 },
        { path: "public/fonts/calibri-italic.ttf", name: "calibri", style: "italic", base64: CALIBRI_ITALIC_BASE64 },
        { path: "public/fonts/calibri-bold-italic.ttf", name: "calibri", style: "bolditalic", base64: CALIBRI_BOLD_ITALIC_BASE64 },
    ];

    for (const font of fontFiles) {
        doc.addFileToVFS(font.path, font.base64);
        doc.addFont(font.path, font.name, font.style);
    }
};


export const pdfAddPTHeader = (doc: jsPDF, startY: number) => {
    const pageWidth = doc.internal.pageSize.getWidth()
    doc.setFont(PDF_DEFAULT_FONT, 'bold')
    doc.setFontSize(PDF_HEADER_FONT_SIZE)
    doc.text(PT_NAME, pageWidth / 2, startY, { align: 'center' })

    doc.setFont(PDF_DEFAULT_FONT, 'normal')
    doc.setFontSize(PDF_DEFAULT_FONT_SIZE)

    doc.text(PT_ADDRESS_SHORT, pageWidth / 2, startY + 5, { align: 'center' })
    doc.text(`Telp: ${PT_PHONE}`, pageWidth / 2, startY + 10, { align: 'center' })
    doc.text(`Email: ${PT_EMAIL}`, pageWidth / 2, startY + 15, { align: 'center' })
    doc.setLineWidth(0.5)
    doc.line(10, startY + 18, pageWidth - 10, startY + 18)
}

export const pdfAddCustomerData = (doc: jsPDF, customer: Customer, branch: CustomerBranch, startX: number, startY: number, labelWidth: number) => {
    doc.setFont(PDF_DEFAULT_FONT, 'bold')
    doc.text('Customer', startX, startY)

    doc.setFont(PDF_DEFAULT_FONT, 'normal')
    doc.text('Nama', startX, startY + 5)
    doc.text(':', startX + labelWidth, startY + 5)
    doc.text(customer.name, startX + labelWidth + 2, startY + 5)

    doc.text('Alamat', startX, startY + 10)
    doc.text(':', startX + labelWidth, startY + 10)
    const addressLines = doc.splitTextToSize(branch.address, 90)
    let startAddressY = startY + 10
    for (const addressLine of addressLines) {
        doc.text(addressLine, startX + labelWidth + 2, startAddressY)
        startAddressY += 5
    }
    const afterAddressY = startAddressY

    doc.text('Kota', startX, afterAddressY)
    doc.text(':', startX + labelWidth, afterAddressY)
    doc.text(branch.city || '-', startX + labelWidth + 2, afterAddressY)

    doc.text('Kode Pos', startX, afterAddressY + 5)
    doc.text(':', startX + labelWidth, afterAddressY + 5)
    doc.text(branch.postalCode || '-', startX + labelWidth + 2, afterAddressY + 5)

    doc.text('NPWP', startX, afterAddressY + 10)
    doc.text(':', startX + labelWidth, afterAddressY + 10)
    doc.text(customer.npwp, startX + labelWidth + 2, afterAddressY + 10)

    doc.text('No. Telp', startX, afterAddressY + 15)
    doc.text(':', startX + labelWidth, afterAddressY + 15)
    doc.text(`${branch.phone || '-'}, Email: ${branch.email || '-'}`, startX + labelWidth + 2, afterAddressY + 15)

    const afterCustomerDataY = afterAddressY + 13
    return afterCustomerDataY;
}

export const pdfAddDirectorSignatureFooter = (doc: jsPDF, startX: number, startY: number, day: string | number, month: string | number, year: string | number) => {
    doc.setFont(PDF_DEFAULT_FONT, 'normal')
    const footerDate = `${day} ${month} ${year}`
    doc.text(`${PT_DOMICILE}, ${footerDate}`, startX, startY)
    doc.text(PT_DIRECTOR, startX, startY + 25)
}