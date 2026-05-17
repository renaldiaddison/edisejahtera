import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import JSZip from "jszip";

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File | null;
        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        const buffer = await file.arrayBuffer();
        const zip = new JSZip();

        await zip.loadAsync(buffer);

        // Find JSON file inside the zip
        let jsonContent = "";
        for (const filename of Object.keys(zip.files)) {
            if (filename.endsWith(".json")) {
                jsonContent = await zip.files[filename].async("string");
                break;
            }
        }

        if (!jsonContent) {
            return NextResponse.json({ error: "No JSON (or suitable) file found in the zip" }, { status: 400 });
        }

        const allData = JSON.parse(jsonContent);

        // Execute inside a transaction to ensure all or nothing
        await prisma.$transaction(async (tx) => {
            // 1. Delete existing data in reverse order of dependencies
            await tx.invoiceDetail.deleteMany({});
            await tx.invoice.deleteMany({});
            await tx.customerBranch.deleteMany({});
            await tx.item.deleteMany({});
            await tx.customer.deleteMany({});

            // 2. Insert new data in order of dependencies
            if (allData["Customer"] && allData["Customer"].length > 0) {
                await tx.customer.createMany({ data: allData["Customer"] });
            }
            if (allData["Item"] && allData["Item"].length > 0) {
                await tx.item.createMany({ data: allData["Item"] });
            }
            if (allData["CustomerBranch"] && allData["CustomerBranch"].length > 0) {
                await tx.customerBranch.createMany({ data: allData["CustomerBranch"] });
            }
            if (allData["Invoice"] && allData["Invoice"].length > 0) {
                await tx.invoice.createMany({ data: allData["Invoice"] });
            }
            if (allData["InvoiceDetail"] && allData["InvoiceDetail"].length > 0) {
                await tx.invoiceDetail.createMany({ data: allData["InvoiceDetail"] });
            }
            if (allData["ItemStockTransaction"] && allData["ItemStockTransaction"].length > 0) {
                await tx.itemStockTransaction.createMany({ data: allData["ItemStockTransaction"] });
            }
        });

        return NextResponse.json({ message: "Data imported successfully" });

    } catch (error) {
        console.error("Failed to import data:", error);
        return NextResponse.json({ error: "Failed to import data" }, { status: 500 });
    }
}
