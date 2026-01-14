import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { auth } from "@/lib/auth";
import rateLimit from "@/lib/rate-limit";
import { handleApiError } from "@/lib/error-handler";

// Initialize rate limiter
const limiter = rateLimit({
  interval: 60 * 1000, // 60 seconds
  uniqueTokenPerInterval: 500, // Max 500 users per second
});

// Helper function to sanitize filename
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, "_")
    .toLowerCase();
}

// Helper function to validate file content by magic numbers
function validateFileContent(buffer: Buffer, mimeType: string): boolean {
  if (buffer.length < 4) return false;

  const hex = buffer.toString("hex", 0, 4);

  switch (mimeType) {
    case "image/jpeg":
    case "image/jpg":
      return hex.startsWith("ffd8ff");
    case "image/png":
      return hex === "89504e47";
    case "image/gif":
      return hex.startsWith("47494638");
    case "image/webp":
      // WebP is RIFF...WEBP. 
      // Offset 0-3: RIFF (52 49 46 46)
      // Offset 8-11: WEBP (57 45 42 50)
      if (buffer.length < 12) return false;
      const riff = buffer.toString("hex", 0, 4);
      const webp = buffer.toString("hex", 8, 12);
      return riff === "52494646" && webp === "57454250";
    default:
      return false;
  }
}

// Helper function to generate unique filename with safe extension
function generateUniqueFilename(originalName: string, mimeType: string): string {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  
  // Determine safe extension based on MIME type
  let ext = "bin";
  switch (mimeType) {
    case "image/jpeg":
    case "image/jpg":
      ext = "jpg";
      break;
    case "image/png":
      ext = "png";
      break;
    case "image/gif":
      ext = "gif";
      break;
    case "image/webp":
      ext = "webp";
      break;
  }
  
  // Sanitize original name for the prefix (optional, just for readability)
  const nameWithoutExt = originalName.split(".").slice(0, -1).join(".");
  const sanitized = sanitizeFilename(nameWithoutExt).substring(0, 30); // Limit length
  
  return `${sanitized}-${timestamp}-${randomStr}.${ext}`;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string; // 'avatar', 'logo', 'cover', 'favicon', 'editor-image'

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!type || !["avatar", "logo", "cover", "favicon", "editor-image"].includes(type)) {
      return NextResponse.json({ error: "Invalid upload type" }, { status: 400 });
    }

    // Validate MIME type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed" },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB" },
        { status: 400 }
      );
    }

    // Convert file to buffer for magic number validation
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Validate magic numbers
    if (!validateFileContent(buffer, file.type)) {
      return NextResponse.json(
        { error: "Invalid file content. The file extension does not match its content." },
        { status: 400 }
      );
    }

    // Determine upload directory based on type
    // For favicon, use "favicons" folder, for editor-image use "covers", for others use plural form
    const folderName = type === "favicon" 
      ? "favicons" 
      : type === "editor-image" 
        ? "covers" 
        : `${type}s`;
    const uploadDir = join(process.cwd(), "public", "uploads", folderName);
    
    // Ensure directory exists
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (error) {
      console.error("Failed to create upload directory:", error);
    }

    // Generate unique filename with SAFE extension
    const uniqueFilename = generateUniqueFilename(file.name, file.type);
    const filepath = join(uploadDir, uniqueFilename);

    // Save the buffer
    await writeFile(filepath, buffer);

    // Return the public URL (reuse folderName variable)
    const publicUrl = `/uploads/${folderName}/${uniqueFilename}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename: uniqueFilename,
    });
  } catch (error) {
    const { message, status } = handleApiError(error, "API Upload");
    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}
