'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export type SlotItem = {
  slot: string;
  label: string;
  expected: string; // e.g. 136_P
  done: null | { name: string; recorded: string; received: string; lateHours: number; nameOk: boolean };
};

const ACCEPT: Record<string, string> = { P_pdf: '.pdf', D_pdf: '.pdf', P_word: '.doc,.docx', D_word: '.doc,.docx' };

// sends the file straight to Drive and reports progress; resolves with the Drive file id when readable
const putFile = (url: string, mime: string, file: File, onProgress: (p: number) => void) =>
  new Promise<string | null>((resolve) => {
    const x = new XMLHttpRequest();
    x.open('PUT', url);
    x.setRequestHeader('Content-Type', mime);
    x.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    x.onload = () => {
      try { resolve(JSON.parse(x.responseText).id ?? null); } catch { resolve(null); }
    };
    x.onerror = () => resolve(null);
    x.send(file);
  });

export default function MemorialUpload({
  status, deadlineLabel, hardCloseLabel, items,
}: {
  status: 'none' | 'before' | 'open' | 'late' | 'closed';
  deadlineLabel: string;
  hardCloseLabel: string;
  items: SlotItem[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [msg, setMsg] = useState<Record<string, { ok: boolean; text: string }>>({});
  const set = (slot: string, ok: boolean, text: string) => setMsg((m) => ({ ...m, [slot]: { ok, text } }));

  const submit = async (e: React.FormEvent<HTMLFormElement>, item: SlotItem) => {
    e.preventDefault();
    const form = e.currentTarget;
    const file = (form.elements.namedItem('file') as HTMLInputElement).files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop() || '';
    const base = file.name.replace(/\.[^.]+$/, '');
    const warn = base !== item.expected
      ? `\n\nThe file is named "${file.name}", but the rules require "${item.expected}.${ext}". A 5-mark penalty may apply.`
      : '';
    if (!window.confirm(`Submit ${file.name}?\n\nSubmissions are final and cannot be replaced.${warn}`)) return;

    setBusy(item.slot);
    setProgress(0);
    set(item.slot, true, '');
    try {
      const i = await fetch('/api/memorial/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slot: item.slot, fileName: file.name, size: file.size }),
      });
      const init = await i.json().catch(() => ({}));
      if (!i.ok) throw new Error(init.error || 'Could not start the upload.');

      const fileId = await putFile(init.uploadUrl, init.mime, file, setProgress);

      const c = await fetch('/api/memorial/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slot: item.slot, fileId }),
      });
      const done = await c.json().catch(() => ({}));
      if (!c.ok) throw new Error(done.error || 'Could not confirm the upload.');

      set(item.slot, true, 'Submitted successfully.');
      form.reset();
      router.refresh();
    } catch (err: any) {
      set(item.slot, false, err?.message || 'Upload failed. Please try again.');
    }
    setBusy(null);
  };

  const canUpload = status === 'open' || status === 'late';

  return (
    <section aria-labelledby="memo-h" className="space-y-4">
      <h2 id="memo-h" className="font-serif text-2xl font-bold text-[#4D0E12]">Memorial submission</h2>

      <div className="max-w-3xl space-y-2 text-[15px] text-[#231815]/80">
        <p>
          {status === 'none' && 'Memorial submission details will be announced soon.'}
          {status === 'before' && 'Submission has not opened yet.'}
          {status === 'open' && `Submit before ${deadlineLabel}. Do not wait for the last minute: large files take time to upload.`}
          {status === 'late' && `The deadline (${deadlineLabel}) has passed. You can still submit until ${hardCloseLabel}, with a penalty of 1 mark per hour per memorial (rule 7.1.3).`}
          {status === 'closed' && 'Submission is closed. Memorials more than 24 hours late are not evaluated.'}
        </p>
        <p>
          Submit four files: the Plaintiff and Defendant memorials, each in PDF and in Word. Name them with your team
          code and side, for example <b>{items[0]?.expected}.pdf</b> and <b>{items[2]?.expected}.docx</b>. Every
          submission is final (rule 7.1.4). Remove identifying metadata before uploading (rule 12).
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {items.map((item) => {
          const m = msg[item.slot];
          return (
            <div key={item.slot} className="rounded-2xl border border-[#231815]/15 bg-[#A5BCD6]/20 p-5 sm:p-6">
              <h3 className="font-serif text-lg font-bold text-[#4D0E12]">{item.label}</h3>

              {item.done ? (
                <div className="mt-3 space-y-1 text-sm">
                  <p><span className="font-semibold">Submitted.</span> Time recorded: {item.done.recorded}</p>
                  <p className="text-[#231815]/70">File fully received: {item.done.received}</p>
                  <p className="text-[#231815]/70">{item.done.name}</p>
                  {item.done.lateHours > 0 && (
                    <p className="font-semibold text-[#4D0E12]">Late by {item.done.lateHours} hour(s).</p>
                  )}
                  {!item.done.nameOk && (
                    <p className="font-semibold text-[#4D0E12]">File name does not match {item.expected}.</p>
                  )}
                  <a
                    href={`/api/memorial/download?slot=${item.slot}`}
                    className="mt-2 inline-block rounded-lg bg-[#4D0E12] px-4 py-2 text-sm font-semibold text-[#F5EFC6] hover:bg-[#231815]"
                  >
                    Download your submitted file
                  </a>
                </div>
              ) : canUpload ? (
                <form onSubmit={(e) => submit(e, item)} className="mt-4 space-y-3">
                  <input
                    name="file" type="file" required accept={ACCEPT[item.slot]} disabled={busy !== null}
                    className="w-full rounded-xl border border-[#231815]/25 bg-[#F5EFC6] px-3 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-[#4D0E12] file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-[#F5EFC6]"
                  />
                  <p className="text-xs text-[#231815]/65">
                    Expected name: {item.expected}.{item.slot.endsWith('pdf') ? 'pdf' : 'docx'}. Up to 50 MB.
                  </p>
                  {busy === item.slot && (
                    <div aria-live="polite">
                      <div className="h-2 overflow-hidden rounded-full bg-[#231815]/15">
                        <div className="h-full bg-[#4D0E12] transition-all" style={{ width: `${progress}%` }} />
                      </div>
                      <p className="mt-1 text-xs font-semibold">Uploading {progress}%. Keep this page open.</p>
                    </div>
                  )}
                  <button
                    type="submit" disabled={busy !== null}
                    className="rounded-xl bg-[#4D0E12] px-5 py-2.5 text-sm font-bold text-[#F5EFC6] hover:bg-[#231815] disabled:cursor-wait disabled:opacity-60"
                  >
                    {busy === item.slot ? 'Uploading…' : 'Submit file'}
                  </button>
                </form>
              ) : (
                <p className="mt-3 text-sm text-[#231815]/60">Not submitted</p>
              )}

              {m?.text && (
                <p role={m.ok ? 'status' : 'alert'} className={`mt-3 text-sm font-semibold ${m.ok ? '' : 'text-[#4D0E12]'}`}>
                  {m.text}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}