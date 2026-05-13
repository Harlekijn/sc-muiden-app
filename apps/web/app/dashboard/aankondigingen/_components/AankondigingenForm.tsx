'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TipTapEditor } from './TipTapEditor';
import type { AnnouncementWithAuthor } from '@sc-muiden/shared';

interface AankondigingenFormProps {
  announcement?: AnnouncementWithAuthor;
}

type SportFilter = 'alle' | 'voetbal' | 'hockey';
type FormAction = 'concept' | 'publiceren';

export function AankondigingenForm({ announcement }: AankondigingenFormProps) {
  const router = useRouter();
  const isEdit = !!announcement;
  const isAlreadyPublished = !!(announcement?.published_at);

  const [title, setTitle] = useState(announcement?.title ?? '');
  const [body, setBody] = useState(announcement?.body ?? '');
  const [sport, setSport] = useState<SportFilter>(
    !announcement?.sport || announcement.sport.length === 0
      ? 'alle'
      : (announcement.sport[0] as SportFilter)
  );
  const [titleError, setTitleError] = useState('');
  const [bodyError, setBodyError] = useState('');
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [isPending, setIsPending] = useState(false);

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToastMsg(msg);
    setToastType(type);
    setTimeout(() => setToastMsg(''), 4000);
  }

  function validate(): boolean {
    let ok = true;
    if (!title.trim()) { setTitleError('Titel is verplicht'); ok = false; }
    else if (title.length > 200) { setTitleError('Titel mag maximaal 200 tekens bevatten'); ok = false; }
    else setTitleError('');

    const stripped = body.replace(/<[^>]*>/g, '').trim();
    if (!stripped) { setBodyError('Bericht is verplicht'); ok = false; }
    else setBodyError('');

    return ok;
  }

  async function handleSubmit(action: FormAction) {
    if (!validate()) return;
    setIsPending(true);

    const sportValue = sport === 'alle' ? null : [sport];

    try {
      if (isEdit && announcement) {
        if (action === 'publiceren' && !isAlreadyPublished) {
          // Publiceren via dedicated route
          const res = await fetch(`/api/cms/announcements/${announcement.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, body, sport: sportValue }),
          });
          if (!res.ok) throw new Error('Opslaan mislukt');

          const pubRes = await fetch(`/api/cms/announcements/${announcement.id}/publiceren`, {
            method: 'POST',
          });
          if (!pubRes.ok) throw new Error('Publiceren mislukt');
          showToast('Aankondiging gepubliceerd');
        } else {
          const res = await fetch(`/api/cms/announcements/${announcement.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, body, sport: sportValue }),
          });
          if (!res.ok) throw new Error('Opslaan mislukt');
          showToast('Wijzigingen opgeslagen');
        }
      } else {
        const res = await fetch('/api/cms/announcements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, body, sport: sportValue }),
        });
        if (!res.ok) throw new Error('Opslaan mislukt');

        const created = await res.json() as { id: string };

        if (action === 'publiceren') {
          const pubRes = await fetch(`/api/cms/announcements/${created.id}/publiceren`, { method: 'POST' });
          if (!pubRes.ok) throw new Error('Publiceren mislukt');
          showToast('Aankondiging gepubliceerd');
        } else {
          showToast('Aankondiging opgeslagen als concept');
        }
      }

      router.push('/dashboard/aankondigingen');
      router.refresh();
    } catch {
      showToast('Opslaan mislukt. Probeer het opnieuw.', 'error');
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div style={{ maxWidth: 800 }}>
      {toastMsg && (
        <div
          style={{
            padding: 'var(--space-3) var(--space-4)',
            borderRadius: 'var(--radius-md)',
            background: toastType === 'error' ? 'var(--color-error)' : 'var(--color-success)',
            color: 'var(--color-white)',
            marginBottom: 'var(--space-4)',
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-sm)',
          }}
        >
          {toastMsg}
        </div>
      )}

      <div
        style={{
          background: 'var(--color-white)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-card)',
          padding: 'var(--space-6)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-5)',
        }}
      >
        {/* Titel */}
        <div>
          <label
            style={{
              display: 'block',
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-sm)',
              fontWeight: 600,
              color: 'var(--color-text)',
              marginBottom: 'var(--space-1)',
            }}
          >
            Titel
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Geef de aankondiging een titel"
            disabled={isPending}
            style={{
              width: '100%',
              padding: 'var(--space-2) var(--space-3)',
              border: `1px solid ${titleError ? 'var(--color-error)' : 'var(--color-mid)'}`,
              borderRadius: 'var(--radius-md)',
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-base)',
              color: 'var(--color-text)',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          {titleError && (
            <p style={{ color: 'var(--color-error)', fontSize: 'var(--text-xs)', marginTop: 4 }}>
              {titleError}
            </p>
          )}
        </div>

        {/* Doelgroep */}
        <div>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-sm)',
              fontWeight: 600,
              color: 'var(--color-text)',
              marginBottom: 'var(--space-2)',
            }}
          >
            Doelgroep
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
            {(['alle', 'voetbal', 'hockey'] as SportFilter[]).map((opt) => (
              <label
                key={opt}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                  color: opt === 'alle' ? 'var(--color-text)' : 'var(--color-blue)',
                }}
              >
                <input
                  type="radio"
                  name="sport"
                  value={opt}
                  checked={sport === opt}
                  onChange={() => setSport(opt)}
                  disabled={isPending}
                />
                {opt === 'alle' ? 'Alle leden' : opt.charAt(0).toUpperCase() + opt.slice(1)}
              </label>
            ))}
          </div>
        </div>

        {/* Body */}
        <div>
          <label
            style={{
              display: 'block',
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-sm)',
              fontWeight: 600,
              color: 'var(--color-text)',
              marginBottom: 'var(--space-1)',
            }}
          >
            Bericht
          </label>
          <TipTapEditor
            content={body}
            onChange={setBody}
            announcementId={announcement?.id}
            disabled={isPending}
          />
          {bodyError && (
            <p style={{ color: 'var(--color-error)', fontSize: 'var(--text-xs)', marginTop: 4 }}>
              {bodyError}
            </p>
          )}
        </div>

        {/* Actie-knoppen */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
          <button
            type="button"
            disabled={isPending}
            onClick={() => handleSubmit('concept')}
            style={{
              padding: 'var(--space-2) var(--space-5)',
              border: '1px solid var(--color-navy)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-white)',
              color: 'var(--color-navy)',
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-base)',
              fontWeight: 500,
              cursor: isPending ? 'not-allowed' : 'pointer',
              opacity: isPending ? 0.5 : 1,
            }}
          >
            {isAlreadyPublished ? 'Opslaan' : 'Opslaan als concept'}
          </button>
          {!isAlreadyPublished && (
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleSubmit('publiceren')}
              style={{
                padding: 'var(--space-2) var(--space-5)',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-blue)',
                color: 'var(--color-white)',
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-base)',
                fontWeight: 500,
                cursor: isPending ? 'not-allowed' : 'pointer',
                opacity: isPending ? 0.5 : 1,
              }}
            >
              {isEdit ? 'Publiceren' : 'Nu publiceren'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
