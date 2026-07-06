import { readFile } from "node:fs/promises";
import path from "node:path";
import type { ReactNode } from "react";

type ApartmentStatus = "available" | "reserved" | "rented";
type ApartmentBrand = "Yaya STAY" | "Yaya FLEX";

type Apartment = {
  id: string;
  title: string;
  brand: ApartmentBrand;
  neighborhood: string;
  status: ApartmentStatus;
  bedrooms: number;
  bathrooms: number;
  maxOccupancy: number;
  sizeM2: number;
  monthlyRent: number;
  currency: string;
  floorType: string;
  isExterior: boolean;
  ageLabel: string;
  imageUrl: string;
};

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
        <section className="listing-panel" aria-labelledby="listing-title">
          <div className="listing-toolbar">
            <h1 id="listing-title" className="listing-title">
              <strong>{apartments.length} alquileres</strong>
              <span> en Madrid</span>
            </h1>

            <div className="listing-actions" aria-label="Controles de listado">
              <span className="availability-control" aria-disabled="true">
                <span>Mostrar no disponibles</span>
                <span className="switch-track" aria-hidden="true">
                  <span className="switch-thumb" />
                </span>
              </span>

              <button className="filter-button" type="button" disabled>
                <SlidersIcon />
                Filtros
              </button>
            </div>
          </div>

          <div className="property-grid">
            {apartments.map((apartment) => (
              <PropertyCard key={apartment.id} apartment={apartment} />
            ))}
          </div>
        </section>
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

function PropertyCard({ apartment }: { apartment: Apartment }) {
  const isAvailable = apartment.status === "available";
  const displayTitle = toSentenceCase(apartment.title);
  const imageStyle = {
    backgroundImage: `linear-gradient(180deg, rgba(0, 0, 0, 0.02) 35%, rgba(0, 0, 0, 0.14) 100%), url("${apartment.imageUrl}")`,
  };

  return (
    <article
      className="property-card"
      aria-labelledby={`property-title-${apartment.id}`}
    >
      <div
        className="property-card__image"
        style={imageStyle}
        role="img"
        aria-label={`${displayTitle} en ${apartment.neighborhood}, ${apartment.isExterior ? "exterior" : "interior"}`}
      >
        <div className="property-card__badges" aria-label="Características">
          <span
            className={`badge badge--age ${apartment.ageLabel.startsWith("-") ? "badge--new" : "badge--seasoned"}`}
          >
            {apartment.ageLabel}
          </span>
          <span
            className={`badge badge--status ${isAvailable ? "badge--available" : "badge--unavailable"}`}
          >
            {isAvailable ? (
              <span className="badge__dot" aria-hidden="true" />
            ) : null}
            {isAvailable ? "Disponible" : "No disponible"}
          </span>
          {apartment.floorType.toLowerCase().includes("ático") ? (
            <span className="badge badge--neutral">Ático</span>
          ) : apartment.ageLabel.startsWith("-") ? (
            <span className="badge badge--neutral">Nuevo</span>
          ) : null}
        </div>
      </div>

      <div className="property-card__content">
        <p className="property-card__eyebrow">
          <BrandLabel brand={apartment.brand} />
          <span className="property-card__neighborhood">
            {apartment.neighborhood}
          </span>
        </p>

        <h2
          id={`property-title-${apartment.id}`}
          className="property-card__title"
        >
          {displayTitle}
        </h2>

        <div className="amenities" aria-label="Datos del inmueble">
          <Amenity icon={<BedIcon />} value={`Máx ${apartment.maxOccupancy}`} />
          <Amenity icon={<BathIcon />} value={apartment.bathrooms.toString()} />
          <Amenity icon={<SizeIcon />} value={`± ${apartment.sizeM2}`} />
        </div>

        <button
          className="details-button"
          type="button"
          aria-label={`Ver detalles y alquilar ${displayTitle}`}
        >
          Detalles y alquilar
        </button>
      </div>
    </article>
  );
}

function BrandLabel({ brand }: { brand: ApartmentBrand }) {
  const [name, product] = brand.split(" ");
  const brandClass = product === "FLEX" ? "brand--flex" : "brand--stay";

  return (
    <span className={`brand-label ${brandClass}`}>
      {name} <strong>{product}</strong>
    </span>
  );
}

function Amenity({ icon, value }: { icon: ReactNode; value: string }) {
  return (
    <div className="amenity">
      <span className="amenity__icon" aria-hidden="true">
        {icon}
      </span>
      <span className="amenity__value">{value}</span>
    </div>
  );
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

function toSentenceCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function SlidersIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="filter-button__icon">
      <path d="M4 6h2.2" />
      <path d="M10 6h6" />
      <circle cx="8" cy="6" r="1.8" />
      <path d="M4 14h6" />
      <path d="M13.8 14H16" />
      <circle cx="12" cy="14" r="1.8" />
    </svg>
  );
}

function BedIcon() {
  return (
    <svg viewBox="0 0 28 22" aria-hidden="true">
      <path d="M3 5.5v12" />
      <path d="M25 11.5v6" />
      <path d="M3 12h22" />
      <path d="M6 9.5h5.8c1 0 1.7.8 1.7 1.7v.8H6z" />
      <path d="M15 9.5h5.8c1 0 1.7.8 1.7 1.7v.8H15z" />
      <path d="M3 17.5h22" />
    </svg>
  );
}

function BathIcon() {
  return (
    <svg viewBox="0 0 28 22" aria-hidden="true">
      <path d="M6 10.5V5.9A2.9 2.9 0 0 1 8.9 3h.4A2.7 2.7 0 0 1 12 5.7" />
      <path d="M4 10.5h20v2.3a5.2 5.2 0 0 1-5.2 5.2H9.2A5.2 5.2 0 0 1 4 12.8z" />
      <path d="M8 18v2" />
      <path d="M20 18v2" />
      <path d="M11 6.6h3.6" />
    </svg>
  );
}

function SizeIcon() {
  return (
    <span className="size-icon" aria-hidden="true">
      m<sup>2</sup>
    </span>
  );
}
