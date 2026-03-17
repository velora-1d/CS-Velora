import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { clients } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import * as XLSX from "xlsx";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format") || "csv";

  const list = await db.query.clients.findMany({
    where: eq(clients.tenantId, session.user.id),
    orderBy: [desc(clients.lastInteraction)],
  });

  const data = list.map(c => ({
    "Nama": c.nama || "-",
    "Nomor WhatsApp": c.nomor,
    "Status": c.isNew ? "Baru" : "Lama",
    "Terdaftar": c.createdAt.toISOString().split('T')[0],
    "Interaksi Terakhir": c.lastInteraction.toISOString().replace('T', ' ').substring(0, 19),
    "Catatan": c.catatan || "-"
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Clients");

  if (format === "xlsx") {
    const buf = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    return new Response(buf, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="clients.xlsx"'
      }
    });
  } else {
    const csvValue = XLSX.utils.sheet_to_csv(worksheet);
    return new Response(csvValue, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="clients.csv"'
      }
    });
  }
}
