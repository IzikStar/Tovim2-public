import type { ReactNode } from 'react';
import type { PublicSingle, Single } from '../api/types';
import { ageFromBirthYear, genderize, sectorLabel } from '../lib/format';
import { Avatar } from './ui';

type CardSingle = PublicSingle & Partial<Pick<Single, 'lastName' | 'images' | 'isPublic'>>;

export function SingleCard({ single, actions, footer }: { single: CardSingle; actions?: ReactNode; footer?: ReactNode }) {
  const age = ageFromBirthYear(single.birthYear);
  return (
    <article className={`card single-card single-card--${single.gender === 'נקבה' ? 'f' : 'm'}`}>
      <div className="single-card__head">
        <Avatar image={single.images?.[0]} firstName={single.firstName} lastName={single.lastName} />
        <div>
          <h3 className="single-card__name">
            {single.firstName} {single.lastName}
          </h3>
          <div className="single-card__meta">
            {age} · {single.city} · {genderize(single.marriageStatus, single.gender)}
          </div>
        </div>
      </div>
      <div className="single-card__tags">
        <span className="tag">{sectorLabel(single)}</span>
        {single.height && <span className="tag">{single.height} ס"מ</span>}
        {single.currentOccupation && <span className="tag">{single.currentOccupation}</span>}
      </div>
      {single.basicDescription && <p className="single-card__desc">{single.basicDescription}</p>}
      {footer}
      {actions && <div className="single-card__actions">{actions}</div>}
    </article>
  );
}
