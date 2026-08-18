import { SellFieldErrors, SellListingDraft, SellStep } from "./types";

const CURRENT_YEAR = new Date().getFullYear();

export function validateStep1(draft: SellListingDraft): SellFieldErrors {
  const errors: SellFieldErrors = {};

  if (!draft.registrationNumber.trim()) {
    errors.registrationNumber = "Registration number is required";
  }
  if (!draft.brand.trim()) errors.brand = "Brand is required";
  if (!draft.model.trim()) errors.model = "Model is required";
  if (!draft.bodyType.trim()) errors.bodyType = "Body type is required";
  if (!draft.fuelType.trim()) errors.fuelType = "Fuel type is required";
  if (!draft.transmission.trim()) errors.transmission = "Transmission is required";

  const year = Number(draft.yearOfManufacture);
  if (!draft.yearOfManufacture) {
    errors.yearOfManufacture = "Year is required";
  } else if (year < 1990 || year > CURRENT_YEAR + 1) {
    errors.yearOfManufacture = `Year must be between 1990 and ${CURRENT_YEAR + 1}`;
  }

  const mileage = Number(draft.currentMileage);
  if (draft.currentMileage === "") {
    errors.currentMileage = "Mileage is required";
  } else if (mileage < 0 || mileage > 999999) {
    errors.currentMileage = "Enter a valid mileage (0–9,99,999 km)";
  }

  if (!draft.ownerType) errors.ownerType = "Owner type is required";
  if (!draft.condition) errors.condition = "Condition is required";

  if (draft.insuranceValid && !draft.insuranceValidTill) {
    errors.insuranceValidTill = "Insurance expiry date is required";
  }
  if (draft.pollutionCertValid && !draft.pollutionCertValidTill) {
    errors.pollutionCertValidTill = "PUC expiry date is required";
  }

  if (draft.accidentHistory !== "none" && !draft.accidentDescription.trim()) {
    errors.accidentDescription = "Please describe the accident history";
  }
  if (draft.hasModifications && !draft.modifications.trim()) {
    errors.modifications = "Please describe modifications";
  }

  const price = Number(draft.askingPrice.replace(/,/g, ""));
  if (!draft.askingPrice) {
    errors.askingPrice = "Asking price is required";
  } else if (price < 10000 || price > 999999999) {
    errors.askingPrice = "Enter a valid price (₹10,000 – ₹99,99,99,999)";
  }

  if (!draft.city.trim()) errors.city = "City is required";
  if (!draft.state.trim()) errors.state = "State is required";

  return errors;
}

export function validateStep2(draft: SellListingDraft): SellFieldErrors {
  const photos = draft.media.filter((m) => m.type === "photo");
  if (photos.length < 5) {
    return { media: `Add at least 5 photos (${photos.length}/5)` };
  }
  return {};
}

export function validateStep3(draft: SellListingDraft): SellFieldErrors {
  const errors: SellFieldErrors = {};

  if (!draft.sellerName.trim()) errors.sellerName = "Name is required";

  const phone = draft.phone.replace(/\D/g, "");
  if (!/^[6-9]\d{9}$/.test(phone)) {
    errors.phone = "Enter a valid 10-digit mobile number";
  } else if (!draft.phoneVerified) {
    errors.phone = "Verify your phone number with OTP";
  }

  if (draft.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email)) {
    errors.email = "Enter a valid email address";
  }

  if (!draft.contactCall && !draft.contactWhatsApp && !draft.contactEmail) {
    errors.contactCall = "Select at least one contact method";
  }

  if (draft.sellerType === "DEALER") {
    if (!draft.dealerName.trim()) errors.dealerName = "Dealer name is required";
    if (!draft.dealerRegNumber.trim()) {
      errors.dealerRegNumber = "Dealer registration number is required";
    }
  }

  return errors;
}

export function validateStep4(draft: SellListingDraft): SellFieldErrors {
  if (!draft.termsAccepted) {
    return { termsAccepted: "You must accept the terms to publish" };
  }
  return {};
}

export function validateStep(step: SellStep, draft: SellListingDraft): SellFieldErrors {
  switch (step) {
    case 1:
      return validateStep1(draft);
    case 2:
      return validateStep2(draft);
    case 3:
      return validateStep3(draft);
    case 4:
      return validateStep4(draft);
    default:
      return {};
  }
}

export function hasErrors(errors: SellFieldErrors): boolean {
  return Object.keys(errors).length > 0;
}
