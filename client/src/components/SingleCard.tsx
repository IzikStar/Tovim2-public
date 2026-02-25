import { Plus } from "lucide-react";
import { Single } from "../utils/types";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";

interface Props {
  single: Single;
  onSelect?: (single: Single) => void;
  onAddToPrivate?: (single: Single) => void;
}

const SingleCard: React.FC<Props> = ({ single, onSelect, onAddToPrivate }) => {
  const age =
    single.birthDate && !isNaN(new Date(single.birthDate).getTime())
      ? new Date().getFullYear() - new Date(single.birthDate).getFullYear()
      : undefined;

  const summary = [single.city, age ? `${age}` : undefined, single.marriageStatus]
    .filter(Boolean)
    .join(" • ");

  const genderAccent =
    single.gender === "זכר"
      ? "from-sky-100 to-cyan-50 border-sky-200"
      : "from-rose-100 to-orange-50 border-rose-200";

  const imageSrc = single.images?.[0] || "https://placehold.co/800x900?text=No+Image";

  return (
    <Card
      className={`group cursor-pointer overflow-hidden border bg-gradient-to-br ${genderAccent} transition hover:-translate-y-1 hover:shadow-lg`}
      onClick={() => onSelect?.(single)}
    >
      <div className="relative">
        <img
          className="h-52 w-full object-cover"
          src={imageSrc}
          alt={single.firstName}
        />
        {single.isTaken && (
          <Badge variant="accent" className="absolute left-3 top-3">
            תפוס
          </Badge>
        )}
      </div>
      <CardContent className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg font-bold leading-tight">
            {single.firstName} {single.lastName}
          </h3>
        </div>

        {summary && <p className="text-sm text-muted-foreground">{summary}</p>}
        {single.sectors?.length ? (
          <div className="flex flex-wrap gap-1">
            {single.sectors.slice(0, 3).map((sector) => (
              <Badge key={sector} variant="outline">
                {sector}
              </Badge>
            ))}
          </div>
        ) : null}

        {single.attributes?.length ? (
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {single.attributes.join(", ")}
          </p>
        ) : null}

        {onAddToPrivate && (
          <div className="pt-1">
            <Button
              variant="secondary"
              className="w-full gap-2"
              onClick={(e) => {
                e.stopPropagation();
                onAddToPrivate(single);
              }}
            >
              <Plus className="h-4 w-4" />
              הוסף למאגר
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SingleCard;
