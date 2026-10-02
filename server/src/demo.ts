/**
 * Demo data: two matchmakers and eight singles. Every person here is
 * invented; emails use the reserved `.example` TLD and phone numbers are
 * placeholders. Used by `npm run seed` and by SEED_DEMO on server start.
 */
import { MatchMaker } from './models/matchMaker.js';
import { Single, ISingle } from './models/single.js';
import { Token } from './models/token.js';
import { TransferRequest } from './models/transferRequest.js';
import { Proposal, ProposalStatus, SideResponse } from './models/proposal.js';
import {
  Ethnicity,
  Gender,
  Interest,
  MarriageStatus,
  ProposePreference,
  Sector,
} from './models/enums.js';

const DEMO_DOMAIN = '@demo.tovim.example';
const DEMO_EMAIL = new RegExp(`${DEMO_DOMAIN.replace(/\./g, '\\.')}$`);
const DEMO_PASSWORD = 'demo-password';

/** A soft gradient avatar with initials, as a base64 SVG data URI (no real photos). */
const avatar = (initials: string, from: string, to: string): string => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
<stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs>
<rect width="320" height="320" fill="url(#g)"/>
<text x="160" y="160" dy="0.35em" text-anchor="middle" font-family="Arial, sans-serif"
 font-size="120" font-weight="700" fill="#ffffff" fill-opacity="0.92">${initials}</text></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
};

type SingleSeed = Partial<ISingle> & { owner: 0 | 1 };

const singles: SingleSeed[] = [
  {
    owner: 0,
    firstName: 'נועה',
    lastName: 'ברושי',
    gender: Gender.FEMALE,
    sector: Sector.DATI_LEUMI,
    birthYear: 1998,
    city: 'ירושלים',
    marriageStatus: MarriageStatus.SINGLE,
    ethnicity: Ethnicity.ASHKENAZI,
    height: 166,
    currentOccupation: 'מורה לביולוגיה',
    workAndStudyPlaces: ['מדרשת עין הנצי"ב', 'האוניברסיטה העברית'],
    basicDescription: 'חמה, אופטימית ואוהבת אנשים. מחפשת בית של תורה ושמחה.',
    freeDescription: 'אוהבת לטייל בשבילים של הרי ירושלים ולארח בשבת.',
    attributes: ['רגישה', 'אחראית', 'בעלת הומור'],
    lookingForAttributes: ['יציב', 'קשוב', 'אוהב ללמוד'],
    nonCompromisableAttributes: ['יראת שמיים', 'כנות', 'חסד', 'שאיפה ללמוד'],
    desiredSectors: [Sector.DATI_LEUMI, Sector.DATI_LEUMI_HARDAL],
    desiredAgeRange: { min: 25, max: 31 },
    interests: [Interest.HIKING, Interest.TORAH, Interest.COOKING, Interest.READING],
    isPublic: true,
    images: [avatar('נ', '#f6a38f', '#c8577a')],
    referencePhones: ['0500000101'],
    proposePreference: ProposePreference.NO_PREFERENCE,
  },
  {
    owner: 0,
    firstName: 'אביתר',
    lastName: 'שקדי',
    gender: Gender.MALE,
    sector: Sector.DATI_LEUMI,
    birthYear: 1995,
    city: 'מודיעין',
    marriageStatus: MarriageStatus.SINGLE,
    ethnicity: Ethnicity.MIXED,
    height: 181,
    currentOccupation: 'מהנדס תוכנה',
    workAndStudyPlaces: ['ישיבת הסדר', 'הטכניון'],
    basicDescription: 'רציני ושמח, קובע עיתים לתורה ואוהב ספורט.',
    attributes: ['יציב', 'נדיב', 'סקרן'],
    lookingForAttributes: ['שמחה', 'בעלת ערכים'],
    nonCompromisableAttributes: ['ערכיות', 'חוש הומור', 'משפחתיות', 'צניעות'],
    desiredSectors: [Sector.DATI_LEUMI],
    desiredAgeRange: { min: 23, max: 29 },
    interests: [Interest.RUNNING, Interest.TECH, Interest.TORAH, Interest.MUSIC],
    isPublic: true,
    images: [avatar('א', '#7fb7be', '#3d6f8e')],
    referencePhones: ['0500000102', '0500000103'],
  },
  {
    owner: 0,
    firstName: 'הדס',
    lastName: 'אלוני',
    gender: Gender.FEMALE,
    sector: Sector.MASORTI,
    birthYear: 1993,
    city: 'באר שבע',
    marriageStatus: MarriageStatus.DIVORCED,
    numOfChildren: 1,
    ethnicity: Ethnicity.SEPHARDI,
    height: 160,
    currentOccupation: 'אחות במחלקת ילדים',
    basicDescription: 'אמא לילד מקסים, חזקה ורגישה, מחפשת שותף אמיתי לדרך.',
    attributes: ['חמה', 'מסורה', 'ישירה'],
    lookingForAttributes: ['אחריות', 'אהבת ילדים'],
    nonCompromisableAttributes: ['אמינות', 'אהבת ילדים', 'יציבות', 'שמירת מסורת'],
    desiredSectors: [Sector.MASORTI, Sector.DATI_LEUMI],
    desiredAgeRange: { min: 30, max: 40 },
    interests: [Interest.COOKING, Interest.NATURE, Interest.VOLUNTEERING],
    isPublic: false,
    referencePhones: ['0500000104'],
    proposePreference: ProposePreference.OTHER,
  },
  {
    owner: 0,
    firstName: 'מנחם',
    lastName: 'גפני',
    gender: Gender.MALE,
    sector: Sector.HAREDI_LITVAK,
    birthYear: 2000,
    city: 'בני ברק',
    marriageStatus: MarriageStatus.SINGLE,
    ethnicity: Ethnicity.ASHKENAZI,
    height: 175,
    currentOccupation: 'אברך',
    workAndStudyPlaces: ['ישיבה גדולה'],
    basicDescription: 'בחור עדין ומתמיד, בעל מידות טובות.',
    attributes: ['מתמיד', 'עדין', 'צנוע'],
    lookingForAttributes: ['יראת שמיים', 'בית נאמן'],
    nonCompromisableAttributes: ['יראת שמיים', 'מידות טובות', 'תמיכה בלימוד', 'צניעות'],
    desiredSectors: [Sector.HAREDI_LITVAK],
    desiredAgeRange: { min: 19, max: 24 },
    interests: [Interest.TORAH, Interest.HISTORY],
    isPublic: true,
    images: [avatar('מ', '#b9a6e0', '#6d5aa8')],
  },
  {
    owner: 0,
    firstName: 'שירה',
    lastName: 'תמרי',
    gender: Gender.FEMALE,
    sector: Sector.DATI_LEUMI_HARDAL,
    birthYear: 2001,
    city: 'אלון שבות',
    marriageStatus: MarriageStatus.SINGLE,
    ethnicity: Ethnicity.YEMENITE,
    height: 158,
    currentOccupation: 'סטודנטית לריפוי בעיסוק',
    basicDescription: 'שקטה ועמוקה, אוהבת מוזיקה וטבע.',
    attributes: ['עמוקה', 'יצירתית'],
    lookingForAttributes: ['רוחניות', 'רוגע'],
    nonCompromisableAttributes: ['תורה', 'רגישות', 'יושר', 'שמחה'],
    desiredSectors: [Sector.DATI_LEUMI_HARDAL, Sector.DATI_LEUMI],
    desiredAgeRange: { min: 22, max: 28 },
    interests: [Interest.MUSIC, Interest.NATURE, Interest.PAINTING, Interest.POETRY],
    isPublic: false,
    images: [avatar('ש', '#f4c27a', '#d9805f')],
  },
  {
    owner: 1,
    firstName: 'יהונתן',
    lastName: 'רימוני',
    gender: Gender.MALE,
    sector: Sector.MASORTI,
    birthYear: 1990,
    city: 'חיפה',
    marriageStatus: MarriageStatus.SINGLE,
    ethnicity: Ethnicity.SEPHARDI,
    height: 178,
    currentOccupation: 'אדריכל',
    basicDescription: 'יצירתי, אוהב לבשל ולארח, מחפש קשר רציני.',
    attributes: ['יצירתי', 'מכניס אורחים'],
    lookingForAttributes: ['חום', 'אינטליגנציה'],
    nonCompromisableAttributes: ['כבוד הדדי', 'משפחתיות', 'שמחת חיים', 'כנות'],
    desiredSectors: [Sector.MASORTI],
    desiredAgeRange: { min: 27, max: 35 },
    interests: [Interest.ART, Interest.COOKING, Interest.TRAVEL, Interest.COFFEE_CULTURE],
    isPublic: true,
  },
  {
    owner: 1,
    firstName: 'אילה',
    lastName: 'דקלי',
    gender: Gender.FEMALE,
    sector: Sector.HAREDI_CHASIDUT,
    birthYear: 1999,
    city: 'צפת',
    marriageStatus: MarriageStatus.SINGLE,
    ethnicity: Ethnicity.ASHKENAZI,
    currentOccupation: 'גננת',
    basicDescription: 'שמחה ומלאת חיים, אוהבת ילדים ושירה.',
    attributes: ['שמחה', 'נותנת'],
    lookingForAttributes: ['חסידיות', 'שמחה'],
    nonCompromisableAttributes: ['יראת שמיים', 'שמחה', 'חסד', 'משפחתיות'],
    desiredSectors: [Sector.HAREDI_CHASIDUT],
    desiredAgeRange: { min: 22, max: 28 },
    interests: [Interest.MUSIC, Interest.VOLUNTEERING],
    isPublic: true,
    images: [avatar('א', '#9fd3a8', '#4f9a76')],
  },
  {
    owner: 1,
    firstName: 'עמית',
    lastName: 'ארזי',
    gender: Gender.MALE,
    sector: Sector.HILONI,
    birthYear: 1994,
    city: 'תל אביב',
    marriageStatus: MarriageStatus.SINGLE,
    ethnicity: Ethnicity.OTHER,
    customEthnicity: 'ממוצא אתיופי וצרפתי',
    height: 185,
    currentOccupation: 'רופא מתמחה',
    basicDescription: 'אוהב אנשים, טבע ומוזיקה טובה.',
    attributes: ['קשוב', 'אמביציוזי'],
    lookingForAttributes: ['סקרנות', 'עצמאות'],
    nonCompromisableAttributes: ['כנות', 'רצון בילדים', 'סקרנות', 'חוש הומור'],
    desiredSectors: [Sector.HILONI, Sector.MASORTI],
    desiredAgeRange: { min: 26, max: 33 },
    interests: [Interest.CYCLING, Interest.SCIENCE, Interest.CINEMA],
    isPublic: false,
  },
];

/** True once the demo matchmakers exist, so a restart doesn't re-seed. */
export const hasDemoData = async (): Promise<boolean> =>
  (await MatchMaker.exists({ email: DEMO_EMAIL })) !== null;

/** Replaces the demo records (and only those) with a fresh copy. */
export const seedDemo = async (): Promise<void> => {

  const oldMatchMakers = await MatchMaker.find({ email: DEMO_EMAIL }, '_id').lean();
  const oldIds = oldMatchMakers.map((m) => m._id);
  await Promise.all([
    TransferRequest.deleteMany({ $or: [{ from: { $in: oldIds } }, { to: { $in: oldIds } }] }),
    Token.deleteMany({ matchMaker: { $in: oldIds } }),
    Proposal.deleteMany({ matchMaker: { $in: oldIds } }),
    Single.deleteMany({ email: DEMO_EMAIL }),
  ]);
  await MatchMaker.deleteMany({ _id: { $in: oldIds } });

  // create() (not insertMany) so the scrypt password hook runs
  const matchMakers = [
    await MatchMaker.create({
      firstName: 'רחל',
      lastName: 'הדגמה',
      phoneNumber: '0500000001',
      email: `rachel${DEMO_DOMAIN}`,
      password: DEMO_PASSWORD,
      city: 'ירושלים',
      gender: Gender.FEMALE,
      sector: Sector.DATI_LEUMI,
      expertSectors: [Sector.DATI_LEUMI, Sector.DATI_LEUMI_HARDAL, Sector.MASORTI],
    }),
    await MatchMaker.create({
      firstName: 'יוסף',
      lastName: 'לדוגמה',
      phoneNumber: '0500000002',
      email: `yosef${DEMO_DOMAIN}`,
      password: DEMO_PASSWORD,
      city: 'חיפה',
      gender: Gender.MALE,
      sector: Sector.MASORTI,
      expertSectors: [Sector.MASORTI, Sector.HILONI, Sector.HAREDI_CHASIDUT],
    }),
  ];

  const created = [];
  for (const [i, { owner, ...data }] of singles.entries()) {
    created.push(
      await Single.create({
        phoneNumber: `05000002${String(i).padStart(2, '0')}`,
        email: `single${i + 1}${DEMO_DOMAIN}`,
        ...data,
        matchMakers: [matchMakers[owner]._id],
      })
    );
  }

  // Something to look at on the requests page of both matchmakers
  await TransferRequest.create({
    single: created[5]._id,
    from: matchMakers[1]._id,
    to: matchMakers[0]._id,
  });
  await TransferRequest.create({
    single: created[2]._id,
    from: matchMakers[0]._id,
    to: matchMakers[1]._id,
    status: 'approved',
  });
  created[2].matchMakers.push(matchMakers[1]._id);
  await created[2].save();

  // A few matches at different stages for the proposals page
  const daysAgo = (d: number) => new Date(Date.now() - d * 24 * 60 * 60 * 1000);
  await Proposal.create([
    {
      matchMaker: matchMakers[0]._id,
      sides: [
        { single: created[0]._id, response: SideResponse.YES, note: 'שמחה לנסות, שמעה עליו טובות', respondedAt: daysAgo(12) },
        { single: created[1]._id, response: SideResponse.YES, respondedAt: daysAgo(11) },
      ],
      status: ProposalStatus.DATING,
      datesCount: 3,
      notes: 'נפגשו בירושלים. אחרי הפגישה השלישית שניהם רוצים להמשיך.',
      history: [
        { status: ProposalStatus.IDEA, at: daysAgo(15) },
        { status: ProposalStatus.PROPOSED, at: daysAgo(13) },
        { status: ProposalStatus.DATING, at: daysAgo(9), note: 'פגישה ראשונה' },
      ],
    },
    {
      matchMaker: matchMakers[0]._id,
      sides: [
        { single: created[2]._id, response: SideResponse.YES, respondedAt: daysAgo(2) },
        { single: created[5]._id, response: SideResponse.THINKING, note: 'ביקש לברר על הילד', respondedAt: daysAgo(1) },
      ],
      status: ProposalStatus.PROPOSED,
      history: [
        { status: ProposalStatus.IDEA, at: daysAgo(4) },
        { status: ProposalStatus.PROPOSED, at: daysAgo(3) },
      ],
    },
    {
      matchMaker: matchMakers[0]._id,
      sides: [{ single: created[3]._id }, { single: created[6]._id }],
      status: ProposalStatus.IDEA,
      notes: 'לברר אם היא פתוחה לליטאי',
      history: [{ status: ProposalStatus.IDEA, at: daysAgo(1) }],
    },
  ]);

  console.log(`Seeded ${matchMakers.length} matchmakers and ${created.length} singles.`);
  for (const m of matchMakers) {
    console.log(`  login: ${m.email} / ${DEMO_PASSWORD}`);
  }
};

