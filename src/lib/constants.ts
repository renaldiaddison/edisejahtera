import { UserOptions } from "jspdf-autotable"

export const TAX_RATE = 0.12
export const DPP_RATE = 11 / 12

export const PT_NAME = "PT. EDI SEJAHTERA"
export const PT_ADDRESS_LONG = "KOMPLEK PERMATA KOTA BLOCK I 3 JL. PANGERAN TUBAGUS ANGKE NO. 170 RT 010 RW 01"
export const PT_ADDRESS_SHORT = "KOMPLEK PERMATA KOTA BLOCK I 3 JL. PANGERAN TUBAGUS ANGKE"
export const PT_ADDRESS_SECONDARY = "PEJAGALAN PENJARINGAN JAKARTA UTARA"
export const PT_PHONE = "08161816486"
export const PT_EMAIL = "edisejahtera@yahoo.com / edisejahtera02@gmail.com"
export const PT_DIRECTOR = "EDI LIAN"
export const PT_BANK = "BCA"
export const PT_BANK_ACCOUNT = "5850136868"
export const PT_DOMICILE = "Jakarta"

export const PDF_DEFAULT_FONT = "helvetica"
export const PDF_DEFAULT_FONT_SIZE = 12
export const PDF_HEADER_FONT_SIZE = 16
export const PDF_DEFAULT_CHARACTER_SPACE = 0.1

export const PDF_TABLE_CONTENT_STYLE: UserOptions['styles'] = {
    fontSize: PDF_DEFAULT_FONT_SIZE,
    cellPadding: 2,
    lineColor: [0, 0, 0],
    lineWidth: 0.1,
    textColor: [0, 0, 0],
    fillColor: [255, 255, 255],
}

export const PDF_TABLE_HEADER_STYLE: UserOptions['headStyles'] = {
    fontSize: PDF_DEFAULT_FONT_SIZE,
    fillColor: [255, 255, 255],
    textColor: [0, 0, 0],
    fontStyle: 'bold',
    lineWidth: 0.1,
    lineColor: [0, 0, 0],
    halign: 'center',
    valign: 'middle',
}
