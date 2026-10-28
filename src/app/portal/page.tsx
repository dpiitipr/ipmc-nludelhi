import React from 'react';
import { redirect } from 'next/navigation';
import { hg } from '@/lib/hygraph-server';
import { readSession } from '@/lib/session';
import MemorialUpload, { type SlotItem } from '@/components/MemorialUpload';
import {
  SLOTS, type Slot, HARD_CLOSE_HOURS, getWindow, redis, recKey, countedMs, receivedMs, lateHoursAt, type Rec,
} from '@/lib/memorial';

export const dynamic = 'force-dynamic';

/*
  Palette: Transparent Yellow #F5EFC6 · Sceptre Red #4D0E12 · Cerulean Blue #A5BCD6
  Potting Soil #4A2E27 · Java Brown #231815
*/

const ASSET = 'url fileName';
const TITLED = `title file { ${ASSET} }`;

const QUERY = `
  query Portal($id: ID!) {
    team(where: { id: $id }) {
      universityName teamCode note arrivalDetails departureDetails accommodation
      buddy { name email phone }
      participants { name role }
      invitationLetters { ${TITLED} }
      certificates { ${TITLED} }
      travelDocuments { ${TITLED} }
      memorialScoresheets { ${TITLED} }
      memorialPenaltyMemos { ${TITLED} }
      rounds { roundName side opponentCode room startsAt remarks scoresheets { ${TITLED} } }
    }
    announcements(where: { OR: [{ audience: all }, { teams_some: { id: $id } }] }, orderBy: createdAt_DESC) {
      id title body createdAt attachment { ${TITLED} }
    }
    commonResources { id title body file { ${TITLED} } }
  }
`;

type FileItem = { url: string; name: string };
type AssetData = { url?: string | null; fileName?: string | null };
type TitledFileData = { title?: string | null; file?: AssetData | null };
type FileInput = AssetData | TitledFileData | null | undefined;

const toFiles = (list: FileInput | FileInput[]): FileItem[] => {
  const entries = Array.isArray(list) ? list : list ? [list] : [];
  return entries
    .map((x) => {
      if (!x) return null;
      const titled = x as TitledFileData;
      const direct = x as AssetData;
      const file = direct.url ? direct : titled.file?.url ? titled.file : null;
      if (!file?.url) return null;
      return { url: file.url, name: titled.title || file.fileName || 'Download' };
    })
    .filter((x): x is FileItem => x !== null);
};

const IST = 'Asia/Kolkata';
const fmt = (v?: string | number | null) =>
  v
    ? new Intl.DateTimeFormat('en-IN', {
        timeZone: IST, day: 'numeric', month: 'short', year: 'numeric',
        hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true,
      }).format(new Date(v)) + ' IST'
    : 'TBD';
const fmtMin = (v?: string | number | null) => fmt(v).replace(/:\d{2}(?= [AP]M)/i, '');
const shortDate = (v: string) =>
  new Intl.DateTimeFormat('en-IN', { timeZone: IST, day: 'numeric', month: 'short' }).format(new Date(v));
const ext = (n?: string) => (n?.split('.').pop() || 'FILE').toUpperCase().slice(0, 4);

/* ---------- small building blocks ---------- */

function Files({ files }: { files: FileItem[] }) {
  if (files.length === 0) return <span className="text-[#231815]/45">None yet</span>;
  return (
    <ul className="space-y-1.5">
      {files.map((f) => (
        <li key={f.url} className="flex items-baseline gap-2">
          <span className="shrink-0 rounded bg-[#231815] px-1.5 text-[10px] font-bold text-[#F5EFC6]">{ext(f.name)}</span>
          <a href={f.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-[#4D0E12] underline-offset-4 hover:underline">
            {f.name}
          </a>
        </li>
      ))}
    </ul>
  );
}

function Section({ id, n, title, children }: { id: string; n: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-32 border-t border-[#231815]/25 pt-6">
      <p className="text-xs font-bold tracking-[0.2em] text-[#4D0E12]">{n}</p>
      <h2 id={`${id}-h`} className="mt-1 font-serif text-3xl font-bold text-[#231815]">{title}</h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 py-4 sm:grid-cols-[180px_1fr] sm:gap-8">
      <dt className="text-sm font-semibold text-[#231815]/60">{label}</dt>
      <dd className="min-w-0 text-[15px] leading-relaxed">{children}</dd>
    </div>
  );
}

const Text = ({ v }: { v?: string | null }) =>
  v?.trim() ? <p className="whitespace-pre-line">{v}</p> : <span className="text-[#231815]/45">To be announced</span>;

const NAV = [
  ['overview', 'Overview'],
  ['memorials', 'Memorials'],
  ['rounds', 'Oral rounds'],
  ['team', 'Your team'],
  ['travel', 'Travel and stay'],
  ['documents', 'Documents'],
  ['resources', 'Resources'],
];

export default async function PortalPage() {
  const session = await readSession();
  if (!session) redirect('/login');

  let data: any;
  try {
    data = await hg.request(QUERY, { id: session.id });
  } catch (err) {
    console.error('Portal query failed:', err);
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5EFC6] px-6 text-center">
        <p className="max-w-sm">We could not load your portal right now. Please try again shortly.</p>
      </div>
    );
  }
  const team = data.team;
  if (!team) redirect('/login');

  const rounds: any[] = team.rounds ?? [];
  const participants: any[] = team.participants ?? [];
  const announcements: any[] = data.announcements ?? [];
  const resources: any[] = data.commonResources ?? [];

  /* ---------- memorial state ---------- */
  const w = await getWindow();
  const now = Date.now();
  const hard = w ? w.deadline + HARD_CLOSE_HOURS * 3600000 : 0;
  const status: 'none' | 'before' | 'open' | 'late' | 'closed' =
    !w ? 'none' : now < w.opensAt ? 'before' : now <= w.deadline ? 'open' : now <= hard ? 'late' : 'closed';

  const slots = Object.keys(SLOTS) as Slot[];
  let recs: (Rec | null)[] = slots.map(() => null);
  try {
    recs = await redis().mget<(Rec | null)[]>(...slots.map((s) => recKey(team.teamCode, s)));
  } catch (err) {
    console.error('Memorial records failed:', err);
  }

  const items: SlotItem[] = slots.map((slot, i) => {
    const r = recs[i];
    return {
      slot,
      label: SLOTS[slot].label,
      expected: `${team.teamCode}_${SLOTS[slot].letter}`,
      done:
        r?.status === 'done' && w
          ? {
              name: r.name || '',
              recorded: fmt(countedMs(r, w)),
              received: fmt(receivedMs(r)),
              lateHours: lateHoursAt(countedMs(r, w), w),
              nameOk: !!r.nameOk,
            }
          : null,
    };
  });
  const submittedCount = items.filter((i) => i.done).length;

  const docGroups: [string, FileItem[]][] = [
    ['Invitation letter', toFiles(team.invitationLetters)],
    ['Certificates', toFiles(team.certificates)],
    ['Memorial scoresheets', toFiles(team.memorialScoresheets)],
    ['Memorial penalty memos', toFiles(team.memorialPenaltyMemos)],
    ['Travel documents', toFiles(team.travelDocuments)],
  ];

  return (
    <div className="min-h-screen bg-[#F5EFC6] font-sans text-[#231815] antialiased selection:bg-[#4D0E12] selection:text-[#F5EFC6] scroll-smooth">
      {/* ---------- top band ---------- */}
      <header className="bg-[#231815] text-[#F5EFC6]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 pb-8 pt-28 sm:pt-32">
          <div>
            <p className="text-xs font-bold tracking-[0.2em] text-[#A5BCD6]">TEAM #{team.teamCode}</p>
            <h1 className="mt-1 max-w-2xl font-serif text-3xl font-bold leading-tight sm:text-4xl">{team.universityName}</h1>
          </div>
          <form action="/api/logout" method="post">
            <button className="rounded-full border border-[#F5EFC6]/40 px-5 py-2 text-sm font-semibold transition hover:border-[#A5BCD6] hover:text-[#A5BCD6]">
              Sign out
            </button>
          </form>
        </div>
      </header>

      {/* ---------- mobile menu ---------- */}
      <nav aria-label="Portal sections" className="sticky top-0 z-30 border-b border-[#231815]/20 bg-[#F5EFC6]/95 backdrop-blur lg:hidden">
        <ul className="flex gap-1 overflow-x-auto px-4 py-2 text-sm font-semibold">
          {NAV.map(([id, label]) => (
            <li key={id} className="shrink-0">
              <a href={`#${id}`} className="block rounded-full px-3 py-1.5 hover:bg-[#231815] hover:text-[#F5EFC6]">{label}</a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mx-auto grid max-w-6xl gap-12 px-6 pb-28 pt-10 lg:grid-cols-[200px_1fr]">
        {/* ---------- desktop side menu ---------- */}
        <nav aria-label="Portal sections" className="hidden lg:block">
          <ul className="sticky top-28 space-y-1 border-l-2 border-[#231815]/20">
            {NAV.map(([id, label]) => (
              <li key={id}>
                <a href={`#${id}`} className="-ml-0.5 block border-l-2 border-transparent py-1.5 pl-4 text-sm font-semibold text-[#231815]/70 transition hover:border-[#4D0E12] hover:text-[#4D0E12]">
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <main className="min-w-0 space-y-16">
          {/* ---------- 01 overview ---------- */}
          <Section id="overview" n="01" title="Overview">
            <p className="max-w-2xl font-serif text-lg leading-relaxed text-[#231815]/90">
              Welcome to your portal for Vidhi Pragati. Use only your team code to identify yourselves (rule 12). For any
              question write to{' '}
              <a href="mailto:dpiit.ipr@nludelhi.ac.in" className="font-semibold text-[#4D0E12] underline underline-offset-4">
                dpiit.ipr@nludelhi.ac.in
              </a>.
            </p>

            <dl className="mt-6 grid gap-x-10 gap-y-4 sm:grid-cols-3">
              <div>
                <dt className="text-sm font-semibold text-[#231815]/60">Memorials</dt>
                <dd className="font-serif text-2xl font-bold">{submittedCount} of 4 submitted</dd>
              </div>
              <div>
                <dt className="text-sm font-semibold text-[#231815]/60">Deadline</dt>
                <dd className="font-serif text-2xl font-bold">{w ? fmtMin(w.deadline) : 'To be announced'}</dd>
              </div>
              <div>
                <dt className="text-sm font-semibold text-[#231815]/60">Oral rounds</dt>
                <dd className="font-serif text-2xl font-bold">{rounds.length > 0 ? `${rounds.length} scheduled` : 'Not announced'}</dd>
              </div>
            </dl>

            {team.note?.trim() && (
              <p className="mt-8 max-w-2xl whitespace-pre-line border-l-4 border-[#4D0E12] pl-4 text-[15px] font-semibold leading-relaxed">
                {team.note}
              </p>
            )}

            {announcements.length > 0 && (
              <div className="mt-10">
                <h3 className="text-sm font-bold tracking-[0.15em] text-[#231815]/60">ANNOUNCEMENTS</h3>
                <ul className="mt-2 divide-y divide-[#231815]/15">
                  {announcements.map((a) => (
                    <li key={a.id} className="py-4">
                      <p className="font-semibold">
                        {a.title}
                        <span className="ml-2 text-xs font-normal text-[#231815]/55">{shortDate(a.createdAt)}</span>
                      </p>
                      {a.body && <p className="mt-1 max-w-2xl whitespace-pre-line text-[15px]">{a.body}</p>}
                      {toFiles(a.attachment).length > 0 && <div className="mt-2"><Files files={toFiles(a.attachment)} /></div>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Section>

          {/* ---------- 02 memorials ---------- */}
          <Section id="memorials" n="02" title="Memorial submission">
            <MemorialUpload status={status} deadlineLabel={fmtMin(w?.deadline)} hardCloseLabel={fmtMin(hard || null)} items={items} />
          </Section>

          {/* ---------- 03 oral rounds ---------- */}
          <Section id="rounds" n="03" title="Oral rounds">
            {rounds.length === 0 ? (
              <p className="text-[#231815]/60">Your oral rounds will appear here once they are announced.</p>
            ) : (
              <ol className="divide-y divide-[#231815]/15 border-y border-[#231815]/15">
                {rounds.map((r, i) => (
                  <li key={i} className="grid gap-4 py-6 sm:grid-cols-[200px_1fr] sm:gap-8">
                    <div>
                      <h3 className="font-serif text-xl font-bold">{r.roundName || 'Round'}</h3>
                      <p className="mt-1 text-sm font-semibold text-[#4D0E12]">{r.side || 'Side to be announced'}</p>
                    </div>
                    <dl className="grid gap-x-8 gap-y-3 text-[15px] sm:grid-cols-3">
                      <div><dt className="text-xs font-semibold text-[#231815]/55">Time</dt><dd>{r.startsAt ? fmtMin(r.startsAt) : 'TBD'}</dd></div>
                      <div><dt className="text-xs font-semibold text-[#231815]/55">Room</dt><dd>{r.room || 'TBD'}</dd></div>
                      <div><dt className="text-xs font-semibold text-[#231815]/55">Opposing team</dt><dd>{r.opponentCode ? `#${r.opponentCode}` : 'TBD'}</dd></div>
                      {r.remarks && <div className="sm:col-span-3"><dt className="text-xs font-semibold text-[#231815]/55">Remarks</dt><dd className="whitespace-pre-line">{r.remarks}</dd></div>}
                      {toFiles(r.scoresheets).length > 0 && (
                        <div className="sm:col-span-3"><dt className="mb-1 text-xs font-semibold text-[#231815]/55">Scoresheets</dt><dd><Files files={toFiles(r.scoresheets)} /></dd></div>
                      )}
                    </dl>
                  </li>
                ))}
              </ol>
            )}
          </Section>

          {/* ---------- 04 team ---------- */}
          <Section id="team" n="04" title="Your team">
            <dl className="divide-y divide-[#231815]/15 border-y border-[#231815]/15">
              <Row label="Participants">
                {participants.length === 0 ? (
                  <span className="text-[#231815]/45">Not listed yet</span>
                ) : (
                  <ul className="space-y-1">
                    {participants.map((p, i) => (
                      <li key={i}><span className="font-semibold">{p.name}</span>{p.role && <span className="text-[#231815]/65"> · {p.role}</span>}</li>
                    ))}
                  </ul>
                )}
              </Row>
              <Row label="Team buddy">
                {team.buddy?.name ? (
                  <span>
                    <span className="font-semibold">{team.buddy.name}</span>
                    {team.buddy.email && <> · <a href={`mailto:${team.buddy.email}`} className="font-semibold text-[#4D0E12] underline underline-offset-4">Email</a></>}
                    {team.buddy.phone && <> · <a href={`tel:${team.buddy.phone}`} className="font-semibold text-[#4D0E12] underline underline-offset-4">Call</a></>}
                  </span>
                ) : (
                  <span className="text-[#231815]/45">Your buddy will be assigned soon.</span>
                )}
              </Row>
            </dl>
          </Section>

          {/* ---------- 05 travel ---------- */}
          <Section id="travel" n="05" title="Travel and stay">
            <dl className="divide-y divide-[#231815]/15 border-y border-[#231815]/15">
              <Row label="Arrival"><Text v={team.arrivalDetails} /></Row>
              <Row label="Departure"><Text v={team.departureDetails} /></Row>
              <Row label="Accommodation"><Text v={team.accommodation} /></Row>
            </dl>
          </Section>

          {/* ---------- 06 documents ---------- */}
          <Section id="documents" n="06" title="Documents">
            <dl className="divide-y divide-[#231815]/15 border-y border-[#231815]/15">
              {docGroups.map(([label, files]) => (
                <Row key={label} label={label}><Files files={files} /></Row>
              ))}
            </dl>
          </Section>

          {/* ---------- 07 resources ---------- */}
          <Section id="resources" n="07" title="Common resources">
            {resources.length === 0 ? (
              <p className="text-[#231815]/60">Nothing yet.</p>
            ) : (
              <ul className="divide-y divide-[#231815]/15 border-y border-[#231815]/15">
                {resources.map((r) => (
                  <li key={r.id} className="py-4">
                    <p className="font-semibold">{r.title}</p>
                    {r.body && <p className="mt-1 max-w-2xl whitespace-pre-line text-[15px]">{r.body}</p>}
                    {toFiles(r.file).length > 0 && <div className="mt-2"><Files files={toFiles(r.file)} /></div>}
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </main>
      </div>
    </div>
  );
}