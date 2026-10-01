export function buildWhatsAppLink(phoneNumber, productTitle) {
  const digits = String(phoneNumber).replace(/\D/g, "");
  if (!/^[1-9]\d{7,14}$/.test(digits)) throw new TypeError("A valid international phone number is required.");
  return `https://wa.me/${digits}?text=Hello,%20I%20am%20interested%20in%20your%20item:%20${encodeURIComponent(productTitle)}`;
}
