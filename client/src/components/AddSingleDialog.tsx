import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Modal } from './ui';

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
    <div className={`share${compact ? ' share--compact' : ''}`}>
      <code dir="ltr" className="share__url">
        {url}
      </code>
      <div className="share__buttons">
        <button type="button" className="btn btn--primary btn--sm" onClick={copy}>
          {copied ? 'הועתק ✓' : 'העתקת קישור'}
        </button>
        <a className="btn btn--whatsapp btn--sm" href={whatsapp} target="_blank" rel="noreferrer">
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
      <div className="stack">
        <div>
          <h3>שולחים למועמד/ת את השאלון</h3>
          <p className="muted">
            המועמד/ת ממלא/ת את הפרטים בעצמו/ה, בלשון שלו/ה ובקצב שלו/ה. הכרטיס מגיע ישר לרשימה שלך.
          </p>
          <ShareRegistration matchMakerId={matchMakerId} />
        </div>
        <div className="divider">או</div>
        <Link to="/singles/new" className="btn btn--ghost" onClick={onClose}>
          מילוי ידני על ידי
        </Link>
      </div>
    </Modal>
  );
}
