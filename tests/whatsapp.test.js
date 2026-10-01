import assert from "node:assert/strict";
import test from "node:test";
import { buildWhatsAppLink } from "../shared/whatsapp.js";

test("builds the requested WhatsApp deep link from an E.164 phone number", () => {
  assert.equal(
    buildWhatsAppLink("+2348012345678", "TI-84 Plus"),
    "https://wa.me/2348012345678?text=Hello,%20I%20am%20interested%20in%20your%20item:%20TI-84%20Plus"
  );
});

test("rejects a phone number without an international country code", () => {
  assert.throws(() => buildWhatsAppLink("08012345678", "Book"), TypeError);
});
