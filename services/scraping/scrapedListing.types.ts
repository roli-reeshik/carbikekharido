export interface ScrapedListing {
  externalId: string;
  sourceWebsite: "olx";
  title: string;
  priceInr: number;
  imageUrls: string[];
  location: string;
  mileage?: string;
  condition?: string;
  sellerName?: string;
  listingUrl: string;
  city: string;
  category: "cars" | "bikes";
}

export interface ScrapedListingWithImages extends ScrapedListing {
  publicImageUrls: string[];
  thumbnailUrls: string[];
}
