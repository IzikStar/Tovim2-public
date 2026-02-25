import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  ethnicities,
  interests,
  marriageStatuses,
  proposePreferences,
  sectorLabels,
  sectors,
} from "../utils/enums";
import apiService, { MatchMaker } from "../services/api";
import { baseURL } from "../config";
import ProgressBar from "../components/ProgressBar";
import QuestionBlock from "../components/QuestionBlock";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Select } from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";

interface FormData {
  firstName: string;
  lastName: string;
  marriageStatus: string;
  age: string;
  height: string;
  ethnicity: string;
  customEthnicity: string;
  city: string;
  sector: string;
  customSector: string;
  workAndStudyPlaces: string[];
  currentOccupation: string;
  basicDescription: string;
  freeDescription: string;
  interests: string[];
  otherInterests: string[];
  futureVision: string;
  nonCompromisableAttributes: string[];
  lookingForAttributes: string[];
  appearanceMustHave: string;
  appearanceMustNotHave: string;
  generalDealBreakers: string;
  existingMatchProfile: string;
  shareInWhatsappGroups: string;
  proposePreference: string;
  phoneNumber: string;
  referencePhones: string[];
  images: string[];
  nameForPrayer: string;
  referralSource: string;
  matchmakerExpectations: string;
  addToPublic: string;
}

const initialForm: FormData = {
  firstName: "",
  lastName: "",
  marriageStatus: marriageStatuses[0],
  age: "",
  height: "",
  ethnicity: ethnicities[0],
  customEthnicity: "",
  city: "",
  sector: sectors[0],
  customSector: "",
  workAndStudyPlaces: [""],
  currentOccupation: "",
  basicDescription: "",
  freeDescription: "",
  interests: [],
  otherInterests: [""],
  futureVision: "",
  nonCompromisableAttributes: ["", "", "", ""],
  lookingForAttributes: [""],
  appearanceMustHave: "",
  appearanceMustNotHave: "",
  generalDealBreakers: "",
  existingMatchProfile: "",
  shareInWhatsappGroups: "לא",
  proposePreference: proposePreferences[2],
  phoneNumber: "",
  referencePhones: [""],
  images: [],
  nameForPrayer: "",
  referralSource: "",
  matchmakerExpectations: "",
  addToPublic: "לא",
};

const SingleForm: React.FC = () => {
  const { matchmakerId } = useParams();
  const [form, setForm] = useState<FormData>(initialForm);
  const [matchmaker, setMatchmaker] = useState<MatchMaker | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!matchmakerId) return;
    apiService
      .getMatchmaker(matchmakerId)
      .then(setMatchmaker)
      .catch((err) => console.error("failed to load matchmaker", err));
  }, [matchmakerId]);

  if (!matchmakerId) {
    return (
      <div className="page-shell">
        <Card>
          <CardContent className="p-6 text-center text-sm md:text-base">
            מצטערים, אי אפשר להירשם מקישור זה. יש ליצור קשר עם אחד השדכנים שלנו.
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const updateArray = (name: keyof FormData, index: number, value: string) => {
    setForm((prev) => {
      const arr = [...(prev[name] as string[])];
      arr[index] = value;
      return { ...prev, [name]: arr };
    });
  };

  const addArrayItem = (name: keyof FormData, value: string) => {
    setForm((prev) => ({
      ...prev,
      [name]: [...(prev[name] as string[]), value],
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const readers = Array.from(files).map((file) => {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
    });
    Promise.all(readers).then((images) => setForm((prev) => ({ ...prev, images })));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const birthDate = new Date();
    birthDate.setFullYear(birthDate.getFullYear() - Number(form.age));

    const payload = {
      firstName: form.firstName,
      lastName: form.lastName,
      marriageStatus: form.marriageStatus,
      birthDate,
      height: form.height ? Number(form.height) : undefined,
      ethnicity: form.ethnicity,
      customEthnicity: form.customEthnicity || undefined,
      city: form.city,
      sectors: [form.sector].filter(Boolean),
      customSector: form.customSector || undefined,
      workAndStudyPlaces: form.workAndStudyPlaces.filter(Boolean),
      currentOccupation: form.currentOccupation || undefined,
      basicDescription: form.basicDescription || undefined,
      freeDescription: form.freeDescription || undefined,
      interests: form.interests.filter(Boolean),
      otherInterests: form.otherInterests.filter(Boolean),
      futureVision: form.futureVision || undefined,
      nonCompromisableAttributes: form.nonCompromisableAttributes,
      lookingForAttributes: form.lookingForAttributes.filter(Boolean),
      appearanceMustHave: form.appearanceMustHave || undefined,
      appearanceMustNotHave: form.appearanceMustNotHave || undefined,
      generalDealBreakers: form.generalDealBreakers || undefined,
      existingMatchProfile: form.existingMatchProfile || undefined,
      shareInWhatsappGroups: form.shareInWhatsappGroups === "כן",
      proposePreference: form.proposePreference,
      phoneNumber: form.phoneNumber,
      referencePhones: form.referencePhones.filter(Boolean),
      images: form.images,
      nameForPrayer: form.nameForPrayer || undefined,
      referralSource: form.referralSource || undefined,
      matchmakerExpectations: form.matchmakerExpectations || undefined,
      isPublic: form.addToPublic === "כן",
    };

    setSubmitting(true);
    try {
      const res = await fetch(
        `${baseURL || "http://localhost:3000"}/singles/register/${matchmakerId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) throw new Error("Failed to submit");
      alert("הפרטים נשלחו לשדכן");
      setForm(initialForm);
    } catch (err) {
      console.error(err);
      alert("שגיאה בשליחת הטופס");
    } finally {
      setSubmitting(false);
    }
  };

  const questionKeys: (keyof FormData)[] = useMemo(
    () => [
      "firstName",
      "lastName",
      "marriageStatus",
      "age",
      "height",
      "ethnicity",
      "city",
      "sector",
      "workAndStudyPlaces",
      "currentOccupation",
      "basicDescription",
      "freeDescription",
      "interests",
      "futureVision",
      "nonCompromisableAttributes",
      "lookingForAttributes",
      "appearanceMustHave",
      "appearanceMustNotHave",
      "generalDealBreakers",
      "existingMatchProfile",
      "shareInWhatsappGroups",
      "addToPublic",
      "proposePreference",
      "phoneNumber",
      "referencePhones",
      "images",
      "nameForPrayer",
      "referralSource",
      "matchmakerExpectations",
    ],
    []
  );

  const progress = useMemo(() => {
    const answered = questionKeys.filter((key) => {
      const value = form[key];
      if (Array.isArray(value)) return value.some((v) => v);
      return value !== "" && value !== undefined && value !== null;
    }).length;
    return Math.round((answered / questionKeys.length) * 100);
  }, [form, questionKeys]);

  return (
    <div className="page-shell mx-auto max-w-5xl">
      <ProgressBar percent={progress} />

      <div className="mb-5">
        <h2 className="text-2xl font-extrabold text-foreground">שאלון היכרות</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          נשמח שתענה בכנות ובפירוט. המידע מסייע להתאמה מדויקת יותר.
        </p>
      </div>

      {matchmaker && (
        <Card className="mb-4 border-primary/20 bg-primary/5">
          <CardContent className="space-y-2 p-4 text-sm leading-6">
            <p>שלום לך, אנחנו שמחים שהגעת למאגר שלנו.</p>
            <p>
              מגזרי התמחות:{" "}
              {(matchmaker.expertSectors || [])
                .map((sector) => sectorLabels[sector] || sector)
                .join(", ")}
              .
            </p>
            <p>
              טווח גילאים מקובל: {matchmaker.ageRange?.min}-{matchmaker.ageRange?.max}
            </p>
            <p>
              כאן בשבילך, {matchmaker.firstName} - {matchmaker.phoneNumber}
            </p>
          </CardContent>
        </Card>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <QuestionBlock label="שם פרטי">
          <Input name="firstName" value={form.firstName} onChange={handleChange} required />
        </QuestionBlock>

        <QuestionBlock label="שם משפחה">
          <Input name="lastName" value={form.lastName} onChange={handleChange} required />
        </QuestionBlock>

        <QuestionBlock label="סטטוס">
          <Select name="marriageStatus" value={form.marriageStatus} onChange={handleChange}>
            {marriageStatuses.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </Select>
        </QuestionBlock>

        <QuestionBlock label="גיל">
          <Input type="number" name="age" value={form.age} onChange={handleChange} required />
        </QuestionBlock>

        <QuestionBlock label="גובה">
          <Input type="number" name="height" value={form.height} onChange={handleChange} />
        </QuestionBlock>

        <QuestionBlock label="עדה">
          <>
            <Select name="ethnicity" value={form.ethnicity} onChange={handleChange}>
              {ethnicities.map((ethnicity) => (
                <option key={ethnicity}>{ethnicity}</option>
              ))}
            </Select>
            {form.ethnicity === "אחר/ת" && (
              <Input
                name="customEthnicity"
                value={form.customEthnicity}
                onChange={handleChange}
                placeholder="פירוט"
              />
            )}
          </>
        </QuestionBlock>

        <QuestionBlock label="מקום מגורים">
          <Input name="city" value={form.city} onChange={handleChange} required />
        </QuestionBlock>

        <QuestionBlock label="סגנון דתי">
          <>
            <Select name="sector" value={form.sector} onChange={handleChange}>
              {sectors.map((opt) => (
                <option key={opt}>{opt}</option>
              ))}
            </Select>
            {form.sector === "אחר/ת" && (
              <Input
                name="customSector"
                value={form.customSector}
                onChange={handleChange}
                placeholder="פירוט"
              />
            )}
          </>
        </QuestionBlock>

        <QuestionBlock label="מוסדות לימוד ומקומות עבודה לאורך החיים">
          <>
            {form.workAndStudyPlaces.map((item, idx) => (
              <Input
                key={idx}
                value={item}
                onChange={(e) => updateArray("workAndStudyPlaces", idx, e.target.value)}
              />
            ))}
            <Button
              variant="secondary"
              onClick={() => addArrayItem("workAndStudyPlaces", "")}
            >
              הוסף שורה
            </Button>
          </>
        </QuestionBlock>

        <QuestionBlock label="מה את/ה עושה כיום">
          <Textarea
            name="currentOccupation"
            value={form.currentOccupation}
            onChange={handleChange}
            rows={3}
          />
        </QuestionBlock>

        <QuestionBlock label="ספר/י על עצמך בצורה תכל'סית">
          <Textarea
            name="basicDescription"
            value={form.basicDescription}
            onChange={handleChange}
            rows={3}
          />
        </QuestionBlock>

        <QuestionBlock label="ספר/י על עצמך מעבר לסטנדרט">
          <Textarea
            name="freeDescription"
            value={form.freeDescription}
            onChange={handleChange}
            rows={3}
          />
        </QuestionBlock>

        <QuestionBlock label="תחומי עניין">
          <>
            {form.interests.map((item, idx) => (
              <Select
                key={idx}
                value={item}
                onChange={(e) => updateArray("interests", idx, e.target.value)}
              >
                {interests.map((opt) => (
                  <option key={opt}>{opt}</option>
                ))}
              </Select>
            ))}
            <Button variant="secondary" onClick={() => addArrayItem("interests", interests[0])}>
              הוסף תחום עניין
            </Button>

            {form.interests.includes("אחר/ת") && (
              <>
                {form.otherInterests.map((item, idx) => (
                  <Input
                    key={idx}
                    value={item}
                    onChange={(e) => updateArray("otherInterests", idx, e.target.value)}
                    placeholder="תחום נוסף"
                  />
                ))}
                <Button
                  variant="secondary"
                  onClick={() => addArrayItem("otherInterests", "")}
                >
                  הוסף תחום נוסף
                </Button>
              </>
            )}
          </>
        </QuestionBlock>

        <QuestionBlock label="איפה את/ה רואה את עצמך בעתיד">
          <Textarea
            name="futureVision"
            value={form.futureVision}
            onChange={handleChange}
            rows={3}
          />
        </QuestionBlock>

        <QuestionBlock label="4 דברים קריטיים בבן/בת זוג">
          <>
            {form.nonCompromisableAttributes.map((item, idx) => (
              <Input
                key={idx}
                value={item}
                onChange={(e) =>
                  updateArray("nonCompromisableAttributes", idx, e.target.value)
                }
              />
            ))}
          </>
        </QuestionBlock>

        <QuestionBlock label="מה עוד תשמח/י שיהיה בבן/בת הזוג">
          <>
            {form.lookingForAttributes.map((item, idx) => (
              <Input
                key={idx}
                value={item}
                onChange={(e) => updateArray("lookingForAttributes", idx, e.target.value)}
              />
            ))}
            <Button
              variant="secondary"
              onClick={() => addArrayItem("lookingForAttributes", "")}
            >
              הוסף תכונה
            </Button>
          </>
        </QuestionBlock>

        <QuestionBlock label="מה חשוב במראה חיצוני">
          <Textarea
            name="appearanceMustHave"
            value={form.appearanceMustHave}
            onChange={handleChange}
            rows={3}
          />
        </QuestionBlock>

        <QuestionBlock label="מה לא מקובל במראה חיצוני">
          <Textarea
            name="appearanceMustNotHave"
            value={form.appearanceMustNotHave}
            onChange={handleChange}
            rows={3}
          />
        </QuestionBlock>

        <QuestionBlock label="Deal breakers כלליים">
          <Textarea
            name="generalDealBreakers"
            value={form.generalDealBreakers}
            onChange={handleChange}
            rows={3}
          />
        </QuestionBlock>

        <QuestionBlock label="כרטיס שידוכים קיים">
          <Textarea
            name="existingMatchProfile"
            value={form.existingMatchProfile}
            onChange={handleChange}
            rows={3}
          />
        </QuestionBlock>

        <QuestionBlock label="האם לשתף בקבוצות וואטסאפ">
          <Select
            name="shareInWhatsappGroups"
            value={form.shareInWhatsappGroups}
            onChange={handleChange}
          >
            <option>כן</option>
            <option>לא</option>
          </Select>
        </QuestionBlock>

        <QuestionBlock label="להוסיף למאגר הציבורי של השדכנים">
          <Select name="addToPublic" value={form.addToPublic} onChange={handleChange}>
            <option>כן</option>
            <option>לא</option>
          </Select>
        </QuestionBlock>

        <QuestionBlock label="אם יש רעיון, למי להציע קודם">
          <Select
            name="proposePreference"
            value={form.proposePreference}
            onChange={handleChange}
          >
            {proposePreferences.map((preference) => (
              <option key={preference}>{preference}</option>
            ))}
          </Select>
        </QuestionBlock>

        <QuestionBlock label="מספר טלפון שלך">
          <Input
            name="phoneNumber"
            value={form.phoneNumber}
            onChange={handleChange}
            required
          />
        </QuestionBlock>

        <QuestionBlock label="מספרים לבירור (שם + טלפון)">
          <>
            {form.referencePhones.map((item, idx) => (
              <Input
                key={idx}
                value={item}
                onChange={(e) => updateArray("referencePhones", idx, e.target.value)}
              />
            ))}
            <Button variant="secondary" onClick={() => addArrayItem("referencePhones", "")}>
              הוסף מספר
            </Button>
          </>
        </QuestionBlock>

        <QuestionBlock label="צרפ/י לפחות שתי תמונות">
          <Input type="file" accept="image/*" multiple onChange={handleImageChange} />
        </QuestionBlock>

        <QuestionBlock label="שם לתפילה">
          <Textarea
            name="nameForPrayer"
            value={form.nameForPrayer}
            onChange={handleChange}
            rows={3}
          />
        </QuestionBlock>

        <QuestionBlock label="איך הגעת אלינו">
          <Textarea
            name="referralSource"
            value={form.referralSource}
            onChange={handleChange}
            rows={3}
          />
        </QuestionBlock>

        <QuestionBlock label="מה הציפיות שלך מאיתנו">
          <Textarea
            name="matchmakerExpectations"
            value={form.matchmakerExpectations}
            onChange={handleChange}
            rows={3}
          />
        </QuestionBlock>

        <Button type="submit" disabled={submitting} className="w-full text-base">
          {submitting ? "שולח..." : "שלח טופס"}
        </Button>
      </form>

      {matchmaker?.priceRange && (
        <p className="mt-4 text-center text-sm text-muted-foreground">
          דמי שידוך: {matchmaker.priceRange.min}-{matchmaker.priceRange.max} ש"ח
        </p>
      )}
    </div>
  );
};

export default SingleForm;
