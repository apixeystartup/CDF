import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";

interface PlaceData {
  name: string;
  phone: string;
  address: string;
  website: string;
}

export async function POST(request: NextRequest) {
  try {
    const { data, location, type } = await request.json();

    if (!data || !Array.isArray(data)) {
      return NextResponse.json(
        { error: "Data array is required" },
        { status: 400 }
      );
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Client Data Fetch";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet(`${type} in ${location}`);

    sheet.columns = [
      { header: "S.No", key: "sno", width: 8 },
      { header: "Company", key: "company", width: 35 },
      { header: "Phone", key: "phone", width: 20 },
      { header: "Address", key: "address", width: 50 },
      { header: "Website", key: "website", width: 40 },
    ];

    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF2563EB" },
    };
    headerRow.alignment = { horizontal: "center", vertical: "middle" };
    headerRow.height = 30;

    data.forEach((place: PlaceData, index: number) => {
      const row = sheet.addRow({
        sno: index + 1,
        company: place.name === "N/A" ? "None" : place.name,
        phone: place.phone === "N/A" ? "None" : place.phone,
        address: place.address === "N/A" ? "None" : place.address,
        website: place.website === "N/A" ? "None" : place.website,
      });

      row.alignment = { vertical: "middle" };
      if (index % 2 === 0) {
        row.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF0F4FF" },
        };
      }
    });

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${type}_${location.replace(/,\s*/g, "_")}.xlsx"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Failed to generate Excel file" },
      { status: 500 }
    );
  }
}
