import { Prisma } from "@prisma/client"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
  }).format(amount)
}

export function formatDateLocale(dateInput: Date) {
  return new Date(dateInput).toLocaleDateString('id-ID')
}

export function decimalToPercentString(value: number, digits = 2): string {
  return (value * 100).toFixed(digits) + "%";
}

export function formatDate(dateInput: Date) {
  const date = new Date(dateInput)
  const day = date.getDate()
  const dayPadded = day.toString().padStart(2, '0')
  const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"]
  const month = date.getMonth()
  const monthName = monthNames[month]
  const year = date.getFullYear()

  return { day, dayPadded, month, monthName, year }
}

export function convertDecimalStrings(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(convertDecimalStrings)
  }

  if (obj && typeof obj === 'object') {
    for (const key in obj) {
      const value = obj[key]
      if (Prisma.Decimal.isDecimal(value)) {
        obj[key] = value.toNumber()
      }

      if (Array.isArray(value)) {
        obj[key] = value.map(convertDecimalStrings)
      }
    }
  }

  return obj
}

export function numberToRupiahWords(n: number): string {
  const angka = ["", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan", "sepuluh", "sebelas"]

  function toWords(x: number): string {
    let result = ""

    if (x < 12) {
      result = angka[x]
    } else if (x < 20) {
      result = toWords(x - 10) + " belas"
    } else if (x < 100) {
      const tens = Math.floor(x / 10)
      const ones = x % 10
      result = toWords(tens) + " puluh" + (ones > 0 ? " " + toWords(ones) : "")
    } else if (x < 200) {
      result = "seratus" + (x > 100 ? " " + toWords(x - 100) : "")
    } else if (x < 1000) {
      const hundreds = Math.floor(x / 100)
      const rest = x % 100
      result = toWords(hundreds) + " ratus" + (rest > 0 ? " " + toWords(rest) : "")
    } else if (x < 2000) {
      result = "seribu" + (x > 1000 ? " " + toWords(x - 1000) : "")
    } else if (x < 1000000) {
      const thousands = Math.floor(x / 1000)
      const rest = x % 1000
      result = toWords(thousands) + " ribu" + (rest > 0 ? " " + toWords(rest) : "")
    } else if (x < 1000000000) {
      const millions = Math.floor(x / 1000000)
      const rest = x % 1000000
      result = toWords(millions) + " juta" + (rest > 0 ? " " + toWords(rest) : "")
    } else if (x < 1000000000000) {
      const billions = Math.floor(x / 1000000000)
      const rest = x % 1000000000
      result = toWords(billions) + " milyar" + (rest > 0 ? " " + toWords(rest) : "")
    } else {
      const trillions = Math.floor(x / 1000000000000)
      const rest = x % 1000000000000
      result = toWords(trillions) + " trilyun" + (rest > 0 ? " " + toWords(rest) : "")
    }

    return result.trim().replace(/\s+/g, " ")
  }

  return toWords(n) + " rupiah"
}
