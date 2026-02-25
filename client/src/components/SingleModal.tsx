import { useState } from "react";
import { ChevronLeft, ChevronRight, Clipboard, MessageCircle } from "lucide-react";
import { Single } from "../utils/types";
import apiService from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface Props {
  single: Single;
  onClose: () => void;
  onRefresh: () => void;
}

const questions: { key: keyof Single; text: string }[] = [
  { key: "firstName", text: "שם פרטי" },
  { key: "lastName", text: "שם משפחה" },
  { key: "phoneNumber", text: "טלפון" },
  { key: "email", text: "אימייל" },
  { key: "city", text: "עיר" },
  { key: "gender", text: "מגדר" },
  { key: "sectors", text: "מגזר" },
  { key: "birthDate", text: "גיל" },
  { key: "height", text: "גובה" },
  { key: "marriageStatus", text: "מצב משפחתי" },
  { key: "numOfChildren", text: "מספר ילדים" },
  { key: "ethnicity", text: "עדה" },
  { key: "workAndStudyPlaces", text: "לימודים ועבודה" },
  { key: "currentOccupation", text: "עיסוק" },
  { key: "basicDescription", text: "תיאור בסיסי" },
  { key: "freeDescription", text: "תיאור חופשי" },
  { key: "interests", text: "תחומי עניין" },
  { key: "otherInterests", text: "תחומי עניין נוספים" },
  { key: "futureVision", text: "חזון לעתיד" },
  { key: "nonCompromisableAttributes", text: "דברים קריטיים בבן/בת זוג" },
  { key: "lookingForAttributes", text: "מה חשוב שיהיה בבן/בת זוג" },
  { key: "appearanceMustHave", text: "חשוב במראה" },
  { key: "appearanceMustNotHave", text: "חשוב שלא יהיה במראה" },
  { key: "generalDealBreakers", text: "Deal breakers" },
  { key: "existingMatchProfile", text: "כרטיס שידוכים קיים" },
  { key: "shareInWhatsappGroups", text: "שיתוף בקבוצות וואטסאפ" },
  { key: "proposePreference", text: "למי להציע קודם" },
  { key: "referencePhones", text: "טלפונים לבירור" },
  { key: "nameForPrayer", text: "שם לתפילה" },
  { key: "referralSource", text: "מקור היכרות" },
  { key: "matchmakerExpectations", text: "ציפיות מהשדכן" },
];

const formatValue = (
  key: string,
  value: unknown,
  single: Single
): string[] | string | null => {
  if (value === undefined || value === null) return null;

  if (key === "sectors") {
    const arr = Array.isArray(value) ? value : [String(value)];
    return arr.map((sector) => (sector === "אחר/ת" ? single.customSector || sector : sector));
  }

  if (key === "birthDate") {
    return String(new Date().getFullYear() - new Date(value as string).getFullYear());
  }

  if (key === "ethnicity" && value === "אחר/ת") {
    return single.customEthnicity || null;
  }

  if (key === "interests") {
    const arr = Array.isArray(value) ? value : [String(value)];
    return arr.map((interest) =>
      interest === "אחר/ת" && single.otherInterests?.length
        ? single.otherInterests.join(", ")
        : interest
    );
  }

  if (Array.isArray(value)) {
    return value.map(String);
  }

  if (typeof value === "boolean") {
    return value ? "כן" : "לא";
  }

  if (typeof value === "object") {
    if (key === "desiredAgeRange") {
      const range = value as { min?: number; max?: number };
      return `${range.min ?? ""}-${range.max ?? ""}`;
    }
    return JSON.stringify(value);
  }

  return String(value);
};

const gatherDetails = (single: Single) => {
  const lines: string[] = [];
  questions.forEach(({ key, text }) => {
    const value = formatValue(String(key), single[key], single);
    if (!value) return;
    lines.push(`${text}: ${Array.isArray(value) ? value.join(", ") : value}`);
  });
  single.images?.forEach((img, i) => lines.push(`תמונה ${i + 1}: ${img}`));
  return lines.join("\n");
};

const SingleModal: React.FC<Props> = ({ single, onClose, onRefresh }) => {
  const { matchMakerId } = useAuth();
  const images = single.images?.length
    ? single.images
    : ["https://placehold.co/800x900?text=No+Image"];
  const [index, setIndex] = useState(0);

  const next = () => setIndex((i) => (i + 1) % images.length);
  const prev = () => setIndex((i) => (i - 1 + images.length) % images.length);

  const copy = () => {
    navigator.clipboard.writeText(gatherDetails(single));
  };

  const shareWhatsapp = () => {
    const text = gatherDetails(single);
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  const toggleTaken = async () => {
    await apiService.updateSingle(single.id, { isTaken: !single.isTaken });
    onRefresh();
    onClose();
  };

  const markMarried = async () => {
    if (!matchMakerId) return;
    await apiService.updateSingle(single.id, {
      marriedMatchmaker: matchMakerId,
    });
    onRefresh();
    onClose();
  };

  const deleteSingle = async () => {
    if (!window.confirm("האם למחוק את הכרטיס?")) return;
    await apiService.deleteSingle(single.id);
    onRefresh();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-black/60 p-4 md:items-center"
      onClick={onClose}
    >
      <Card
        className="w-full max-w-4xl overflow-hidden border-border/70"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="border-b border-border/70 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-2xl">
                {single.firstName} {single.lastName}
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                פרטי סינגל מלאים
              </p>
            </div>
            <div className="flex items-center gap-2">
              {single.isTaken && <Badge variant="accent">תפוס</Badge>}
              <Button variant="ghost" onClick={onClose}>
                סגור
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="grid gap-4 p-4 md:grid-cols-[320px_1fr] md:p-6">
          <div className="space-y-3">
            <div className="relative overflow-hidden rounded-lg border border-border/70 bg-muted">
              <img
                src={images[index]}
                alt={single.firstName}
                className="h-[360px] w-full object-cover"
              />
              {images.length > 1 && (
                <>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2"
                    onClick={prev}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    onClick={next}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" className="gap-2" onClick={copy}>
                <Clipboard className="h-4 w-4" />
                העתק
              </Button>
              <Button variant="accent" className="gap-2" onClick={shareWhatsapp}>
                <MessageCircle className="h-4 w-4" />
                וואטסאפ
              </Button>
              <Button variant="outline" onClick={toggleTaken}>
                {single.isTaken ? "סמן כפנוי" : "סמן כתפוס"}
              </Button>
              <Button variant="outline" onClick={markMarried}>
                נשוי בזכותי
              </Button>
            </div>

            <Button variant="destructive" className="w-full" onClick={deleteSingle}>
              מחק כרטיס
            </Button>
          </div>

          <div className="max-h-[68vh] space-y-3 overflow-y-auto rounded-lg border border-border/70 bg-muted/40 p-3 md:p-4">
            {questions.map(({ key, text }) => {
              const value = formatValue(String(key), single[key], single);
              if (!value || (Array.isArray(value) && value.length === 0)) return null;

              return (
                <div
                  key={String(key)}
                  className="rounded-md border border-border/70 bg-card p-3"
                >
                  <p className="mb-1 text-xs font-bold uppercase tracking-wide text-primary">
                    {text}
                  </p>
                  {Array.isArray(value) ? (
                    <ul className="list-inside list-disc space-y-1 text-sm">
                      {value.map((item, i) => (
                        <li key={`${String(key)}-${i}`}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="whitespace-pre-line text-sm">{value}</p>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SingleModal;
