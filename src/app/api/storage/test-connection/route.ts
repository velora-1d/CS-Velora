import { NextResponse } from "next/server";
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { auth } from "@/auth";
import { getEnvFallback } from "@/lib/env";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const endpoint = getEnvFallback("S3_ENDPOINT");
    const accessKeyId = getEnvFallback("S3_ACCESS_KEY");
    const secretAccessKey = getEnvFallback("S3_SECRET_KEY");
    const bucket = getEnvFallback("S3_BUCKET");
    const region = getEnvFallback("S3_REGION") || "ap-southeast-1";
    const pathStyle = getEnvFallback("S3_PATH_STYLE") !== "false";

    if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) {
      return NextResponse.json({
        success: false,
        error: "Storage S3 tidak dikonfigurasi di file .env server."
      });
    }

    const s3 = new S3Client({
      endpoint,
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: pathStyle,
    });

    const command = new ListObjectsV2Command({
      Bucket: bucket,
      MaxKeys: 1,
    });

    await s3.send(command);

    return NextResponse.json({
      success: true,
      message: "Koneksi ke S3 Storage berhasil terhubung! Bucket dan Kredensial valid.",
    });
  } catch (error: any) {
    console.error("Test S3 Connection error:", error);
    return NextResponse.json({
      success: false,
      error: `Gagal terhubung ke S3 Storage: ${error.message || String(error)}`
    });
  }
}
