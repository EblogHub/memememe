const stateCodes = new Set(["LASU", "RSU", "EKSU", "DELSU", "UNIOSUN", "IMSU", "BSU", "KASU"]);
const privateCodes = new Set(["CU", "BABCOCK", "ABUAD", "BOWEN", "AUN", "PAU", "NILE", "LMU"]);

const campusRecords = [
  ["University of Lagos", "UNILAG", "Lagos State", ["Akoka", "Yaba"]],
  ["University of Ibadan", "UI", "Oyo State", ["Ibadan"]],
  ["Ahmadu Bello University", "ABU", "Kaduna State", ["Zaria"]],
  ["University of Nigeria, Nsukka", "UNN", "Enugu State", ["Nsukka"]],
  ["Obafemi Awolowo University", "OAU", "Osun State", ["Ile-Ife"]],
  ["University of Benin", "UNIBEN", "Edo State", ["Benin City"]],
  ["University of Abuja", "UNIABUJA", "FCT", ["Abuja"]],
  ["University of Port Harcourt", "UNIPORT", "Rivers State", ["Choba", "Port Harcourt"]],
  ["University of Jos", "UNIJOS", "Plateau State", ["Jos"]],
  ["University of Calabar", "UNICAL", "Cross River State", ["Calabar"]],
  ["University of Maiduguri", "UNIMAID", "Borno State", ["Maiduguri"]],
  ["University of Uyo", "UNIUYO", "Akwa Ibom State", ["Uyo"]],
  ["Federal University of Technology, Akure", "FUTA", "Ondo State", ["Akure"]],
  ["Federal University of Technology, Minna", "FUTMINNA", "Niger State", ["Minna"]],
  ["Federal University of Agriculture, Abeokuta", "FUNAAB", "Ogun State", ["Abeokuta"]],
  ["Lagos State University", "LASU", "Lagos State", ["Ojo"]],
  ["Rivers State University", "RSU", "Rivers State", ["Port Harcourt"]],
  ["Ekiti State University", "EKSU", "Ekiti State", ["Ado-Ekiti"]],
  ["Delta State University", "DELSU", "Delta State", ["Abraka"]],
  ["Osun State University", "UNIOSUN", "Osun State", ["Osogbo"]],
  ["Imo State University", "IMSU", "Imo State", ["Owerri"]],
  ["Benue State University", "BSU", "Benue State", ["Makurdi"]],
  ["Kaduna State University", "KASU", "Kaduna State", ["Kaduna"]],
  ["Covenant University", "CU", "Ogun State", ["Ota"]],
  ["Babcock University", "BABCOCK", "Ogun State", ["Ilishan-Remo"]],
  ["Afe Babalola University", "ABUAD", "Ekiti State", ["Ado-Ekiti"]],
  ["Bowen University", "BOWEN", "Osun State", ["Iwo"]],
  ["American University of Nigeria", "AUN", "Adamawa State", ["Yola"]],
  ["Pan-Atlantic University", "PAU", "Lagos State", ["Lekki"]],
  ["Nile University of Nigeria", "NILE", "FCT", ["Abuja"]],
  ["Landmark University", "LMU", "Kwara State", ["Omu-Aran"]]
];

export const universities = campusRecords.map(([fullName, shortCode, state, campusLocations], index) => ({
  id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
  fullName,
  shortCode,
  state,
  campusLocations,
  institutionType: privateCodes.has(shortCode) ? "PRIVATE" : stateCodes.has(shortCode) ? "STATE" : "FEDERAL"
}));
