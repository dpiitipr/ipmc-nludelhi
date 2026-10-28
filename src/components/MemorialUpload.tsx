'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export type SlotItem = {
  slot: string;
  label: string;
  expected: string;
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
        Submit four files: the Plaintiff and Defendant memorials, each in PDF and Word. Name them with your team code
        and side, for example <b>{items[0]?.expected}.pdf</b>. Every submission is final (rule 7.1.4). Remove
        identifying metadata before uploading (rule 12).
      </p>

      <ul className="mt-6 divide-y divide-[#231815]/15 border-y border-[#231815]/15">
        {items.map((item) => {
          const m = msg[item.slot];
          return (
            <li key={item.slot} className="grid gap-3 py-5 sm:grid-cols-[220px_1fr] sm:gap-8">
              <div>
                <p className="font-semibold">{item.label}</p>
                <p className="text-xs text-[#231815]/60">
                  {item.expected}.{item.slot.endsWith('pdf') ? 'pdf' : 'docx'}
                </p>
              </div>

              <div className="min-w-0">
                {item.done ? (
                  <div className="space-y-1 text-sm">
                    <p><span className="font-semibold text-[#4D0E12]">Submitted</span> · recorded {item.done.recorded}</p>
                    <p className="text-[#231815]/65">Fully received {item.done.received} · {item.done.name}</p>
                    {item.done.lateHours > 0 && <p className="font-semibold text-[#4D0E12]">Late by {item.done.lateHours} hour(s)</p>}
                    {!item.done.nameOk && <p className="font-semibold text-[#4D0E12]">File name does not match {item.expected}</p>}
                    <a href={`/api/memorial/download?slot=${item.slot}`} className="inline-block pt-1 font-semibold text-[#4D0E12] underline underline-offset-4">
                      Download your file
                    </a>
                  </div>
                ) : canUpload ? (
                  <form onSubmit={(e) => submit(e, item)} className="flex flex-wrap items-center gap-3">
                    <input
                      name="file" type="file" required accept={ACCEPT[item.slot]} disabled={busy !== null}
                      className="min-w-0 flex-1 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-[#231815] file:px-4 file:py-1.5 file:text-sm file:font-semibold file:text-[#F5EFC6]"
                    />
                    <button
                      type="submit" disabled={busy !== null}
                      className="rounded-full bg-[#4D0E12] px-5 py-2 text-sm font-bold text-[#F5EFC6] hover:bg-[#231815] disabled:cursor-wait disabled:opacity-60"
                    >
                      {busy === item.slot ? 'Uploading…' : 'Submit'}
                    </button>
                    {busy === item.slot && (
                      <div className="w-full" aria-live="polite">
                        <div className="h-1.5 overflow-hidden rounded-full bg-[#231815]/15">
                          <div className="h-full bg-[#4D0E12] transition-all" style={{ width: `${progress}%` }} />
                        </div>
                        <p className="mt-1 text-xs font-semibold">Uploading {progress}%. Keep this page open.</p>
                      </div>
                    )}
                  </form>
                ) : (
                  <p className="text-sm text-[#231815]/55">Not submitted</p>
                )}
                {m?.text && (
                  <p role={m.ok ? 'status' : 'alert'} className={`mt-2 text-sm font-semibold ${m.ok ? '' : 'text-[#4D0E12]'}`}>{m.text}</p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}