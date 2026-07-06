import type { Apartment } from "@/lib/apartment";

export type RangeValue = {
  min: number;
  max: number;
};

export type FilterState = {
  price: RangeValue;
  size: RangeValue;
  bedrooms: number[];
  bathrooms: number[];
};

export type HistogramBucket = {
  label: string;
  min: number;
  max: number;
  count: number;
};

export type FilterBounds = {
  price: RangeValue;
  size: RangeValue;
};

export function getAvailabilityScopedApartments(
  apartments: Apartment[],
  showUnavailable: boolean,
) {
  if (showUnavailable) {
    return apartments;
  }

  return apartments.filter((apartment) => apartment.status === "available");
}

export function applyFilters(apartments: Apartment[], filters: FilterState) {
  return apartments.filter((apartment) => {
    const matchesPrice =
      apartment.monthlyRent >= filters.price.min &&
      apartment.monthlyRent <= filters.price.max;
    const matchesSize =
      apartment.sizeM2 >= filters.size.min &&
      apartment.sizeM2 <= filters.size.max;
    const matchesBedrooms =
      filters.bedrooms.length === 0 ||
      filters.bedrooms.includes(apartment.bedrooms);
    const matchesBathrooms =
      filters.bathrooms.length === 0 ||
      filters.bathrooms.includes(apartment.bathrooms);

    return matchesPrice && matchesSize && matchesBedrooms && matchesBathrooms;
  });
}

export function getFilterBounds(apartments: Apartment[]): FilterBounds {
  return {
    price: getBounds(apartments.map((apartment) => apartment.monthlyRent)),
    size: getBounds(apartments.map((apartment) => apartment.sizeM2)),
  };
}

export function createDefaultFilters(bounds: FilterBounds): FilterState {
  return {
    price: bounds.price,
    size: bounds.size,
    bedrooms: [],
    bathrooms: [],
  };
}

export function getActiveFilterCount(
  filters: FilterState,
  defaultFilters: FilterState,
) {
  let count = 0;

  if (!areRangesEqual(filters.price, defaultFilters.price)) {
    count += 1;
  }

  if (!areRangesEqual(filters.size, defaultFilters.size)) {
    count += 1;
  }

  if (filters.bedrooms.length > 0) {
    count += 1;
  }

  if (filters.bathrooms.length > 0) {
    count += 1;
  }

  return count;
}

export function areFiltersEqual(first: FilterState, second: FilterState) {
  return (
    areRangesEqual(first.price, second.price) &&
    areRangesEqual(first.size, second.size) &&
    areNumberListsEqual(first.bedrooms, second.bedrooms) &&
    areNumberListsEqual(first.bathrooms, second.bathrooms)
  );
}

export function getSortedUniqueValues(values: number[]) {
  return Array.from(new Set(values)).sort((first, second) => first - second);
}

export function toggleNumberOption(values: number[], option: number) {
  if (values.includes(option)) {
    return values.filter((value) => value !== option);
  }

  return addNumberOption(values, option);
}

export function addNumberOption(values: number[], option: number) {
  return Array.from(new Set([...values, option])).sort(
    (first, second) => first - second,
  );
}

export function createHistogram(
  values: number[],
  bounds: RangeValue,
  bucketCount: number,
): HistogramBucket[] {
  const span = Math.max(bounds.max - bounds.min, 1);
  const bucketSize = span / bucketCount;
  const buckets = Array.from({ length: bucketCount }, (_, index) => ({
    label: String(index + 1),
    min: Math.round(bounds.min + bucketSize * index),
    max:
      index === bucketCount - 1
        ? bounds.max
        : Math.round(bounds.min + bucketSize * (index + 1)),
    count: 0,
  }));

  values.forEach((value) => {
    const bucketIndex = Math.min(
      bucketCount - 1,
      Math.max(0, Math.floor(((value - bounds.min) / span) * bucketCount)),
    );
    buckets[bucketIndex].count += 1;
  });

  return buckets;
}

export function isBucketInRange(bucket: HistogramBucket, range: RangeValue) {
  return bucket.max >= range.min && bucket.min <= range.max;
}

export function getRangePercentage(value: number, bounds: RangeValue) {
  if (bounds.max === bounds.min) {
    return 0;
  }

  return ((value - bounds.min) / (bounds.max - bounds.min)) * 100;
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function formatCurrency(value: number) {
  return `${formatNumber(value)} €`;
}

export function formatNumber(value: number) {
  return Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function formatBedroomLabel(value: number) {
  if (value === 0) {
    return "Estudio";
  }

  return `${value} ${value === 1 ? "dormitorio" : "dormitorios"}`;
}

export function formatBathroomLabel(value: number) {
  return `${value} ${value === 1 ? "baño" : "baños"}`;
}

export function toSentenceCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getBounds(values: number[]): RangeValue {
  if (values.length === 0) {
    return { min: 0, max: 0 };
  }

  return {
    min: Math.min(...values),
    max: Math.max(...values),
  };
}

function areRangesEqual(first: RangeValue, second: RangeValue) {
  return first.min === second.min && first.max === second.max;
}

function areNumberListsEqual(first: number[], second: number[]) {
  return (
    first.length === second.length &&
    first.every((value) => second.includes(value))
  );
}
