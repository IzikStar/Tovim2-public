import { genders, sectors, marriageStatuses, ethnicities, interests, proposePreferences } from './enums';

export interface Single {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  image: string;
  gender: string;
  sector: string;
  marriageStatus: string;
  ethnicity: string;
  interests: string[];
  proposePreference: string;
}

export const fakeSingles: Single[] = [
  {
    id: 'fake1',
    firstName: 'דוד',
    lastName: 'כהן',
    phoneNumber: '0500000000',
    image: 'https://via.placeholder.com/150',
    gender: genders[0],
    sector: sectors[3],
    marriageStatus: marriageStatuses[0],
    ethnicity: ethnicities[0],
    interests: [interests[0], interests[1]],
    proposePreference: proposePreferences[2],
  },
  {
    id: 'fake2',
    firstName: 'שרה',
    lastName: 'לוי',
    phoneNumber: '0500000001',
    image: 'https://via.placeholder.com/150',
    gender: genders[1],
    sector: sectors[1],
    marriageStatus: marriageStatuses[0],
    ethnicity: ethnicities[1],
    interests: [interests[2]],
    proposePreference: proposePreferences[0],
  },
];
