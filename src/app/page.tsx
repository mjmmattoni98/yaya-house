import { readFile } from "node:fs/promises";
import path from "node:path";

import { PropertyListing } from "@/components/property-listing";
import type {
  Apartment,
  ApartmentBrand,
  ApartmentStatus,
} from "@/lib/apartment";

type CsvRecord = Record<string, string>;

const DATA_FILE = path.join(process.cwd(), "sre-ai-coding-test-data.csv");

const PROPERTY_IMAGES = [
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1560185127-6ed189bf02f4?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=900&q=80",
] as const;

export default async function Home() {
  const apartments = await getApartments();

  return (
    <>
      <header className="app-header">
        <span className="app-logo">Yaya House</span>
      </header>

      <main className="app-main">
        <PropertyListing apartments={apartments} />
      </main>
    </>
  );
}

async function getApartments(): Promise<Apartment[]> {
  const csv = await readFile(DATA_FILE, "utf8");

  return parseCsv(csv).map((record, index) => ({
    id: record.id,
    title: record.title,
    brand: normalizeBrand(record.brand),
    neighborhood: record.neighborhood,
    status: normalizeStatus(record.status),
    bedrooms: Number(record.bedrooms),
    bathrooms: Number(record.bathrooms),
    maxOccupancy: Number(record.max_occupancy),
    sizeM2: Number(record.size_m2),
    monthlyRent: Number(record.monthly_rent),
    currency: record.currency,
    floorType: record.floor_type,
    isExterior: record.is_exterior === "true",
    ageLabel: record.age_label,
    imageUrl: PROPERTY_IMAGES[index % PROPERTY_IMAGES.length],
  }));
}

function parseCsv(input: string): CsvRecord[] {
  const rows = input.trim().split(/\r?\n/).filter(Boolean);
  const headers = splitCsvLine(rows[0]);

  return rows.slice(1).map((row) => {
    const values = splitCsvLine(row);

    return headers.reduce<CsvRecord>((record, header, index) => {
      record[header] = values[index] ?? "";
      return record;
    }, {});
  });
}

function splitCsvLine(line: string): string[] {
  const values: string[] = [];
  let value = "";
  let insideQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const nextChar = line[index + 1];

    if (char === '"' && insideQuotes && nextChar === '"') {
      value += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      insideQuotes = !insideQuotes;
      continue;
    }

    if (char === "," && !insideQuotes) {
      values.push(value);
      value = "";
      continue;
    }

    value += char;
  }

  values.push(value);
  return values;
}

function normalizeBrand(brand: string): ApartmentBrand {
  return brand === "Yaya FLEX" ? "Yaya FLEX" : "Yaya STAY";
}

function normalizeStatus(status: string): ApartmentStatus {
  if (status === "reserved" || status === "rented") {
    return status;
  }

  return "available";
}
