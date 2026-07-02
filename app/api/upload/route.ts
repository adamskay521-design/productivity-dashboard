import { NextResponse } from "next/server";
import { put } from "@vercel/blob";

export async function POST(req: Request) {
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        { error: "Image upload not configured. Paste an image URL instead." },
        { status: 503 }
      );
    }
    const form = await req.formData();
    const file = form.get("file") as File;
    const folder = (form.get("folder") as string) || "yarn";
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    const blob = await put(`${folder}/${Date.now()}-${file.name}`, file, { access: "public" });
    return NextResponse.json({ url: blob.url });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
