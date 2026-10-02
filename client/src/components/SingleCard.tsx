import type { ReactNode } from 'react';
import type { PublicSingle, Single } from '../api/types';
import { genderize, sectorLabel } from '../lib/format';
import { cn } from '../lib/utils';
import { Badge } from './ui/badge';
import { Avatar } from './ui';

type CardSingle = PublicSingle & Partial<Pick<Single, 'lastName' | 'images' | 'isPublic'>>;

export function SingleCard({ single, actions, footer }: { single: CardSingle; actions?: ReactNode; footer?: ReactNode }) {
  const age = single.age;
  const female = single.gender === 'נקבה';
  return (
    <article
      className={cn(
        'flex h-full flex-col gap-3 rounded-lg border border-t-4 bg-card p-5 text-card-foreground shadow-soft transition-[transform,box-shadow] duration-150',
        '[a:hover>&]:-translate-y-0.5 [a:hover>&]:shadow-lift',
        female ? 'border-t-[#d8a6bd]' : 'border-t-[#8fb7c9]'
      )}
    >
      <div className="flex items-center gap-3.5">
        <Avatar image={single.images?.[0]} firstName={single.firstName} lastName={single.lastName} />
        <div className="min-w-0">
          <h3 className="m-0 truncate text-lg font-semibold leading-snug">
            {single.firstName} {single.lastName}
          </h3>
          <div className="text-sm text-muted-foreground">
            {age} · {single.city} · {genderize(single.marriageStatus, single.gender)}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <Badge variant="neutral" className="rounded-md font-medium">
          {sectorLabel(single)}
        </Badge>
        {single.height && (
          <Badge variant="neutral" className="rounded-md font-medium">
            {single.height} ס"מ
          </Badge>
        )}
        {single.currentOccupation && (
          <Badge variant="neutral" className="max-w-full truncate rounded-md font-medium">
            {single.currentOccupation}
          </Badge>
        )}
      </div>
      {single.basicDescription && <p className="m-0 line-clamp-3 text-[0.93rem] leading-relaxed text-foreground/80">{single.basicDescription}</p>}
      {footer}
      {actions && <div className="mt-auto flex flex-wrap gap-2 pt-1">{actions}</div>}
    </article>
  );
}
