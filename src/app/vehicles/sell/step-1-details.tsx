"use client";

import { useSellListing } from "@/lib/sell/SellListingProvider";
import { FieldErrorsSummary, FormField, FormSection, inputClass } from "@/lib/sell/components/FormField";
import { VehicleTypeChoice } from "@/lib/sell/types";

const BODY_TYPES_CAR = ["Hatchback", "Sedan", "SUV", "MUV", "Luxury"];
const BODY_TYPES_BIKE = ["Commuter", "Sports", "Scooter", "Cruiser", "Adventure"];

export default function Step1Details() {
  const { draft, errors, setField, goNext, goBack } = useSellListing();
  const bodyTypes = draft.vehicleType === "BIKE" ? BODY_TYPES_BIKE : BODY_TYPES_CAR;

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="font-display text-2xl font-bold text-sell-primary">Vehicle details</h1>
        <p className="mt-1 text-sm text-ink/55">Tell buyers everything about your vehicle.</p>
      </div>

      <FieldErrorsSummary errors={errors} />

      <FormSection title="Vehicle identification" description="Basic info buyers search for first.">
        <div className="flex gap-2">
          {(["CAR", "BIKE"] as VehicleTypeChoice[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setField("vehicleType", type)}
              className={`flex-1 rounded-lg border px-4 py-3 text-sm font-semibold transition ${
                draft.vehicleType === type
                  ? "border-sell-primary bg-sell-primary text-white"
                  : "border-line bg-white text-ink/70 hover:border-sell-primary/40"
              }`}
            >
              {type === "CAR" ? "🚗 Car" : "🏍️ Bike"}
            </button>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Brand" name="brand" required error={errors.brand}>
            <input
              id="brand"
              name="brand"
              value={draft.brand}
              onChange={(e) => setField("brand", e.target.value)}
              className={inputClass(errors.brand)}
              placeholder="e.g. Maruti Suzuki"
            />
          </FormField>
          <FormField label="Model" name="model" required error={errors.model}>
            <input
              id="model"
              name="model"
              value={draft.model}
              onChange={(e) => setField("model", e.target.value)}
              className={inputClass(errors.model)}
              placeholder="e.g. Swift VXi"
            />
          </FormField>
        </div>

        <FormField label="Registration number" name="registrationNumber" required error={errors.registrationNumber}>
          <input
            id="registrationNumber"
            name="registrationNumber"
            value={draft.registrationNumber}
            onChange={(e) => setField("registrationNumber", e.target.value.toUpperCase())}
            className={`${inputClass(errors.registrationNumber)} font-spec uppercase`}
            placeholder="UP 32 AB 1234"
          />
        </FormField>
      </FormSection>

      <FormSection title="Technical specifications">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Body type" name="bodyType" required error={errors.bodyType}>
            <select
              id="bodyType"
              value={draft.bodyType}
              onChange={(e) => setField("bodyType", e.target.value)}
              className={inputClass(errors.bodyType)}
            >
              <option value="">Select</option>
              {bodyTypes.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Fuel type" name="fuelType" required error={errors.fuelType}>
            <select
              id="fuelType"
              value={draft.fuelType}
              onChange={(e) => setField("fuelType", e.target.value)}
              className={inputClass(errors.fuelType)}
            >
              <option value="petrol">Petrol</option>
              <option value="diesel">Diesel</option>
              <option value="cng">CNG</option>
              <option value="electric">Electric</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </FormField>
          <FormField label="Transmission" name="transmission" required error={errors.transmission}>
            <select
              id="transmission"
              value={draft.transmission}
              onChange={(e) => setField("transmission", e.target.value)}
              className={inputClass(errors.transmission)}
            >
              <option value="manual">Manual</option>
              <option value="automatic">Automatic</option>
              <option value="amt">AMT</option>
              <option value="cvt">CVT</option>
              <option value="dct">DCT</option>
            </select>
          </FormField>
          <FormField label="Engine CC" name="engineCC" error={errors.engineCC}>
            <input
              id="engineCC"
              type="number"
              value={draft.engineCC}
              onChange={(e) => setField("engineCC", e.target.value)}
              className={`${inputClass()} font-spec`}
              placeholder="1197"
            />
          </FormField>
          <FormField label="Power" name="power">
            <input
              id="power"
              value={draft.power}
              onChange={(e) => setField("power", e.target.value)}
              className={`${inputClass()} font-spec`}
              placeholder="88 bhp"
            />
          </FormField>
          <FormField label="Torque" name="torque">
            <input
              id="torque"
              value={draft.torque}
              onChange={(e) => setField("torque", e.target.value)}
              className={`${inputClass()} font-spec`}
              placeholder="113 Nm"
            />
          </FormField>
        </div>
      </FormSection>

      <FormSection title="Status & condition">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Year of manufacture" name="yearOfManufacture" required error={errors.yearOfManufacture}>
            <input
              id="yearOfManufacture"
              type="number"
              min={1990}
              max={new Date().getFullYear() + 1}
              value={draft.yearOfManufacture}
              onChange={(e) => setField("yearOfManufacture", e.target.value)}
              className={`${inputClass(errors.yearOfManufacture)} font-spec`}
            />
          </FormField>
          <FormField label="Current mileage (km)" name="currentMileage" required error={errors.currentMileage}>
            <input
              id="currentMileage"
              type="number"
              min={0}
              value={draft.currentMileage}
              onChange={(e) => setField("currentMileage", e.target.value)}
              className={`${inputClass(errors.currentMileage)} font-spec`}
            />
          </FormField>
          <FormField label="Owner type" name="ownerType" required error={errors.ownerType}>
            <select
              id="ownerType"
              value={draft.ownerType}
              onChange={(e) => setField("ownerType", e.target.value)}
              className={inputClass(errors.ownerType)}
            >
              <option value="first">1st owner</option>
              <option value="second">2nd owner</option>
              <option value="third">3rd owner</option>
              <option value="fourth_plus">4th+ owner</option>
            </select>
          </FormField>
          <FormField label="Condition" name="condition" required error={errors.condition}>
            <select
              id="condition"
              value={draft.condition}
              onChange={(e) => setField("condition", e.target.value)}
              className={inputClass(errors.condition)}
            >
              <option value="excellent">Excellent</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="needs_work">Needs work</option>
            </select>
          </FormField>
          <FormField label="Color" name="color">
            <input
              id="color"
              value={draft.color}
              onChange={(e) => setField("color", e.target.value)}
              className={inputClass()}
            />
          </FormField>
        </div>
      </FormSection>

      <FormSection title="Documents & history">
        <div className="space-y-4">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={draft.insuranceValid}
              onChange={(e) => setField("insuranceValid", e.target.checked)}
              className="h-4 w-4 rounded border-line text-sell-primary"
            />
            <span className="text-sm">Insurance valid</span>
          </label>
          {draft.insuranceValid && (
            <FormField label="Insurance valid till" name="insuranceValidTill" required error={errors.insuranceValidTill}>
              <input
                id="insuranceValidTill"
                type="date"
                value={draft.insuranceValidTill}
                onChange={(e) => setField("insuranceValidTill", e.target.value)}
                className={inputClass(errors.insuranceValidTill)}
              />
            </FormField>
          )}

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={draft.pollutionCertValid}
              onChange={(e) => setField("pollutionCertValid", e.target.checked)}
              className="h-4 w-4 rounded border-line text-sell-primary"
            />
            <span className="text-sm">Pollution certificate (PUC) valid</span>
          </label>
          {draft.pollutionCertValid && (
            <FormField label="PUC valid till" name="pollutionCertValidTill" required error={errors.pollutionCertValidTill}>
              <input
                id="pollutionCertValidTill"
                type="date"
                value={draft.pollutionCertValidTill}
                onChange={(e) => setField("pollutionCertValidTill", e.target.value)}
                className={inputClass(errors.pollutionCertValidTill)}
              />
            </FormField>
          )}

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={draft.serviceHistoryAvail}
              onChange={(e) => setField("serviceHistoryAvail", e.target.checked)}
              className="h-4 w-4 rounded border-line text-sell-emerald"
            />
            <span className="text-sm">Service history available</span>
          </label>

          <fieldset>
            <legend className="text-sm font-medium text-sell-primary">Accident history</legend>
            <div className="mt-2 flex flex-wrap gap-4">
              {(["none", "minor", "yes"] as const).map((v) => (
                <label key={v} className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="accidentHistory"
                    checked={draft.accidentHistory === v}
                    onChange={() => setField("accidentHistory", v)}
                  />
                  {v === "none" ? "None" : v === "minor" ? "Minor" : "Yes"}
                </label>
              ))}
            </div>
          </fieldset>
          {draft.accidentHistory !== "none" && (
            <FormField label="Accident details" name="accidentDescription" required error={errors.accidentDescription}>
              <textarea
                id="accidentDescription"
                rows={3}
                value={draft.accidentDescription}
                onChange={(e) => setField("accidentDescription", e.target.value)}
                className={inputClass(errors.accidentDescription)}
              />
            </FormField>
          )}

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={draft.hasModifications}
              onChange={(e) => setField("hasModifications", e.target.checked)}
              className="h-4 w-4 rounded border-line"
            />
            <span className="text-sm">Has modifications</span>
          </label>
          {draft.hasModifications && (
            <FormField label="Modification details" name="modifications" required error={errors.modifications}>
              <textarea
                id="modifications"
                rows={3}
                value={draft.modifications}
                onChange={(e) => setField("modifications", e.target.value)}
                className={inputClass(errors.modifications)}
              />
            </FormField>
          )}
        </div>
      </FormSection>

      <FormSection title="Pricing & location">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Asking price (₹)" name="askingPrice" required error={errors.askingPrice}>
            <input
              id="askingPrice"
              inputMode="numeric"
              value={draft.askingPrice}
              onChange={(e) => setField("askingPrice", e.target.value.replace(/[^\d]/g, ""))}
              className={`${inputClass(errors.askingPrice)} font-spec`}
              placeholder="650000"
            />
          </FormField>
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.priceNegotiable}
                onChange={(e) => setField("priceNegotiable", e.target.checked)}
                className="h-4 w-4 rounded"
              />
              Price negotiable
            </label>
          </div>
          <FormField label="City" name="city" required error={errors.city}>
            <input id="city" value={draft.city} onChange={(e) => setField("city", e.target.value)} className={inputClass(errors.city)} />
          </FormField>
          <FormField label="State" name="state" required error={errors.state}>
            <input id="state" value={draft.state} onChange={(e) => setField("state", e.target.value)} className={inputClass(errors.state)} />
          </FormField>
        </div>
        <FormField label="Description" name="description" hint="Optional — highlight selling points">
          <textarea
            id="description"
            rows={4}
            value={draft.description}
            onChange={(e) => setField("description", e.target.value)}
            className={inputClass()}
            placeholder="Well maintained, single owner, all service records…"
          />
        </FormField>
      </FormSection>

      <div className="flex justify-between gap-3 pt-2">
        <button type="button" onClick={goBack} className="btn-sell-ghost" disabled>
          Back
        </button>
        <button type="button" onClick={goNext} className="btn-sell-secondary">
          Continue →
        </button>
      </div>
    </div>
  );
}
