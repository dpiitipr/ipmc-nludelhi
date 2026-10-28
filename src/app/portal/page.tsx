import React from 'react';
import { redirect } from 'next/navigation';
import { hg } from '@/lib/hygraph-server';
import { readSession } from '@/lib/session';
import MemorialUpload, { type SlotItem } from '@/components/MemorialUpload';
import {
  SLOTS, type Slot, HARD_CLOSE_HOURS, getWindowDetailed, redis, recKey, countedMs, receivedMs, lateHoursAt, type Rec,
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

/* ---------- icons (simple outline paths) ---------- */
const ICONS: Record<string, string> = {
  bell: 'M10 3a4 4 0 00-4 4v2.5L4.5 13h11L14 9.5V7a4 4 0 00-4-4zM8 16a2 2 0 004 0',
  upload: 'M10 13V4m0 0L6.5 7.5M10 4l3.5 3.5M4 14v1.5A1.5 1.5 0 005.5 17h9a1.5 1.5 0 001.5-1.5V14',
  scale: 'M10 3v14M5 17h10M4 6h12M4 6l-2 5a3 3 0 006 0L6 6m8 0l-2 5a3 3 0 006 0l-2-5',
  gavel: 'M11 4l5 5m-6-4l-4 4 5 5 4-4M4 16h6',
  plane: 'M3 11l14-6-5 12-2.5-4.5L3 11z',
  bed: 'M3 16V6m0 6h14v4M3 12V9h6a2 2 0 012 2v1',
  folder: 'M3 6.5A1.5 1.5 0 014.5 5H8l2 2h5.5A1.5 1.5 0 0117 8.5v6A1.5 1.5 0 0115.5 16h-11A1.5 1.5 0 013 14.5v-8z',
  users: 'M7.5 9a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM2.5 16a5 5 0 0110 0M13 8.5a2 2 0 100-4M14 11.5a4.5 4.5 0 013.5 4.5',
  mail: 'M3 5.5h14v9H3v-9zm0 0l7 5 7-5',
  award: 'M10 11a4 4 0 100-8 4 4 0 000 8zm-2.5 2.5L7 17l3-1.5 3 1.5-.5-3.5',
  chat: 'M4 5h12v8H9l-3 3v-3H4V5z',
};

function Icon({ name }: { name: keyof typeof ICONS | string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d={ICONS[name] ?? ICONS.folder} />
    </svg>
  );
}

function Files({ files }: { files: FileItem[] }) {
  return (
    <ul className="space-y-2">
      {files.map((f) => (
        <li key={f.url}>
          <a
            href={f.url} target="_blank" rel="noopener noreferrer"
            className="group/f flex items-center gap-3 rounded-xl border border-[#231815]/12 bg-white/50 px-3 py-2 transition hover:border-[#4D0E12]/50 hover:bg-white"
          >
            <span className="grid h-8 w-10 shrink-0 place-items-center rounded-lg bg-[#4D0E12] text-[10px] font-bold tracking-wide text-[#F5EFC6]">
              {ext(f.name)}
            </span>
            <span className="min-w-0 flex-1 truncate font-semibold text-[#231815] group-hover/f:text-[#4D0E12]">{f.name}</span>
            <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4 shrink-0 text-[#4D0E12] transition group-hover/f:translate-y-0.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 3v10m0 0l-4-4m4 4l4-4M4 17h12" />
            </svg>
          </a>
        </li>
      ))}
    </ul>
  );
}

/* collapsible block: the sample's accordion idea, made prettier */
function Block({
  title, icon, badge, children, open = true,
}: { title: string; icon: string; badge?: string | number; children: React.ReactNode; open?: boolean }) {
  return (
    <details open={open} className="group overflow-hidden rounded-2xl border border-[#231815]/12 bg-[#FBF7DF] shadow-[0_1px_0_rgba(35,24,21,0.04),0_14px_30px_-22px_rgba(35,24,21,0.45)]">
      <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4 transition hover:bg-[#A5BCD6]/20 [&::-webkit-details-marker]:hidden">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#231815] text-[#F5EFC6]">
          <Icon name={icon} />
        </span>
        <span className="flex-1 font-serif text-lg font-bold leading-tight text-[#231815]">{title}</span>
        {badge !== undefined && badge !== '' && (
          <span className="rounded-full bg-[#4D0E12] px-2.5 py-0.5 text-xs font-bold text-[#F5EFC6]">{badge}</span>
        )}
        <svg aria-hidden="true" viewBox="0 0 20 20" className="h-5 w-5 shrink-0 text-[#231815]/50 transition-transform duration-300 group-open:rotate-180" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 8l5 5 5-5" />
        </svg>
      </summary>
      <div className="border-t border-[#231815]/10 px-5 py-5 text-[15px] leading-relaxed">{children}</div>
    </details>
  );
}

const Text = ({ v }: { v?: string | null }) =>
  v?.trim() ? (
    <p className="whitespace-pre-line text-justify hyphens-auto">{v}</p>
  ) : (
    <span className="text-[#231815]/45">To be announced</span>
  );

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-[#231815]/12 bg-[#FBF7DF] px-5 py-4 shadow-[0_14px_30px_-24px_rgba(35,24,21,0.5)]">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#231815]/55">{label}</p>
      <p className="mt-1 font-serif text-2xl font-bold leading-tight text-[#231815]">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-[#231815]/60">{sub}</p>}
    </div>
  );
}

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
  const { win: w, error: windowError } = await getWindowDetailed();
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
  const submitted = items.filter((i) => i.done).length;

  const invitation = toFiles(team.invitationLetters);
  const certs = toFiles(team.certificates);
  const travelDocs = toFiles(team.travelDocuments);
  const memoScore = toFiles(team.memorialScoresheets);
  const memoPenalty = toFiles(team.memorialPenaltyMemos);
  const anyRoundScoresheets = rounds.some((r) => toFiles(r.scoresheets).length > 0);
  const anyRoundRemarks = rounds.some((r) => r.remarks?.trim());

  const memoState =
    status === 'open' ? 'Open now' : status === 'late' ? 'Late window' : status === 'before' ? 'Not open yet' : status === 'closed' ? 'Closed' : 'To be announced';

  return (
    /* padding (not margin) so the cream background reaches the very top: no dark strip */
    <div className="min-h-screen bg-[#F5EFC6] pt-28 font-sans text-[#231815] antialiased selection:bg-[#4D0E12] selection:text-[#F5EFC6] sm:pt-32">
      <div className="w-full px-4 pb-24 sm:px-8 lg:px-10">
        {/* ---------- title row ---------- */}
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#231815]/15 pb-6">
          <div className="min-w-0">
            <span className="inline-block rounded-full bg-[#4D0E12] px-3 py-1 text-xs font-bold tracking-[0.18em] text-[#F5EFC6]">
              TEAM #{team.teamCode}
            </span>
            <h1 className="mt-3 font-serif text-3xl font-bold leading-tight sm:text-4xl">{team.universityName}</h1>
          </div>
          <form action="/api/logout" method="post">
            <button className="rounded-full border border-[#231815]/30 px-5 py-2 text-sm font-semibold transition hover:border-[#4D0E12] hover:bg-[#4D0E12] hover:text-[#F5EFC6]">
              Sign out
            </button>
          </form>
        </header>

        <p className="mt-6 text-justify text-lg leading-relaxed text-[#231815]/90 hyphens-auto">
          Welcome to your personalised team portal for Vidhi Pragati. You will find all the logistical information
          here. If you have any questions, write to{' '}
          <a href="mailto:dpiit.ipr@nludelhi.ac.in" className="font-semibold text-[#4D0E12] underline underline-offset-4">
            dpiit.ipr@nludelhi.ac.in
          </a>
          . Use only your team code to identify yourselves (rule 12).
        </p>

        {/* ---------- at a glance ---------- */}
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Stat label="Memorials" value={`${submitted} of 4 submitted`} sub={memoState} />
          <Stat label="Deadline" value={w ? fmtMin(w.deadline) : 'To be announced'} />
          <Stat label="Oral rounds" value={rounds.length > 0 ? `${rounds.length} scheduled` : 'Not announced yet'} />
        </div>

        {team.note?.trim() && (
          <div className="mt-6 flex gap-3 rounded-2xl border border-[#4D0E12]/30 bg-[#A5BCD6]/35 px-5 py-4">
            <span className="mt-0.5 text-[#4D0E12]"><Icon name="bell" /></span>
            <p className="whitespace-pre-line text-justify text-sm font-semibold leading-relaxed hyphens-auto">{team.note}</p>
          </div>
        )}

        <section className="mt-8 grid w-full gap-6 lg:grid-cols-8">
          {/* ---------- main column ---------- */}
          <div className="row-start-2 grid content-start gap-5 lg:col-span-6 lg:row-start-1">
            {announcements.length > 0 && (
              <Block title="Announcements" icon="bell" badge={announcements.length}>
                <ul className="divide-y divide-[#231815]/10">
                  {announcements.map((a) => (
                    <li key={a.id} className="py-4 first:pt-0 last:pb-0">
                      <p className="font-semibold">
                        {a.title}
                        <span className="ml-2 text-xs font-normal text-[#231815]/55">{shortDate(a.createdAt)}</span>
                      </p>
                      {a.body && <p className="mt-1 whitespace-pre-line text-justify hyphens-auto">{a.body}</p>}
                      {toFiles(a.attachment).length > 0 && <div className="mt-3"><Files files={toFiles(a.attachment)} /></div>}
                    </li>
                  ))}
                </ul>
              </Block>
            )}

            <Block title="Memorial submission" icon="upload" badge={`${submitted}/4`}>
              <MemorialUpload status={status} deadlineLabel={fmtMin(w?.deadline)} hardCloseLabel={fmtMin(hard || null)} items={items} />
              {status === 'none' && windowError && (
                <p className="mt-3 wrap-break-word rounded-md border border-[#4D0E12]/40 bg-[#A5BCD6]/30 px-3 py-2 text-xs font-semibold text-[#4D0E12]">
                  Organisers only. Why the window could not be read: {windowError}
                </p>
              )}
            </Block>

            {(memoScore.length > 0 || memoPenalty.length > 0) && (
              <Block title="Memorial scoresheets and penalties" icon="scale" badge={memoScore.length + memoPenalty.length}>
                <div className="grid gap-5 md:grid-cols-2">
                  {memoScore.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#231815]/55">Scoresheets</p>
                      <Files files={memoScore} />
                    </div>
                  )}
                  {memoPenalty.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#231815]/55">Penalty memos</p>
                      <Files files={memoPenalty} />
                    </div>
                  )}
                </div>
              </Block>
            )}

            <Block title="Oral rounds" icon="gavel" badge={rounds.length || undefined}>
              {rounds.length === 0 ? (
                <p className="text-[#231815]/55">Your oral rounds will appear here once they are announced.</p>
              ) : (
                <div className="-mx-5 overflow-x-auto px-5">
                  <table className="w-full min-w-175 border-separate border-spacing-0 overflow-hidden rounded-xl border border-[#231815]/12 text-left text-sm">
                    <thead>
                      <tr className="bg-[#231815] text-[#F5EFC6]">
                        {['Round', 'Side', 'Room', 'Time', 'Opposing team'].map((h) => (
                          <th key={h} className="px-4 py-3 text-xs font-bold uppercase tracking-wider">{h}</th>
                        ))}
                        {anyRoundScoresheets && <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider">Score sheets</th>}
                        {anyRoundRemarks && <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider">Remarks</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {rounds.map((r, i) => (
                        <tr key={i} className="align-top odd:bg-white/50 even:bg-[#A5BCD6]/15">
                          <td className="px-4 py-4 font-serif text-base font-bold">{r.roundName || '–'}</td>
                          <td className="px-4 py-4">
                            {r.side ? (
                              <span className="rounded-full bg-[#4D0E12]/10 px-2.5 py-0.5 text-xs font-bold text-[#4D0E12]">{r.side}</span>
                            ) : 'TBD'}
                          </td>
                          <td className="px-4 py-4">{r.room || 'TBD'}</td>
                          <td className="whitespace-nowrap px-4 py-4">{r.startsAt ? fmtMin(r.startsAt) : 'TBD'}</td>
                          <td className="px-4 py-4 font-semibold">{r.opponentCode ? `#${r.opponentCode}` : 'TBD'}</td>
                          {anyRoundScoresheets && (
                            <td className="px-4 py-4">
                              {toFiles(r.scoresheets).length > 0 ? <Files files={toFiles(r.scoresheets)} /> : <span className="text-[#231815]/40">–</span>}
                            </td>
                          )}
                          {anyRoundRemarks && (
                            <td className="whitespace-pre-line px-4 py-4 text-justify hyphens-auto">{r.remarks || '–'}</td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Block>

            <div className="grid gap-5 md:grid-cols-2">
              <Block title="Arrival" icon="plane"><Text v={team.arrivalDetails} /></Block>
              <Block title="Departure" icon="plane"><Text v={team.departureDetails} /></Block>
            </div>

            <div className="grid items-start gap-5 md:grid-cols-2">
              <Block title="Accommodation" icon="bed"><Text v={team.accommodation} /></Block>
              <Block title="Common resources" icon="folder" badge={resources.length || undefined}>
                {resources.length === 0 ? (
                  <span className="text-[#231815]/45">Nothing yet</span>
                ) : (
                  <ul className="max-h-80 space-y-4 overflow-y-auto pr-1">
                    {resources.map((r) => (
                      <li key={r.id}>
                        <p className="font-semibold">{r.title}</p>
                        {r.body && <p className="mt-1 whitespace-pre-line text-justify hyphens-auto">{r.body}</p>}
                        {toFiles(r.file).length > 0 && <div className="mt-2"><Files files={toFiles(r.file)} /></div>}
                      </li>
                    ))}
                  </ul>
                )}
              </Block>
            </div>

            {travelDocs.length > 0 && (
              <Block title="Travel documents" icon="plane" badge={travelDocs.length}><Files files={travelDocs} /></Block>
            )}
          </div>

          {/* ---------- side column ---------- */}
          <aside className="row-start-1 grid content-start gap-5 lg:sticky lg:top-28 lg:col-span-2 lg:self-start">
            <Block title="Your team" icon="users">
              <p className="font-serif text-xl font-bold leading-snug">{team.universityName}</p>
              <p className="font-bold text-[#4D0E12]">#{team.teamCode}</p>
              <p className="mt-4 text-xs font-bold uppercase tracking-wider text-[#231815]/55">Participants</p>
              {participants.length === 0 ? (
                <p className="mt-1 text-[#231815]/45">Not listed yet</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {participants.map((p, i) => (
                    <li key={i} className="flex items-center gap-3 rounded-xl border border-[#231815]/12 bg-white/50 px-3 py-2">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#A5BCD6] text-xs font-bold">
                        {(p.name || '?').trim().charAt(0).toUpperCase()}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-semibold">{p.name}</span>
                        {p.role && <span className="block text-xs text-[#231815]/60">{p.role}</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Block>

            {invitation.length > 0 && <Block title="Invitation letter" icon="mail" badge={invitation.length}><Files files={invitation} /></Block>}
            {certs.length > 0 && <Block title="Certificates" icon="award" badge={certs.length}><Files files={certs} /></Block>}

            {team.buddy?.name && (
              <Block title="Team buddy" icon="chat">
                <div className="flex items-center justify-between gap-3 rounded-xl border border-[#231815]/12 bg-white/50 px-3 py-2">
                  <span className="font-semibold">{team.buddy.name}</span>
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
    </div>
  );
}