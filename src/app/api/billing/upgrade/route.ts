import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { subscriptions, tenants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role === "owner") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const paket = formData.get("paket") as string;
    const buktiFile = formData.get("buktiPembayaran") as File;

    if (!paket || !buktiFile) {
      return NextResponse.json(
        { error: "Paket dan bukti pembayaran wajib diisi" },
        { status: 400 }
      );
    }

    // Validasi paket
    if (!["basic", "pro"].includes(paket)) {
      return NextResponse.json(
        { error: "Paket tidak valid" },
        { status: 400 }
      );
    }

    // Upload file
    const bytes = await buktiFile.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create unique filename
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(buktiFile.name);
    const filename = `payment-${tenantId}-${uniqueSuffix}${ext}`;
    
    // Ensure upload dir exists
    const uploadDir = path.join(process.cwd(), "public/uploads/payments");
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }
    
    const filepath = path.join(uploadDir, filename);
    await writeFile(filepath, buffer);
    const buktiUrl = `/uploads/payments/${filename}`;

    // Get current tenant structure
    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, tenantId)
    });

    if (!tenant) throw new Error("Tenant not found");

    // Simulasi harga (nantinya sebaiknya ditarik dari table prices/settings yg dikelola Owner)
    let amount = 0;
    if (paket === "basic") amount = 150000;
    if (paket === "pro") amount = 350000;

    // Create subscription record
    await db.insert(subscriptions).values({
      tenantId,
      paket: paket as "basic" | "pro",
      amount,
      buktiTransfer: buktiUrl,
      status: "pending",
      startDate: new Date(), // Akan diupdate saat owner approve
      endDate: new Date(),   // Akan diupdate saat owner approve
    });

    console.log(`[BILLING] New upgrade request from tenant ${tenantId} for package ${paket}. Proof: ${buktiUrl}`);

    return NextResponse.json(
      { success: true, message: "Pengajuan berhasil dikirim" },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Billing upgrade error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan sistem. Silakan coba lagi." },
      { status: 500 }
    );
  }
}
