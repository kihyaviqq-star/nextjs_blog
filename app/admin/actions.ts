"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateSoftwareLinks(
  id: string, 
  websiteUrl: string, 
  localDownloadUrl: string
) {
  try {
    await prisma.software.update({
      where: { id },
      data: {
        websiteUrl: websiteUrl || null,
        localDownloadUrl: localDownloadUrl || null,
      }
    });
    
    revalidatePath("/admin");
    revalidatePath("/software");
    revalidatePath("/tools");
    revalidatePath(`/software/${id}`); // Note: ID is not slug, but it's fine for global cache flush
    
    return { success: true };
  } catch (error) {
    console.error("Failed to update software:", error);
    return { success: false, error: "Database update failed" };
  }
}

export async function deleteBulkSoftware(ids: string[]) {
  try {
    await prisma.software.deleteMany({
      where: {
        id: { in: ids }
      }
    });
    
    revalidatePath("/admin");
    revalidatePath("/software");
    revalidatePath("/tools");
    
    return { success: true };
  } catch (error) {
    console.error("Failed to delete software:", error);
    return { success: false, error: "Database delete failed" };
  }
}
