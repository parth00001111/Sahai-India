import axios from "axios";

const postalCache = new Map();
const reverseCache = new Map();
let lastNominatimRequestAt = 0;

const normalise = (value) => String(value || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");

const waitForNominatimLimit = async () => {
  const wait = Math.max(0, 1050 - (Date.now() - lastNominatimRequestAt));
  if (wait) await new Promise((resolve) => setTimeout(resolve, wait));
  lastNominatimRequestAt = Date.now();
};

export async function lookupIndianPincode(pincode) {
  const pin = String(pincode || "").trim();
  if (!/^\d{6}$/.test(pin)) throw new Error("Enter a valid 6-digit Indian PIN code");
  if (postalCache.has(pin)) return postalCache.get(pin);

  let response;
  try {
    response = await axios.get(`https://api.postalpincode.in/pincode/${pin}`, { timeout: 10000 });
  } catch {
    const error = new Error("Postal PIN service is temporarily unavailable");
    error.statusCode = 503;
    throw error;
  }
  const result = response.data?.[0];
  if (result?.Status !== "Success" || !Array.isArray(result.PostOffice) || !result.PostOffice.length) {
    throw new Error("This PIN code was not found in the postal directory");
  }

  const postOffices = result.PostOffice.map((office) => ({
    name: office.Name,
    branchType: office.BranchType,
    deliveryStatus: office.DeliveryStatus,
    block: office.Block || office.Taluk || "",
    district: office.District,
    state: office.State,
    division: office.Division,
    region: office.Region,
    country: office.Country || "India",
    pincode: office.Pincode || pin,
  }));
  const data = { pincode: pin, postOffices };
  postalCache.set(pin, data);
  return data;
}

export async function reverseIndianCoordinates(latInput, lngInput) {
  const lat = Number(latInput);
  const lng = Number(lngInput);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < 6 || lat > 38 || lng < 68 || lng > 98) {
    throw new Error("Select a location within India");
  }

  const key = `${lat.toFixed(5)},${lng.toFixed(5)}`;
  if (reverseCache.has(key)) return reverseCache.get(key);
  await waitForNominatimLimit();

  let response;
  try {
    response = await axios.get("https://nominatim.openstreetmap.org/reverse", {
      params: { lat, lon: lng, format: "jsonv2", addressdetails: 1, zoom: 18, countrycodes: "in" },
      headers: {
        "User-Agent": process.env.SAHAI_GEOCODING_USER_AGENT || "SahaiIndia/1.0 (help@sahaiindia.in)",
        "Accept-Language": "en",
      },
      timeout: 12000,
    });
  } catch {
    const error = new Error("Reverse geocoding service is temporarily unavailable");
    error.statusCode = 503;
    throw error;
  }
  if (!response.data?.place_id) throw new Error("The exact map location could not be verified");
  const source = response.data?.address || {};
  const data = {
    lat,
    lng,
    displayName: response.data?.display_name || "",
    address: [source.house_number, source.road].filter(Boolean).join(" "),
    area: source.suburb || source.neighbourhood || source.quarter || source.village || source.town || "",
    city: source.city || source.town || source.village || source.municipality || "",
    district: source.state_district || source.county || "",
    state: source.state || "",
    pincode: String(source.postcode || "").match(/\d{6}/)?.[0] || "",
    countryCode: source.country_code || "",
  };
  if (data.countryCode.toLowerCase() !== "in") throw new Error("Select a location within India");
  reverseCache.set(key, data);
  return data;
}

export async function validateIndianLocation(location) {
  const postal = await lookupIndianPincode(location.pincode);
  const offices = postal.postOffices;
  const selectedOffice = offices.find((office) => normalise(office.name) === normalise(location.postOffice));
  if (!selectedOffice) throw new Error("Select a post office returned for this PIN code");
  if (normalise(selectedOffice.state) !== normalise(location.state)) throw new Error("State does not match the selected PIN code");
  if (normalise(selectedOffice.district) !== normalise(location.district)) throw new Error("District does not match the selected PIN code");

  const reverse = await reverseIndianCoordinates(location.lat, location.lng);
  if (!reverse.pincode) throw new Error("The map point has no verifiable PIN code. Move the pin to the exact building or road");
  if (reverse.pincode !== String(location.pincode)) {
    throw new Error("The map location does not match the selected PIN code");
  }

  return {
    pincode: postal.pincode,
    postOffice: selectedOffice.name,
    district: selectedOffice.district,
    state: selectedOffice.state,
    city: String(selectedOffice.block || location.city || selectedOffice.district).trim(),
    lat: reverse.lat,
    lng: reverse.lng,
    locationVerifiedAt: new Date(),
  };
}
