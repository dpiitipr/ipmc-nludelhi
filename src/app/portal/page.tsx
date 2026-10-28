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

function Files({ files }: { files: FileItem[] }) {
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

/* a plain collapsible block, like the sample's accordions */
function Block({ title, children, open = true }: { title: string; children: React.ReactNode; open?: boolean }) {
  return (
    <details open={open} className="group rounded-md border border-[#231815]/25 bg-[#F5EFC6]">
      <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#231815]/60 hover:text-[#4D0E12]">
        {title}
        <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4 transition group-open:rotate-180" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 8l5 5 5-5" />
        </svg>
      </summary>
      <div className="border-t border-[#231815]/10 px-4 py-4 text-[15px] leading-relaxed">{children}</div>
    </details>
  );
}

const Text = ({ v }: { v?: string | null }) =>
  v?.trim() ? (
    <p className="whitespace-pre-line text-justify hyphens-auto">{v}</p>
  ) : (
    <span className="text-[#231815]/45">To be announced</span>
  );

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
  let w = null as Awaited<ReturnType<typeof getWindow>>;
  try {
    w = await getWindow();
  } catch (err) {
    console.error('getWindow failed (is Redis configured?):', err);
  }
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

  const invitation = toFiles(team.invitationLetters);
  const certs = toFiles(team.certificates);
  const travelDocs = toFiles(team.travelDocuments);
  const memoScore = toFiles(team.memorialScoresheets);
  const memoPenalty = toFiles(team.memorialPenaltyMemos);
  const anyRoundScoresheets = rounds.some((r) => toFiles(r.scoresheets).length > 0);
  const anyRoundRemarks = rounds.some((r) => r.remarks?.trim());

  return (
    <div className="min-h-screen bg-[#F5EFC6] font-sans text-[#231815] antialiased selection:bg-[#4D0E12] selection:text-[#F5EFC6]">
      <section className="mt-32 grid w-full gap-6 px-4 pb-24 sm:px-8 lg:grid-cols-8 lg:px-10">
        {/* ---------- main column ---------- */}
        <div className="row-start-2 grid content-start gap-4 lg:col-span-6 lg:row-start-1">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <p className="min-w-0 flex-1 basis-96 text-justify text-lg font-medium hyphens-auto">
              Welcome to your personalised team portal for Vidhi Pragati. You will find all the logistical information
              here. If you have any questions, write to{' '}
              <a href="mailto:dpiit.ipr@nludelhi.ac.in" className="font-semibold text-[#4D0E12] underline underline-offset-4">
                dpiit.ipr@nludelhi.ac.in
              </a>
              . Use only your team code to identify yourselves (rule 12).
            </p>
            <form action="/api/logout" method="post">
              <button className="rounded-md bg-[#4D0E12] px-6 py-2.5 text-sm font-semibold text-[#F5EFC6] hover:bg-[#231815]">
                Log out
              </button>
            </form>
          </div>

          {team.note?.trim() && (
            <div className="whitespace-pre-line rounded-md border border-[#231815]/25 bg-[#A5BCD6]/30 px-4 py-4 text-justify text-sm font-semibold hyphens-auto">
              {team.note}
            </div>
          )}

          {announcements.length > 0 && (
            <Block title="Announcements">
              <ul className="space-y-4">
                {announcements.map((a) => (
                  <li key={a.id}>
                    <p className="font-semibold">
                      {a.title}
                      <span className="ml-2 text-xs font-normal text-[#231815]/55">{shortDate(a.createdAt)}</span>
                    </p>
                    {a.body && <p className="mt-1 whitespace-pre-line text-justify hyphens-auto">{a.body}</p>}
                    {toFiles(a.attachment).length > 0 && <div className="mt-2"><Files files={toFiles(a.attachment)} /></div>}
                  </li>
                ))}
              </ul>
            </Block>
          )}

          <Block title="Memorial submission">
            <MemorialUpload status={status} deadlineLabel={fmtMin(w?.deadline)} hardCloseLabel={fmtMin(hard || null)} items={items} />
            {status === 'none' && (
              <p className="mt-3 text-xs text-[#231815]/55">
                The submission window could not be read. Organisers: check that the MemoWindow entry is published in Hygraph.
              </p>
            )}
          </Block>

          {(memoScore.length > 0 || memoPenalty.length > 0) && (
            <Block title="Memorial scoresheets and penalties">
              {memoScore.length > 0 && (
                <div className="mb-3">
                  <p className="mb-1 text-xs font-semibold text-[#231815]/55">Scoresheets</p>
                  <Files files={memoScore} />
                </div>
              )}
              {memoPenalty.length > 0 && (
                <div>
                  <p className="mb-1 text-xs font-semibold text-[#231815]/55">Penalty memos</p>
                  <Files files={memoPenalty} />
                </div>
              )}
            </Block>
          )}

          <Block title="Oral rounds">
            {rounds.length === 0 ? (
              <p className="text-[#231815]/55">Your oral rounds will appear here once they are announced.</p>
            ) : (
              <div className="-mx-4 overflow-x-auto px-4">
                <table className="w-full min-w-175 text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#231815]/20 text-[#231815]/60">
                      <th className="px-3 py-3 font-semibold">Round</th>
                      <th className="px-3 py-3 font-semibold">Side</th>
                      <th className="px-3 py-3 font-semibold">Room</th>
                      <th className="px-3 py-3 font-semibold">Time</th>
                      <th className="px-3 py-3 font-semibold">Opposing team</th>
                      {anyRoundScoresheets && <th className="px-3 py-3 font-semibold">Score sheets</th>}
                      {anyRoundRemarks && <th className="px-3 py-3 font-semibold">Remarks</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {rounds.map((r, i) => (
                      <tr key={i} className="border-b border-[#231815]/10 align-top last:border-b-0">
                        <td className="px-3 py-4 font-semibold">{r.roundName || '–'}</td>
                        <td className="px-3 py-4">{r.side || 'TBD'}</td>
                        <td className="px-3 py-4">{r.room || 'TBD'}</td>
                        <td className="whitespace-nowrap px-3 py-4">{r.startsAt ? fmtMin(r.startsAt) : 'TBD'}</td>
                        <td className="px-3 py-4">{r.opponentCode ? `#${r.opponentCode}` : 'TBD'}</td>
                        {anyRoundScoresheets && (
                          <td className="px-3 py-4">
                            {toFiles(r.scoresheets).length > 0 ? <Files files={toFiles(r.scoresheets)} /> : <span className="text-[#231815]/40">–</span>}
                          </td>
                        )}
                        {anyRoundRemarks && (
                          <td className="whitespace-pre-line px-3 py-4 text-justify hyphens-auto">{r.remarks || '–'}</td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Block>

          <div className="grid gap-4 md:grid-cols-2">
            <Block title="Arrival"><Text v={team.arrivalDetails} /></Block>
            <Block title="Departure"><Text v={team.departureDetails} /></Block>
          </div>

          <div className="grid items-start gap-4 md:grid-cols-2">
            <Block title="Accommodation"><Text v={team.accommodation} /></Block>
            <Block title="Common resources">
              {resources.length === 0 ? (
                <span className="text-[#231815]/45">Nothing yet</span>
              ) : (
                <ul className="max-h-72 space-y-4 overflow-y-auto">
                  {resources.map((r) => (
                    <li key={r.id}>
                      <p className="font-semibold">{r.title}</p>
                      {r.body && <p className="mt-1 whitespace-pre-line text-justify hyphens-auto">{r.body}</p>}
                      {toFiles(r.file).length > 0 && <div className="mt-1"><Files files={toFiles(r.file)} /></div>}
                    </li>
                  ))}
                </ul>
              )}
            </Block>
          </div>

          {travelDocs.length > 0 && <Block title="Travel documents"><Files files={travelDocs} /></Block>}
        </div>

        {/* ---------- side column (left-aligned: narrow columns look gappy when justified) ---------- */}
        <aside className="row-start-1 grid content-start gap-4 lg:sticky lg:top-28 lg:col-span-2 lg:self-start">
          <Block title="Your team details">
            <h2 className="font-serif text-2xl font-bold leading-snug">{team.universityName}</h2>
            <p className="font-bold text-[#4D0E12]">#{team.teamCode}</p>
            <h3 className="mt-4 text-xs font-bold uppercase tracking-wider text-[#231815]/55">Participants</h3>
            {participants.length === 0 ? (
              <p className="mt-1 text-[#231815]/45">Not listed yet</p>
            ) : (
              <ul className="mt-2 space-y-1.5">
                {participants.map((p, i) => (
                  <li key={i} className="rounded-md border border-[#231815]/20 px-3 py-2">
                    {p.name}
                    {p.role && <span className="text-[#231815]/60"> ({p.role})</span>}
                  </li>
                ))}
              </ul>
            )}
          </Block>

          {invitation.length > 0 && <Block title="Invitation letter"><Files files={invitation} /></Block>}
          {certs.length > 0 && <Block title="Certificates"><Files files={certs} /></Block>}

          {team.buddy?.name && (
            <Block title="Team buddy">
              <div className="flex items-center justify-between gap-3 rounded-md border border-[#231815]/20 px-3 py-2">
                <span>{team.buddy.name}</span>
                <span className="flex gap-3 text-sm font-semibold text-[#4D0E12]">
                  {team.buddy.email && <a href={`mailto:${team.buddy.email}`} className="underline underline-offset-4">Email</a>}
                  {team.buddy.phone && <a href={`tel:${team.buddy.phone}`} className="underline underline-offset-4">Call</a>}
                </span>
              </div>
            </Block>
          )}
        </aside>
      </section>
    </div>
  );
}