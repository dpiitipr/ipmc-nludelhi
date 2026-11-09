'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export type SlotItem = {
  slot: string;
  label: string;
  expected: string;
  done: null | { name: string; recorded: string; received: string; lateHours: number; nameOk: boolean };
};

type Status = 'none' | 'before' | 'open' | 'late' | 'closed';

const EXTS: Record<string, string[]> = {
  P_pdf: ['pdf'], D_pdf: ['pdf'], P_word: ['doc', 'docx'], D_word: ['doc', 'docx'],
};
const ACCEPT: Record<string, string> = {
  P_pdf: '.pdf', D_pdf: '.pdf', P_word: '.doc,.docx', D_word: '.doc,.docx',
};

const putFile = (url: string, mime: string, file: File, onProgress: (p: number) => void) =>
  new Promise<string | null>((resolve, reject) => {
    const x = new XMLHttpRequest();
    x.open('PUT', url);
    x.setRequestHeader('Content-Type', mime);
    x.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    x.onload = () => {
      if (x.status < 200 || x.status >= 300) return reject(new Error(`Upload failed (HTTP ${x.status}).`));
      try { resolve(JSON.parse(x.responseText).id ?? null); } catch { resolve(null); }
    };
    x.onerror = () => reject(new Error('Network error during upload. Check your connection.'));
    x.ontimeout = () => reject(new Error('Upload timed out. Please try again.'));
    x.timeout = 600000;
    x.send(file);
  });

export default function MemorialUpload({
  status, deadlineLabel, hardCloseLabel, items,
}: { status: Status; deadlineLabel: string; hardCloseLabel: string; items: SlotItem[] }) {
  const router = useRouter();
  const pending = items.filter((i) => !i.done);
  const canUpload = status === 'open' || status === 'late';

  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [reviewing, setReviewing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState('');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  const allPicked = pending.length > 0 && pending.every((i) => files[i.slot]);

  const pick = (item: SlotItem, f: File | undefined) => {
    setResult(null);
    if (!f) { setFiles((s) => ({ ...s, [item.slot]: null })); return; }
    const ext = f.name.split('.').pop()?.toLowerCase() || '';
    if (!EXTS[item.slot].includes(ext)) {
      setFiles((s) => ({ ...s, [item.slot]: null }));
      setErrs((s) => ({ ...s, [item.slot]: `Please choose a ${EXTS[item.slot].join(' or ')} file.` }));
      return;
    }
    setErrs((s) => ({ ...s, [item.slot]: '' }));
    setFiles((s) => ({ ...s, [item.slot]: f }));
  };

  const run = async () => {
    setBusy(true);
    setResult(null);
    const n = pending.length;
    let current = '';
    try {
      // 1. start every slot first, so all start times are stamped at the moment of confirming
      setPhase('Starting…');
      const inits: Record<string, { uploadUrl: string; mime: string }> = {};
      for (const item of pending) {
        current = item.label;
        const f = files[item.slot]!;
        const r = await fetch('/api/memorial/init', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slot: item.slot, fileName: f.name, size: f.size }),
        });
        const j = await r.json().catch(() => ({}));
        if (!r.ok || !j.uploadUrl) throw new Error(j.error || 'Could not start the upload.');
        inits[item.slot] = j;
      }

      // 2. upload each file straight to Drive
      const ids: Record<string, string | null> = {};
      for (let k = 0; k < n; k++) {
        const item = pending[k];
        current = item.label;
        setPhase(`Uploading file ${k + 1} of ${n}`);
        ids[item.slot] = await putFile(inits[item.slot].uploadUrl, inits[item.slot].mime, files[item.slot]!, (p) =>
          setProgress(Math.round(((k + p / 100) / n) * 100))
        );
      }

      // 3. record each one
      setPhase('Recording your submission…');
      for (const item of pending) {
        current = item.label;
        const r = await fetch('/api/memorial/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slot: item.slot, fileId: ids[item.slot] }),
        });
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j.error || 'Could not confirm the upload.');
      }

      setResult({ ok: true, text: 'All files submitted. Your memorials have been recorded.' });
      setFiles({});
      setReviewing(false);
      router.refresh();
    } catch (err: unknown) {
      setResult({
        ok: false,
        text: `${current ? current + ': ' : ''}${err instanceof Error ? err.message : 'Upload failed.'} Files already recorded are kept; choose the remaining ones and submit again.`,
      });
      setReviewing(false);
      router.refresh();
    } finally {
      setBusy(false);
      setProgress(0);
      setPhase('');
    }
  };

  const banner =
    status === 'none' ? { tone: 'muted', text: 'Memorial submission details will be announced soon.' }
    : status === 'before' ? { tone: 'muted', text: 'Submission has not opened yet.' }
    : status === 'open' ? { tone: 'ok', text: `Open. Submit before ${deadlineLabel}. Large files take time, so do not wait for the last minute.` }
    : status === 'late' ? { tone: 'warn', text: `The deadline (${deadlineLabel}) has passed. You can still submit until ${hardCloseLabel}, with 1 mark off per hour per memorial (rule 7.1.3).` }
    : { tone: 'warn', text: 'Submission is closed. Memorials more than 24 hours late are not evaluated.' };

  return (
    <div>
      <p
        className={`border-l-4 py-1 pl-4 text-justify text-[15px] font-semibold hyphens-auto ${
          banner.tone === 'warn' ? 'border-[#4D0E12] text-[#4D0E12]'
          : banner.tone === 'ok' ? 'border-[#4D0E12]'
          : 'border-[#231815]/30 text-[#231815]/70'
        }`}
      >
        {banner.text}
      </p>

      <p className="mt-4 text-justify text-sm leading-relaxed text-[#231815]/75 hyphens-auto">
        Submit four files: the Plaintiff and Defendant memorials, each in PDF and Word. Choose all of them, then press
        Submit once.
      </p>

      <ul className="mt-6 divide-y divide-[#231815]/15 border-y border-[#231815]/15">
        {items.map((item) => (
          <li key={item.slot} className="grid gap-3 py-5 sm:grid-cols-[220px_1fr] sm:gap-8">
            <p className="font-semibold">{item.label}</p>

            <div className="min-w-0">
              {item.done ? (
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="font-semibold text-[#4D0E12]">Submitted</span> · recorded {item.done.recorded}
                  </p>
                  <p className="text-[#231815]/65">Fully received {item.done.received} · {item.done.name}</p>
                  {item.done.lateHours > 0 && (
                    <p className="font-semibold text-[#4D0E12]">Late by {item.done.lateHours} hour(s)</p>
                  )}
                  <a
                    href={`/api/memorial/download?slot=${encodeURIComponent(item.slot)}`}
                    className="inline-block pt-1 font-semibold text-[#4D0E12] underline underline-offset-4"
                  >
                    Download your file
                  </a>
                </div>
              ) : canUpload ? (
                <>
                  <input
                    type="file"
                    accept={ACCEPT[item.slot]}
                    disabled={busy || reviewing}
                    onChange={(e) => pick(item, e.target.files?.[0])}
                    className="w-full min-w-0 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-[#231815] file:px-4 file:py-1.5 file:text-sm file:font-semibold file:text-[#F5EFC6]"
                  />
                  {errs[item.slot] && <p role="alert" className="mt-2 text-sm font-semibold text-[#4D0E12]">{errs[item.slot]}</p>}
                </>
              ) : (
                <p className="text-sm text-[#231815]/55">Not submitted</p>
              )}
            </div>
          </li>
        ))}
      </ul>

      {canUpload && pending.length > 0 && (
        <div className="mt-6">
          {!reviewing && !busy && (
            <button
              type="button"
              disabled={!allPicked}
              onClick={() => setReviewing(true)}
              className="rounded-full bg-[#4D0E12] px-8 py-3 text-sm font-bold text-[#F5EFC6] transition hover:bg-[#231815] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pending.length === items.length ? 'Submit all files' : `Submit remaining ${pending.length} file(s)`}
            </button>
          )}
          {!allPicked && !reviewing && !busy && (
            <p className="mt-2 text-xs text-[#231815]/60">Choose all {pending.length} file(s) to enable submit.</p>
          )}

          {reviewing && !busy && (
            <div className="rounded-2xl border border-[#4D0E12]/40 bg-white/60 p-5">
              <p className="font-serif text-lg font-bold">Are you sure you want to submit these files?</p>
              <ul className="mt-3 space-y-1.5 text-sm">
                {pending.map((i) => (
                  <li key={i.slot} className="flex flex-wrap gap-x-2">
                    <span className="font-semibold">{i.label}:</span>
                    <span className="break-all text-[#231815]/80">{files[i.slot]?.name}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-[#231815]/65">Submissions are final and cannot be replaced.</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button" onClick={run}
                  className="rounded-full bg-[#4D0E12] px-6 py-2.5 text-sm font-bold text-[#F5EFC6] hover:bg-[#231815]"
                >
                  Confirm and submit
                </button>
                <button
                  type="button" onClick={() => setReviewing(false)}
                  className="rounded-full border border-[#231815]/40 px-6 py-2.5 text-sm font-semibold hover:bg-[#231815] hover:text-[#F5EFC6]"
                >
                  Change files
                </button>
              </div>
            </div>
          )}

          {busy && (
            <div aria-live="polite">
              <div className="h-1.5 overflow-hidden rounded-full bg-[#231815]/15">
                <div className="h-full bg-[#4D0E12] transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
              <p className="mt-1.5 text-xs font-semibold">{phase} {progress > 0 && `${progress}%`}. Keep this page open.</p>
            </div>
          )}
        </div>
      )}

      {result && (
        <p role={result.ok ? 'status' : 'alert'} className={`mt-4 text-sm font-semibold ${result.ok ? '' : 'text-[#4D0E12]'}`}>
          {result.text}
        </p>
      )}
    </div>
  );
}