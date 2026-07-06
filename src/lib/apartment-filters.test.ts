import { describe, expect, it } from "vitest";

import type { Apartment } from "@/lib/apartment";
import {
  addNumberOption,
  applyFilters,
  areFiltersEqual,
  clamp,
  createDefaultFilters,
  createHistogram,
  formatBathroomLabel,
  formatBedroomLabel,
  formatCurrency,
  getActiveFilterCount,
  getAvailabilityScopedApartments,
  getFilterBounds,
  getRangePercentage,
  getSortedUniqueValues,
  isBucketInRange,
  toSentenceCase,
  toggleNumberOption,
} from "@/lib/apartment-filters";

const apartments: Apartment[] = [
  {
    id: "studio-available",
    title: "estudio práctico",
    brand: "Yaya STAY",
    neighborhood: "Vallecas",
    status: "available",
    bedrooms: 0,
    bathrooms: 1,
    maxOccupancy: 1,
    sizeM2: 34,
    monthlyRent: 760,
    currency: "EUR",
    floorType: "2ª planta",
    isExterior: true,
    ageLabel: "+1 año",
    imageUrl: "https://example.com/studio.jpg",
  },
  {
    id: "one-bed-available",
    title: "apartamento con balcón",
    brand: "Yaya FLEX",
    neighborhood: "Retiro",
    status: "available",
    bedrooms: 1,
    bathrooms: 1,
    maxOccupancy: 2,
    sizeM2: 58,
    monthlyRent: 1760,
    currency: "EUR",
    floorType: "4ª planta",
    isExterior: true,
    ageLabel: "-1 año",
    imageUrl: "https://example.com/one-bed.jpg",
  },
  {
    id: "two-bed-available",
    title: "piso luminoso",
    brand: "Yaya STAY",
    neighborhood: "Chamberí",
    status: "available",
    bedrooms: 2,
    bathrooms: 2,
    maxOccupancy: 3,
    sizeM2: 80,
    monthlyRent: 2640,
    currency: "EUR",
    floorType: "ático",
    isExterior: true,
    ageLabel: "+1 año",
    imageUrl: "https://example.com/two-bed.jpg",
  },
  {
    id: "reserved-studio",
    title: "estudio reservado",
    brand: "Yaya STAY",
    neighborhood: "Usera",
    status: "reserved",
    bedrooms: 0,
    bathrooms: 1,
    maxOccupancy: 1,
    sizeM2: 32,
    monthlyRent: 720,
    currency: "EUR",
    floorType: "1ª planta",
    isExterior: false,
    ageLabel: "+1 año",
    imageUrl: "https://example.com/reserved.jpg",
  },
];

describe("apartment filters", () => {
  it("excludes unavailable apartments unless explicitly requested", () => {
    expect(
      getAvailabilityScopedApartments(apartments, false).map(
        (apartment) => apartment.id,
      ),
    ).toEqual(["studio-available", "one-bed-available", "two-bed-available"]);

    expect(getAvailabilityScopedApartments(apartments, true)).toHaveLength(4);
  });

  it("applies price, size, bedroom, and bathroom filters inclusively", () => {
    const bounds = getFilterBounds(apartments);
    const filters = {
      ...createDefaultFilters(bounds),
      price: { min: 700, max: 1760 },
      size: { min: 32, max: 58 },
      bedrooms: [0, 1],
      bathrooms: [1],
    };

    expect(
      applyFilters(apartments, filters).map((apartment) => apartment.id),
    ).toEqual(["studio-available", "one-bed-available", "reserved-studio"]);
  });

  it("calculates bounds, default filters, active filter counts, and equality", () => {
    const bounds = getFilterBounds(apartments);
    const defaultFilters = createDefaultFilters(bounds);
    const bedroomFiltered = { ...defaultFilters, bedrooms: [2] };
    const rangeAndBathroomFiltered = {
      ...defaultFilters,
      price: { min: 760, max: 1760 },
      bathrooms: [1, 2],
    };

    expect(bounds).toEqual({
      price: { min: 720, max: 2640 },
      size: { min: 32, max: 80 },
    });
    expect(getActiveFilterCount(defaultFilters, defaultFilters)).toBe(0);
    expect(getActiveFilterCount(bedroomFiltered, defaultFilters)).toBe(1);
    expect(getActiveFilterCount(rangeAndBathroomFiltered, defaultFilters)).toBe(
      2,
    );
    expect(areFiltersEqual(defaultFilters, { ...defaultFilters })).toBe(true);
    expect(areFiltersEqual(defaultFilters, bedroomFiltered)).toBe(false);
  });

  it("sorts, deduplicates, and toggles numeric options", () => {
    expect(getSortedUniqueValues([2, 0, 1, 2, 0])).toEqual([0, 1, 2]);
    expect(addNumberOption([2, 0], 1)).toEqual([0, 1, 2]);
    expect(addNumberOption([0, 1], 1)).toEqual([0, 1]);
    expect(toggleNumberOption([0, 1], 1)).toEqual([0]);
    expect(toggleNumberOption([0, 2], 1)).toEqual([0, 1, 2]);
  });

  it("creates histogram buckets and detects range overlap", () => {
    const histogram = createHistogram(
      [0, 25, 50, 75, 100],
      { min: 0, max: 100 },
      4,
    );

    expect(histogram.map((bucket) => bucket.count)).toEqual([1, 1, 1, 2]);
    expect(histogram[0]).toMatchObject({ label: "1", min: 0, max: 25 });
    expect(histogram[3]).toMatchObject({ label: "4", min: 75, max: 100 });
    expect(isBucketInRange(histogram[1], { min: 20, max: 40 })).toBe(true);
    expect(isBucketInRange(histogram[3], { min: 20, max: 40 })).toBe(false);
  });

  it("formats labels and helper values for the listing UI", () => {
    expect(clamp(120, 0, 100)).toBe(100);
    expect(getRangePercentage(50, { min: 0, max: 200 })).toBe(25);
    expect(getRangePercentage(10, { min: 10, max: 10 })).toBe(0);
    expect(formatCurrency(1234.4)).toBe("1.234 €");
    expect(formatBedroomLabel(0)).toBe("Estudio");
    expect(formatBedroomLabel(1)).toBe("1 dormitorio");
    expect(formatBedroomLabel(3)).toBe("3 dormitorios");
    expect(formatBathroomLabel(1)).toBe("1 baño");
    expect(formatBathroomLabel(2)).toBe("2 baños");
    expect(toSentenceCase("piso luminoso")).toBe("Piso luminoso");
  });
});
