import { PrismaClient } from "@prisma/client";

interface BackupTable {
    name: string;
    query: (prisma: PrismaClient) => Promise<any[]>;
}

export const backupTables: BackupTable[] = [
    { name: "Customer", query: (prisma) => prisma.customer.findMany() },
    { name: "CustomerBranch", query: (prisma) => prisma.customerBranch.findMany() },
    { name: "Item", query: (prisma) => prisma.item.findMany() },
    { name: "Invoice", query: (prisma) => prisma.invoice.findMany() },
    { name: "InvoiceDetail", query: (prisma) => prisma.invoiceDetail.findMany() },
];