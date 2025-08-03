import {
  genders,
  sectors as sectorOptions,
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
  sectors?: string[];
  customSector?: string;
  birthDate?: string;
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
  isPublic?: boolean;
  isTaken?: boolean;
  marriedMatchmaker?: string;
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
    workAndStudyPlaces: ["ישיבת מרכז הרב", "חברת הייטק XYZ"],
    currentOccupation: "מפתח תוכנה",
    basicDescription: "בחור דתי לאומי אוהב תורה וספורט",
    freeDescription: "חובב טיולים וספרים",
    futureVision: "מחפש להקים בית תורני בארץ ישראל",
    images: [
      "https://placehold.co/400x400?text=Photo",
      "https://placehold.co/400x400?text=Photo",
    ],
    gender: genders[0],
    sectors: [sectorOptions[3]],
    birthDate: new Date(1990, 0, 1).toISOString(),
    marriageStatus: marriageStatuses[0],
    ethnicity: ethnicities[0],
    interests: [interests[0], interests[1]],
    proposePreference: proposePreferences[2],
    attributes: ["חכם", "נדיב"],
    lookingForAttributes: ["נעימה", "חמה"],
    nonCompromisableAttributes: ["יראת שמים", "חסד", "משפחה", "שמחה"],
    desiredSectors: [sectorOptions[3]],
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
    workAndStudyPlaces: ["סמינר בית יעקב", "חברת עיצוב"],
    currentOccupation: "מעצבת גרפית",
    basicDescription: "בחורה חסידית רצינית ושמחה",
    freeDescription: "אוהבת לבשל ולשיר",
    futureVision: "שואפת לבית מלא בשמחה ואהבת תורה",
    images: [
      "https://placehold.co/400x400?text=Photo",
    ],
    gender: genders[1],
    sectors: [sectorOptions[1]],
    birthDate: new Date(1992, 0, 1).toISOString(),
    marriageStatus: marriageStatuses[0],
    ethnicity: ethnicities[1],
    interests: [interests[2]],
    proposePreference: proposePreferences[0],
    attributes: ["אחראית"],
    lookingForAttributes: ["נעים", "משקיע"],
    nonCompromisableAttributes: ["אמונה", "משפחה", "שמחה", "חברות"],
    desiredSectors: [sectorOptions[1]],
    matchMakers: [],
    shareInWhatsappGroups: false,
    referencePhones: ["0502222222"],
    otherInterests: [],
  },
];
