import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

export function formatTime(time: string): string {
  const [hours, minutes] = time.split(":");
  return `${hours}:${minutes}`;
}

export function formatPhoneNumber(phone: string): string {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, "");
  
  // If starts with 62, keep it
  if (digits.startsWith("62")) {
    return `+${digits}`;
  }
  
  // If starts with 0, replace with 62
  if (digits.startsWith("0")) {
    return `+62${digits.slice(1)}`;
  }
  
  // Otherwise add 62
  return `+62${digits}`;
}

export function generateId(): string {
  return crypto.randomUUID();
}
