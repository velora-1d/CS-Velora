import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import { auth } from "@/auth";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = (session.user as { tenantId?: string }).tenantId || "global";
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Read environment variables
    const endpoint = process.env.S3_ENDPOINT || "https://s3.ve-lora.my.id";
    const accessKeyId = process.env.S3_ACCESS_KEY || "YOJLTu0U8dR1ETeFZE8q";
    const secretAccessKey = process.env.S3_SECRET_KEY || "6ng8HqRJLF5pXXHpt2UAfSZ9gDerzxQLHDKMmG4c";
    const bucket = process.env.S3_BUCKET || "jbr-minpo";
    const region = process.env.S3_REGION || "ap-southeast-1";
    const publicUrl = process.env.S3_PUBLIC_URL || `https://s3.ve-lora.my.id/${bucket}`;

    // Initialize S3 client
    const s3 = new S3Client({
      endpoint,
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: true,
    });

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split(".").pop() || "bin";
    
    // Folder structure: tenantId/uuid.ext
    const key = `${tenantId}/${uuidv4()}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: fileBuffer,
      ContentType: file.type || "application/octet-stream",
    });

    await s3.send(command);

    const fileUrl = `${publicUrl.replace(/\/$/, "")}/${key}`;

    return NextResponse.json({
      success: true,
      url: fileUrl,
    });
  } catch (error: any) {
    console.error("Upload to RustFS S3 error:", error);
    return NextResponse.json({ error: error.message || "Upload failed" }, { status: 500 });
  }
}
