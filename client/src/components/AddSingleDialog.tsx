import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Copy, MessageCircle, PenLine } from 'lucide-react';
import { cn } from '../lib/utils';
import { Modal } from './ui';
import { Button, buttonVariants } from './ui/button';

export const registrationUrl = (matchMakerId: string) => `${window.location.origin}/register/${matchMakerId}`;

const MESSAGE = 'שלום! כדי שאוכל להתחיל לחפש לך הצעות, אשמח שתמלא/י את השאלון הקצר בקישור:';

/** Copy / WhatsApp buttons for the matchmaker's self-registration link. */
export function ShareRegistration({ matchMakerId, compact }: { matchMakerId: string; compact?: boolean }) {
  const url = registrationUrl(matchMakerId);
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('העתיקו את הקישור:', url);
    }
  };
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(`${MESSAGE}\n${url}`)}`;
  return (
    <div className={cn('flex w-full flex-col gap-2', compact && 'mx-auto mt-3 max-w-[460px]')}>
      <code
        dir="ltr"
        className="block truncate rounded-md border bg-card px-2.5 py-2 text-start text-[0.85em] text-foreground"
      >
        {url}
      </code>
      <div className={cn('flex flex-wrap gap-2', compact && 'justify-center')}>
        <Button size="sm" onClick={copy}>
          {!copied && <Copy aria-hidden />}
          {copied ? 'הועתק ✓' : 'העתקת קישור'}
        </Button>
        <a className={buttonVariants({ variant: 'whatsapp', size: 'sm' })} href={whatsapp} target="_blank" rel="noreferrer">
          <MessageCircle aria-hidden />
          שליחה בוואטסאפ
        </a>
      </div>
    </div>
  );
}

/**
 * Adding a candidate: the main way is to send them the questionnaire so they
 * fill it in themselves; manual entry stays available for the matchmaker.
 */
export function AddSingleDialog({ matchMakerId, onClose }: { matchMakerId: string; onClose: () => void }) {
  return (
    <Modal title="הוספת מועמד/ת" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <div>
          <h3 className="mb-1">שולחים למועמד/ת את השאלון</h3>
          <p className="mb-3 text-sm text-muted-foreground">
            המועמד/ת ממלא/ת את הפרטים בעצמו/ה, בלשון שלו/ה ובקצב שלו/ה. הכרטיס מגיע ישר לרשימה שלך.
          </p>
          <ShareRegistration matchMakerId={matchMakerId} />
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground before:h-px before:flex-1 before:bg-border before:content-[''] after:h-px after:flex-1 after:bg-border after:content-['']">
          או
        </div>
        <Link to="/singles/new" className={buttonVariants({ variant: 'outline' })} onClick={onClose}>
          <PenLine aria-hidden />
          מילוי ידני על ידי
        </Link>
      </div>
    </Modal>
  );
}
