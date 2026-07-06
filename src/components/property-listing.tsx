"use client";

import { useMemo, useState } from "react";
import type { CSSProperties, Dispatch, ReactNode, SetStateAction } from "react";
import { Bar, BarChart, Cell, XAxis, YAxis } from "recharts";

import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
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
  type FilterBounds,
  type FilterState,
  type HistogramBucket,
  type RangeValue,
} from "@/lib/apartment-filters";

const PRICE_CHART_CONFIG = {
  count: {
    label: "Inmuebles",
    color: "#20201e",
  },
} satisfies ChartConfig;

export function PropertyListing({ apartments }: { apartments: Apartment[] }) {
  const bounds = useMemo(() => getFilterBounds(apartments), [apartments]);
  const defaultFilters = useMemo(() => createDefaultFilters(bounds), [bounds]);
  const bedroomOptions = useMemo(
    () =>
      getSortedUniqueValues(apartments.map((apartment) => apartment.bedrooms)),
    [apartments],
  );
  const bathroomOptions = useMemo(
    () =>
      getSortedUniqueValues(apartments.map((apartment) => apartment.bathrooms)),
    [apartments],
  );
  const [showUnavailable, setShowUnavailable] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState(defaultFilters);
  const [stagedFilters, setStagedFilters] = useState(defaultFilters);

  const availabilityScopedApartments = useMemo(
    () => getAvailabilityScopedApartments(apartments, showUnavailable),
    [apartments, showUnavailable],
  );
  const priceHistogram = useMemo(
    () =>
      createHistogram(
        availabilityScopedApartments.map((apartment) => apartment.monthlyRent),
        bounds.price,
        18,
      ),
    [availabilityScopedApartments, bounds.price],
  );
  const filteredApartments = useMemo(
    () => applyFilters(availabilityScopedApartments, activeFilters),
    [availabilityScopedApartments, activeFilters],
  );
  const previewCount = useMemo(
    () => applyFilters(availabilityScopedApartments, stagedFilters).length,
    [availabilityScopedApartments, stagedFilters],
  );
  const activeFilterCount = getActiveFilterCount(activeFilters, defaultFilters);
  const hasPendingChanges = !areFiltersEqual(stagedFilters, activeFilters);

  function handleToggleFilters() {
    if (isFilterOpen) {
      setIsFilterOpen(false);
      return;
    }

    setStagedFilters(activeFilters);
    setIsFilterOpen(true);
  }

  function handleApplyFilters() {
    if (!hasPendingChanges || previewCount === 0) {
      return;
    }

    setActiveFilters(stagedFilters);
    setIsFilterOpen(false);
  }

  function handleResetFilters() {
    setStagedFilters(defaultFilters);
    setActiveFilters(defaultFilters);
  }

  return (
    <section className="listing-panel" aria-labelledby="listing-title">
      <div className="listing-toolbar">
        <h1 id="listing-title" className="listing-title">
          <strong>{filteredApartments.length} alquileres</strong>
          <span> en Madrid</span>
        </h1>

        <div className="listing-actions" aria-label="Controles de listado">
          <button
            className={`availability-control ${showUnavailable ? "availability-control--enabled" : ""}`}
            type="button"
            role="switch"
            aria-checked={showUnavailable}
            onClick={() => setShowUnavailable((currentValue) => !currentValue)}
          >
            <span>Mostrar no disponibles</span>
            <span className="switch-track" aria-hidden="true">
              <span className="switch-thumb" />
            </span>
          </button>

          <button
            className={`filter-button ${activeFilterCount > 0 ? "filter-button--active" : ""}`}
            type="button"
            aria-controls="filters-panel"
            aria-expanded={isFilterOpen}
            onClick={handleToggleFilters}
          >
            <SlidersIcon />
            Filtros
            {activeFilterCount > 0 ? (
              <span className="filter-button__count">{activeFilterCount}</span>
            ) : null}
          </button>
        </div>

        {isFilterOpen ? (
          <FilterPanel
            id="filters-panel"
            apartments={availabilityScopedApartments}
            bounds={bounds}
            bedroomOptions={bedroomOptions}
            bathroomOptions={bathroomOptions}
            activeFilters={activeFilters}
            defaultFilters={defaultFilters}
            stagedFilters={stagedFilters}
            priceHistogram={priceHistogram}
            previewCount={previewCount}
            hasPendingChanges={hasPendingChanges}
            onApply={handleApplyFilters}
            onClose={() => setIsFilterOpen(false)}
            onReset={handleResetFilters}
            onStageChange={setStagedFilters}
          />
        ) : null}
      </div>

      {filteredApartments.length > 0 ? (
        <div className="property-grid">
          {filteredApartments.map((apartment) => (
            <PropertyCard key={apartment.id} apartment={apartment} />
          ))}
        </div>
      ) : (
        <div className="empty-state" role="status">
          <strong>No hay inmuebles con estos filtros.</strong>
          <span>
            Prueba a ampliar el rango de precio, tamaño o habitaciones.
          </span>
        </div>
      )}
    </section>
  );
}

function FilterPanel({
  id,
  apartments,
  bounds,
  bedroomOptions,
  bathroomOptions,
  activeFilters,
  defaultFilters,
  stagedFilters,
  priceHistogram,
  previewCount,
  hasPendingChanges,
  onApply,
  onClose,
  onReset,
  onStageChange,
}: {
  id: string;
  apartments: Apartment[];
  bounds: FilterBounds;
  bedroomOptions: number[];
  bathroomOptions: number[];
  activeFilters: FilterState;
  defaultFilters: FilterState;
  stagedFilters: FilterState;
  priceHistogram: HistogramBucket[];
  previewCount: number;
  hasPendingChanges: boolean;
  onApply: () => void;
  onClose: () => void;
  onReset: () => void;
  onStageChange: Dispatch<SetStateAction<FilterState>>;
}) {
  const canApply = hasPendingChanges && previewCount > 0;
  const hasAnyAppliedFilter =
    getActiveFilterCount(activeFilters, defaultFilters) > 0;

  function updatePrice(price: RangeValue) {
    onStageChange((filters) => ({ ...filters, price }));
  }

  function updateSize(size: RangeValue) {
    onStageChange((filters) => ({ ...filters, size }));
  }

  function toggleBedroom(value: number) {
    onStageChange((filters) => ({
      ...filters,
      bedrooms: toggleNumberOption(filters.bedrooms, value),
    }));
  }

  function toggleBathroom(value: number) {
    onStageChange((filters) => ({
      ...filters,
      bathrooms: toggleNumberOption(filters.bathrooms, value),
    }));
  }

  function wouldHaveResults(nextFilters: FilterState) {
    return applyFilters(apartments, nextFilters).length > 0;
  }

  return (
    <div
      id={id}
      className="filter-popover"
      role="dialog"
      aria-modal="false"
      aria-labelledby="filters-title"
    >
      <div className="filter-popover__header">
        <h2 id="filters-title">Filtros</h2>
        <button
          className="filter-close-button"
          type="button"
          aria-label="Cerrar filtros"
          onClick={onClose}
        >
          ×
        </button>
      </div>

      <RangeFilter
        label="Precio"
        value={stagedFilters.price}
        bounds={bounds.price}
        step={10}
        formatValue={formatCurrency}
        onChange={updatePrice}
        histogram={priceHistogram}
      />

      <RangeFilter
        label="Tamaño"
        value={stagedFilters.size}
        bounds={bounds.size}
        step={1}
        formatValue={(value) => `${value} m²`}
        onChange={updateSize}
      />

      <FilterCheckboxGroup
        legend="Habitaciones"
        options={bedroomOptions}
        selectedOptions={stagedFilters.bedrooms}
        formatLabel={formatBedroomLabel}
        isOptionDisabled={(option) =>
          !stagedFilters.bedrooms.includes(option) &&
          !wouldHaveResults({
            ...stagedFilters,
            bedrooms: addNumberOption(stagedFilters.bedrooms, option),
          })
        }
        onToggle={toggleBedroom}
      />

      <FilterCheckboxGroup
        legend="Baños"
        options={bathroomOptions}
        selectedOptions={stagedFilters.bathrooms}
        formatLabel={formatBathroomLabel}
        isOptionDisabled={(option) =>
          !stagedFilters.bathrooms.includes(option) &&
          !wouldHaveResults({
            ...stagedFilters,
            bathrooms: addNumberOption(stagedFilters.bathrooms, option),
          })
        }
        onToggle={toggleBathroom}
      />

      <div className="filter-summary" aria-live="polite">
        {previewCount === 0
          ? "Sin resultados con esta combinación"
          : `${previewCount} ${previewCount === 1 ? "resultado" : "resultados"}`}
      </div>

      <button
        className="filter-apply-button"
        type="button"
        disabled={!canApply}
        onClick={onApply}
      >
        Aplicar filtros
      </button>

      <button
        className="filter-reset-button"
        type="button"
        disabled={
          !hasAnyAppliedFilter && areFiltersEqual(stagedFilters, defaultFilters)
        }
        onClick={onReset}
      >
        reset
      </button>
    </div>
  );
}

function RangeFilter({
  label,
  value,
  bounds,
  step,
  formatValue,
  histogram,
  onChange,
}: {
  label: string;
  value: RangeValue;
  bounds: RangeValue;
  step: number;
  formatValue: (value: number) => string;
  histogram?: HistogramBucket[];
  onChange: (value: RangeValue) => void;
}) {
  return (
    <fieldset className="filter-section range-filter">
      <div className="filter-section__header">
        <legend>{label}</legend>
        <output>
          {formatValue(value.min)} – {formatValue(value.max)}
        </output>
      </div>

      {histogram ? <PriceHistogram data={histogram} range={value} /> : null}

      <RangeSlider
        label={label}
        value={value}
        bounds={bounds}
        step={step}
        onChange={onChange}
      />
    </fieldset>
  );
}

function PriceHistogram({
  data,
  range,
}: {
  data: HistogramBucket[];
  range: RangeValue;
}) {
  return (
    <ChartContainer
      config={PRICE_CHART_CONFIG}
      className="price-histogram"
      initialDimension={{ width: 260, height: 70 }}
    >
      <BarChart
        data={data}
        margin={{ top: 4, right: 2, bottom: 0, left: 2 }}
        barCategoryGap={3}
      >
        <XAxis dataKey="label" hide />
        <YAxis hide />
        <Bar dataKey="count" radius={[2, 2, 0, 0]} isAnimationActive={false}>
          {data.map((bucket) => (
            <Cell
              key={`${bucket.min}-${bucket.max}`}
              fill={isBucketInRange(bucket, range) ? "#20201e" : "#d8d8d4"}
            />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}

function RangeSlider({
  label,
  value,
  bounds,
  step,
  onChange,
}: {
  label: string;
  value: RangeValue;
  bounds: RangeValue;
  step: number;
  onChange: (value: RangeValue) => void;
}) {
  const start = getRangePercentage(value.min, bounds);
  const end = getRangePercentage(value.max, bounds);
  const style = {
    "--range-start": `${start}%`,
    "--range-end": `${end}%`,
  } as CSSProperties;

  function handleMinChange(nextValue: number) {
    onChange({
      min: clamp(nextValue, bounds.min, value.max),
      max: value.max,
    });
  }

  function handleMaxChange(nextValue: number) {
    onChange({
      min: value.min,
      max: clamp(nextValue, value.min, bounds.max),
    });
  }

  return (
    <div className="range-slider" style={style}>
      <span className="range-slider__track" aria-hidden="true" />
      <input
        className="range-slider__input range-slider__input--min"
        type="range"
        min={bounds.min}
        max={bounds.max}
        step={step}
        value={value.min}
        aria-label={`${label} mínimo`}
        onChange={(event) => handleMinChange(Number(event.target.value))}
      />
      <input
        className="range-slider__input range-slider__input--max"
        type="range"
        min={bounds.min}
        max={bounds.max}
        step={step}
        value={value.max}
        aria-label={`${label} máximo`}
        onChange={(event) => handleMaxChange(Number(event.target.value))}
      />
    </div>
  );
}

function FilterCheckboxGroup({
  legend,
  options,
  selectedOptions,
  formatLabel,
  isOptionDisabled,
  onToggle,
}: {
  legend: string;
  options: number[];
  selectedOptions: number[];
  formatLabel: (value: number) => string;
  isOptionDisabled: (value: number) => boolean;
  onToggle: (value: number) => void;
}) {
  return (
    <fieldset className="filter-section filter-checkbox-group">
      <legend>{legend}</legend>
      <div className="filter-checkbox-group__options">
        {options.map((option) => {
          const checked = selectedOptions.includes(option);
          const disabled = isOptionDisabled(option);

          return (
            <label
              key={option}
              className={`filter-checkbox ${disabled ? "filter-checkbox--disabled" : ""}`}
            >
              <input
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={() => onToggle(option)}
              />
              <span className="filter-checkbox__box" aria-hidden="true" />
              <span>{formatLabel(option)}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function PropertyCard({ apartment }: { apartment: Apartment }) {
  const isAvailable = apartment.status === "available";
  const displayTitle = toSentenceCase(apartment.title);
  const imageStyle = {
    backgroundImage: `linear-gradient(180deg, rgba(0, 0, 0, 0.02) 35%, rgba(0, 0, 0, 0.14) 100%), url("${apartment.imageUrl}")`,
  } as CSSProperties;

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

function BrandLabel({ brand }: { brand: string }) {
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
    <svg viewBox="-0.75 -0.75 28.5 15" aria-hidden="true">
      <path d="M0 1.35V13.5" />
      <circle cx="6.75" cy="2.7" r="2.7" />
      <path d="M13.5 9.45V5.4a2.7 2.7 0 0 1 2.7-2.7h8.1a2.7 2.7 0 0 1 2.7 2.7v4.05" />
      <path d="M0 9.45h27" />
      <path d="M27 9.45V13.5" />
    </svg>
  );
}

function BathIcon() {
  return (
    <svg viewBox="-0.75 -0.75 26.5 24" aria-hidden="true">
      <path d="M8.75 3.75 5.63 0.63a1.88 1.88 0 0 0-1.25-.63C3.35 0 2.5.85 2.5 1.88V17.5a2.5 2.5 0 0 0 2.5 2.5H20a2.5 2.5 0 0 0 2.5-2.5V15" />
      <path d="M10 2.5 7.5 5" />
      <path d="M0 11.25H25" />
      <path d="M6.25 20v2.5" />
      <path d="M18.75 20v2.5" />
    </svg>
  );
}

function SizeIcon() {
  return (
    <svg className="size-icon" viewBox="-0.75 -2 23 24" aria-hidden="true">
      <path d="M13 0H5A5 5 0 0 0 0 5V16A5 5 0 0 0 5 21H16A5 5 0 0 0 21 16V8" />
      <text x="9.5" y="14.5" textAnchor="middle" fontSize="13">
        m
      </text>
      <text x="17.5" y="4" textAnchor="middle" fontSize="8">
        2
      </text>
    </svg>
  );
}
