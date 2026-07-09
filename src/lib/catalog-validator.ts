import { db } from "@/lib/db";
import { catalogFields, CatalogItemData } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  cleanedData?: {
    nama: string;
    harga: number | null;
    aktif: boolean;
    data: CatalogItemData;
  };
}

export async function validateCatalogItem(
  tenantId: string,
  inputData: Record<string, unknown>
): Promise<ValidationResult> {
  // 1. Get all active catalog fields for the tenant
  const fields = await db.query.catalogFields.findMany({
    where: and(
      eq(catalogFields.tenantId, tenantId),
      eq(catalogFields.isActive, true)
    ),
  });

  // Extract both top-level values and nested 'data' values
  const rawData = { ...inputData };
  if (inputData.data && typeof inputData.data === "object") {
    Object.assign(rawData, inputData.data);
  }

  const cleanedItemData: CatalogItemData = {};
  let nama: string = "";
  let harga: number | null = null;
  let aktif: boolean = true;

  // 2. Validate each field
  for (const field of fields) {
    const key = field.fieldKey;
    const label = field.label;
    const value = rawData[key];

    // Check required fields
    const isEmpty =
      value === undefined ||
      value === null ||
      (typeof value === "string" && value.trim() === "");

    if (field.isRequired && isEmpty) {
      return {
        isValid: false,
        error: `Field '${label}' wajib diisi`,
      };
    }

    // If not required and empty, set to null
    if (isEmpty) {
      if (key === "nama") {
        return { isValid: false, error: "Nama wajib diisi" };
      }
      if (key === "aktif") {
        aktif = true;
      }
      continue;
    }

    // Type checking and sanitization
    let processedValue: unknown = value;

    switch (field.fieldType) {
      case "number":
        processedValue = Number(value);
        if (isNaN(processedValue as number)) {
          return {
            isValid: false,
            error: `Field '${label}' harus berupa angka yang valid`,
          };
        }
        break;

      case "toggle":
        if (typeof value === "string") {
          processedValue = value === "true" || value === "1" || value === "yes";
        } else {
          processedValue = !!value;
        }
        break;

      case "select":
        const options = field.options || [];
        if (!options.includes(String(value))) {
          return {
            isValid: false,
            error: `Nilai field '${label}' tidak valid, harus salah satu dari: ${options.join(", ")}`,
          };
        }
        processedValue = String(value);
        break;

      case "date":
        // simple date validation
        const dateTimestamp = Date.parse(value as string);
        if (isNaN(dateTimestamp)) {
          return {
            isValid: false,
            error: `Field '${label}' harus berupa tanggal yang valid`,
          };
        }
        processedValue = new Date(value as string).toISOString().split("T")[0];
        break;

      case "url":
        if (typeof value !== "string") {
          return {
            isValid: false,
            error: `Field '${label}' harus berupa URL yang valid`,
          };
        }
        processedValue = String(value).trim();
        break;

      default:
        processedValue = typeof value === "string" ? value.trim() : String(value);
        break;
    }

    // Map to direct columns or JSON data column
    if (key === "nama") {
      nama = String(processedValue);
    } else if (key === "harga") {
      harga = processedValue === null ? null : Math.round(Number(processedValue));
    } else if (key === "aktif") {
      aktif = !!processedValue;
    } else {
      cleanedItemData[key] = processedValue as string | number | boolean | null | string[];
    }
  }

  // Ensure system fields are not empty
  if (!nama || nama.trim() === "") {
    return {
      isValid: false,
      error: "Nama katalog tidak boleh kosong",
    };
  }

  return {
    isValid: true,
    cleanedData: {
      nama,
      harga,
      aktif,
      data: cleanedItemData,
    },
  };
}

