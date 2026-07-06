export type ApartmentStatus = "available" | "reserved" | "rented";
export type ApartmentBrand = "Yaya STAY" | "Yaya FLEX";

export type Apartment = {
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
