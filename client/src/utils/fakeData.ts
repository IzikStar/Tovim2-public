import {
  genders,
  sectors,
  marriageStatuses,
  ethnicities,
  interests,
  proposePreferences,
} from "./enums";

export interface Single {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  images: string[];
  email?: string;
  city?: string;
  gender?: string;
  sector?: string;
  customSector?: string;
  birthYear?: number;
  marriageStatus?: string;
  numOfChildren?: number;
  ethnicity?: string;
  customEthnicity?: string;
  workAndStudyPlaces?: string[];
  currentOccupation?: string;
  basicDescription?: string;
  freeDescription?: string;
  attributes?: string[];
  lookingForAttributes?: string[];
  nonCompromisableAttributes?: string[];
  desiredSectors?: string[];
  matchMakers?: string[];
  height?: number;
  appearanceDescription?: string;
  appearanceMustHave?: string;
  appearanceMustNotHave?: string;
  generalDealBreakers?: string;
  interests?: string[];
  otherInterests?: string[];
  futureVision?: string;
  existingMatchProfile?: string;
  shareInWhatsappGroups?: boolean;
  proposePreference?: string;
  referencePhones?: string[];
  nameForPrayer?: string;
  referralSource?: string;
  matchmakerExpectations?: string;
  desiredAgeRange?: { min: number; max: number };
  searchText?: string;
}

export const fakeSingles: Single[] = [
  {
    id: "fake1",
    firstName: "דוד",
    lastName: "כהן",
    phoneNumber: "0500000000",
    email: "david@example.com",
    city: "ירושלים",
    images: ["https://via.placeholder.com/150"],
    gender: genders[0],
    sector: sectors[3],
    birthYear: 1990,
    marriageStatus: marriageStatuses[0],
    ethnicity: ethnicities[0],
    interests: [interests[0], interests[1]],
    proposePreference: proposePreferences[2],
    attributes: ["חכם", "נדיב"],
    lookingForAttributes: ["נעימה", "חמה"],
    nonCompromisableAttributes: [
      "יראת שמים",
      "חסד",
      "משפחה",
      "שמחה",
    ],
    desiredSectors: [sectors[3]],
    matchMakers: [],
    shareInWhatsappGroups: false,
    referencePhones: ["0501111111"],
    otherInterests: [],
  },
  {
    id: "fake2",
    firstName: "שרה",
    lastName: "לוי",
    phoneNumber: "0500000001",
    email: "sara@example.com",
    city: "בני ברק",
    images: ["https://via.placeholder.com/150"],
    gender: genders[1],
    sector: sectors[1],
    birthYear: 1992,
    marriageStatus: marriageStatuses[0],
    ethnicity: ethnicities[1],
    interests: [interests[2]],
    proposePreference: proposePreferences[0],
    attributes: ["אחראית"],
    lookingForAttributes: ["נעים", "משקיע"],
    nonCompromisableAttributes: [
      "אמונה",
      "משפחה",
      "שמחה",
      "חברות",
    ],
    desiredSectors: [sectors[1]],
    matchMakers: [],
    shareInWhatsappGroups: false,
    referencePhones: ["0502222222"],
    otherInterests: [],
  },
];
