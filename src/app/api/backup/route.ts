import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import ExcelJS from "exceljs";
import JSZip from "jszip";
import { backupTables } from "@/lib/backupTables";
import { convertDecimalStrings } from "@/lib/utils";

export async function GET() {
    try {
        const timestamp = new Date()
            .toLocaleString("sv-SE")
            .replace(/[: ]/g, "-");

        // Collect all data
        const allData: Record<string, any[]> = {};

        // Create Excel workbook
        const workbook = new ExcelJS.Workbook();

        for (const table of backupTables) {
            const rows = convertDecimalStrings(await table.query(prisma));
            allData[table.name] = rows;

            const worksheet = workbook.addWorksheet(table.name);

            if (rows.length > 0) {
                // Set header row
                worksheet.columns = Object.keys(rows[0]).map((key) => ({
                    header: key,
                    key: key,
                }));

                // Add all rows
                rows.forEach((row: any) => worksheet.addRow(row));
            }
        }

        // Generate Excel buffer
        const excelBuffer = await workbook.xlsx.writeBuffer();

        // Generate JSON string
        const jsonString = JSON.stringify(allData, null, 2);

        // Create ZIP file
        const zip = new JSZip();
        zip.file(`edi-sejahtera-backup-${timestamp}.xlsx`, excelBuffer);
        zip.file(`edi-sejahtera-backup-${timestamp}.json`, jsonString);

        // Generate ZIP buffer
        const zipBuffer = await zip.generateAsync({ type: "arraybuffer" });

        const zipFileName = `edi-sejahtera-backup-${timestamp}.zip`;

        // Return the ZIP file as a downloadable response
        return new NextResponse(zipBuffer, {
            headers: {
                'Content-Type': 'application/zip',
                'Content-Disposition': `attachment; filename="${zipFileName}"`,
            },
        });
    } catch (error) {
        console.error("Failed to create backup:", error);
        return NextResponse.json({ error: "Failed to create backup" }, { status: 500 });
    }
}