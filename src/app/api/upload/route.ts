import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import { auth } from "@/auth";

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = (session.user as { tenantId?: string }).tenantId || "global";
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "uploads";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File terlalu besar (Maksimal 10MB)" }, { status: 400 });
    }

    // Read environment variables for RustFS / S3-compatible storage
    const endpoint = process.env.S3_ENDPOINT;
    const accessKeyId = process.env.S3_ACCESS_KEY;
    const secretAccessKey = process.env.S3_SECRET_KEY;
    const bucket = process.env.S3_BUCKET;
    const region = process.env.S3_REGION || "ap-southeast-1";
    const publicUrl = process.env.S3_PUBLIC_URL;
    const pathStyle = process.env.S3_PATH_STYLE !== "false"; // default true for RustFS/MinIO

    if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) {
      console.error("[Upload] Missing RustFS/S3 environment variables");
      return NextResponse.json({ error: "Storage tidak dikonfigurasi. Hubungi administrator." }, { status: 500 });
    }

    // Initialize S3 client (RustFS/MinIO compatible)
    const s3 = new S3Client({
      endpoint,
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: pathStyle, // Required for RustFS, MinIO, and most S3-compatible storage
    });

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
    
    // Folder structure: folder/tenantId/uuid.ext
    const key = `${folder}/${tenantId}/${uuidv4()}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: fileBuffer,
      ContentType: file.type || "application/octet-stream",
    });

    await s3.send(command);

    // Build public URL
    const basePublicUrl = publicUrl || `${endpoint}/${bucket}`;
    const fileUrl = `${basePublicUrl.replace(/\/$/, "")}/${key}`;

    return NextResponse.json({
      success: true,
      url: fileUrl,
      key,
      size: file.size,
      contentType: file.type,
    });
  } catch (error: any) {
    console.error("[Upload] RustFS S3 error:", error);
    return NextResponse.json({ error: error.message || "Upload gagal" }, { status: 500 });
  }
}
