import { lookupIndianPincode, reverseIndianCoordinates } from "../services/locationService.js";

export const getPincodeDetails = async (req, res) => {
  try {
    const data = await lookupIndianPincode(req.params.pincode);
    return res.json({ success: true, message: "PIN code verified", data });
  } catch (error) {
    const status = error.statusCode || (/^\d{6}$/.test(req.params.pincode || "") ? 404 : 400);
    return res.status(status).json({ success: false, message: error.message, data: null });
  }
};

export const reverseLocation = async (req, res) => {
  try {
    const data = await reverseIndianCoordinates(req.query.lat, req.query.lng);
    return res.json({ success: true, message: "Location resolved", data });
  } catch (error) {
    const clientError = error.message.includes("within India") || error.message.includes("Select a location") || error.message.includes("could not be verified");
    return res.status(error.statusCode || (clientError ? 400 : 503)).json({ success: false, message: error.message, data: null });
  }
};
