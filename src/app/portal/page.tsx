import React from 'react';
import { redirect } from 'next/navigation';
import { hg } from '@/lib/hygraph-server';
import { readSession } from '@/lib/session';
import MemorialUpload, { type SlotItem } from '@/components/MemorialUpload';
import {
  SLOTS, type Slot, HARD_CLOSE_HOURS, getWindow, redis, recKey, countedMs, receivedMs, lateHoursAt,
  type Rec,
} from '@/lib/memorial';

export const dynamic = 'force-dynamic';

/*
  Palette (swatches only):
  Transparent Yellow #F5EFC6 · Sceptre Red #4D0E12 · Cerulean Blue #A5BCD6
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
    announcements(where: { OR: [{ audience: All }, { teams_some: { id: $id } }] }, orderBy: createdAt_DESC) {
      id title body pinned createdAt attachment { ${ASSET} }
    }
    commonResources(orderBy: sort_ASC) { id title body file { ${ASSET} } }
  }
`;

type FileItem = { url: string; name: string };

const toFiles = (list: any): FileItem[] =>
  (Array.isArray(list) ? list : list ? [list] : [])
    .map((x: any) => {
      const f = x?.url ? x : x?.file?.url ? x.file : null;
      return f ? { url: f.url, name: x.title || f.fileName || 'Download' } : null;
    })
    .filter(Boolean) as FileItem[];

const IST = 'Asia/Kolkata';

const fmt = (v?: string | number | null) =>
  v
    ? new Intl.DateTimeFormat('en-IN', {
        timeZone: IST,
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      }).format(new Date(v)) + ' IST'
    : 'TBD';

const fmtMin = (v?: string | number | null) =>
  fmt(v).replace(/:\d{2}(?= [AP]M)/i, '');

const shortDate = (v: string) =>
  new Intl.DateTimeFormat('en-IN', {
    timeZone: IST,
    day: 'numeric',
    month: 'short',
  }).format(new Date(v));

const ext = (n?: string) =>
  (n?.split('.').pop() || 'FILE').toUpperCase().slice(0, 4);

function Files({ files }: { files: FileItem[] }) {
  if (files.length === 0) {
    return <span className="text-[#231815]/45">None yet</span>;
  }

  return (
    <ul className="space-y-2">
      {files.map((f) => (
        <li key={f.url} className="flex items-start gap-2">
          <span className="mt-0.5 shrink-0 rounded-full bg-[#4D0E12] px-1.5 py-px text-[10px] font-bold text-[#F5EFC6]">
            {ext(f.name)}
          </span>
          <a
            href={f.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-[#4D0E12] underline-offset-4 hover:underline"
          >
            {f.name}
          </a>
        </li>
      ))}
    </ul>
  );
}

function Panel({
  title,
  children,
  className = '',
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-2xl border border-[#231815]/15 bg-[#A5BCD6]/20 p-5 sm:p-6 ${className}`}>
      <h2 className="font-serif text-xl font-bold text-[#4D0E12]">{title}</h2>
      <div className="mt-3 text-[15px] leading-relaxed">{children}</div>
    </section>
  );
}

const Text = ({ v }: { v?: string | null }) =>
  v?.trim()
    ? <p className="whitespace-pre-line">{v}</p>
    : <span className="text-[#231815]/45">To be announced</span>;

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
        <p className="max-w-sm">
          We could not load your portal right now. Please try again shortly.
        </p>
      </div>
    );
  }

  const team = data.team;

  if (!team) redirect('/login');

  const rounds: any[] = team.rounds ?? [];
  const participants: any[] = team.participants ?? [];

  const announcements: any[] = [...(data.announcements ?? [])].sort(
    (a, b) => Number(b.pinned) - Number(a.pinned)
  );

  const resources: any[] = data.commonResources ?? [];

  /* ---------- Memorial state ---------- */

  const w = await getWindow();
  const now = Date.now();

  const hard = w
    ? w.deadline + HARD_CLOSE_HOURS * 3600000
    : 0;

  const status: 'none' | 'before' | 'open' | 'late' | 'closed' =
    !w ? 'none'
      : now < w.opensAt ? 'before'
      : now <= w.deadline ? 'open'
      : now <= hard ? 'late'
      : 'closed';

  const slots = Object.keys(SLOTS) as Slot[];

  let recs: (Rec | null)[] = slots.map(() => null);

  try {
    recs = await redis().mget<(Rec | null)[]>(
      ...slots.map((s) => recKey(team.teamCode, s))
    );
  } catch (err) {
    console.error('Memorial records failed:', err);
  }

  const items: SlotItem[] = slots.map((slot, i) => {
    const r = recs[i];

    return {
      slot,
      label: SLOTS[slot].label,
      expected: `${team.teamCode}_${SLOTS[slot].letter}`,
      done: r?.status === 'done' && w
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

  return (
    <div className="min-h-screen bg-[#F5EFC6] font-sans text-[#231815] antialiased selection:bg-[#4D0E12] selection:text-[#F5EFC6]">

      <header className="relative isolate overflow-hidden bg-[#231815] text-[#F5EFC6]">
        <div className="absolute inset-0 -z-10 bg-linear-to-br from-[#231815] via-[#231815] to-[#4D0E12]" />

        <div className="mx-auto max-w-7xl flex-wrap items-end justify-between gap-6 px-6 pb-14 pt-32 sm:flex sm:pt-40">
          <div>
            <p className="text-sm font-semibold text-[#A5BCD6]">
              Team #{team.teamCode}
            </p>

            <h1 className="mt-2 max-w-3xl font-serif text-4xl font-bold leading-tight sm:text-5xl">
              {team.universityName}
            </h1>
          </div>

          <form action="/api/logout" method="post">
            <button className="rounded-full border border-[#F5EFC6]/40 px-5 py-2 text-sm font-semibold transition hover:border-[#A5BCD6] hover:text-[#A5BCD6]">
              Sign out
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-10 px-6 pb-28 pt-12">

        <p className="max-w-3xl font-serif text-lg leading-relaxed text-[#231815]/90">
          Welcome to your team portal for Vidhi Pragati. For any question, write to{' '}
          <a
            href="mailto:dpiit.ipr@nludelhi.ac.in"
            className="font-semibold text-[#4D0E12] underline underline-offset-4"
          >
            dpiit.ipr@nludelhi.ac.in
          </a>.
          Remember to use only your Team Code to identify yourselves (rule 12).
        </p>

        {announcements.length > 0 && (
          <Panel title="Announcements" className="bg-[#F5EFC6]">
            <ul className="space-y-4">
              {announcements.map((a) => (
                <li
                  key={a.id}
                  className="border-b border-[#231815]/15 pb-4 last:border-b-0 last:pb-0"
                >
                  <p className="font-semibold">
                    {a.pinned && (
                      <span className="mr-2 text-xs font-bold uppercase tracking-wider text-[#4D0E12]">
                        Pinned
                      </span>
                    )}

                    {a.title}

                    <span className="ml-2 text-xs font-normal text-[#231815]/60">
                      {shortDate(a.createdAt)}
                    </span>
                  </p>

                  {a.body && (
                    <p className="mt-1 whitespace-pre-line">{a.body}</p>
                  )}

                  {a.attachment?.url && (
                    <div className="mt-2">
                      <Files files={toFiles(a.attachment)} />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </Panel>
        )}

        {team.note?.trim() && (
          <div className="whitespace-pre-line rounded-2xl border border-[#231815]/20 bg-[#F5EFC6] px-5 py-4 text-sm font-semibold shadow-[0_12px_30px_-20px_rgba(35,24,21,0.6)]">
            {team.note}
          </div>
        )}

        <MemorialUpload
          status={status}
          deadlineLabel={fmtMin(w?.deadline)}
          hardCloseLabel={fmtMin(hard || null)}
          items={items}
        />

        <div className="grid gap-6 md:grid-cols-2">
          <Panel title="Memorial scoresheets">
            <Files files={toFiles(team.memorialScoresheets)} />
          </Panel>

          <Panel title="Memorial penalty memos">
            <Files files={toFiles(team.memorialPenaltyMemos)} />
          </Panel>
        </div>

        {/* ORAL ROUNDS */}

        <section aria-labelledby="rounds-h" className="space-y-4">
          <h2 id="rounds-h" className="font-serif text-2xl font-bold text-[#4D0E12]">
            Oral rounds
          </h2>

          {rounds.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-[#231815]/30 px-6 py-10 text-center text-[#231815]/70">
              Your oral rounds will appear here once they are announced.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-[#231815]/15 bg-[#A5BCD6]/20">
              <table className="w-full min-w-205 text-left text-sm">
                <thead>
                  <tr className="border-b border-[#231815]/15 text-[#231815]/70">
                    {[
                      'Round',
                      'Side',
                      'Room',
                      'Time',
                      'Opposing team',
                      'Scoresheets',
                      'Remarks',
                    ].map((h) => (
                      <th key={h} scope="col" className="px-4 py-3 font-semibold">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {rounds.map((r, i) => (
                    <tr
                      key={i}
                      className="border-b border-[#231815]/10 align-top last:border-b-0"
                    >
                      <td className="px-4 py-4 font-semibold">{r.roundName || '–'}</td>
                      <td className="px-4 py-4">{r.side || 'TBD'}</td>
                      <td className="px-4 py-4">{r.room || 'TBD'}</td>
                      <td className="whitespace-nowrap px-4 py-4">
                        {r.startsAt ? fmtMin(r.startsAt) : 'TBD'}
                      </td>
                      <td className="px-4 py-4">
                        {r.opponentCode ? `#${r.opponentCode}` : 'TBD'}
                      </td>
                      <td className="px-4 py-4">
                        <Files files={toFiles(r.scoresheets)} />
                      </td>
                      <td className="px-4 py-4">
                        {r.remarks || (
                          <span className="text-[#231815]/45">–</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* TEAM */}

        <div className="grid gap-6 lg:grid-cols-3">
          <Panel title="Your team">
            <p className="font-serif text-lg font-bold leading-snug">
              {team.universityName}
            </p>

            <p className="font-semibold text-[#4D0E12]">
              #{team.teamCode}
            </p>

            <h3 className="mt-4 text-xs font-semibold uppercase tracking-wider text-[#231815]/60">
              Participants
            </h3>

            {participants.length === 0 ? (
              <p className="mt-1 text-[#231815]/45">Not listed yet</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {participants.map((p, i) => (
                  <li key={i}>
                    <span className="font-semibold">{p.name}</span>
                    {p.role && (
                      <span className="block text-sm text-[#231815]/70">
                        {p.role}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Team buddy">
            {team.buddy?.name ? (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#231815]/15 bg-[#F5EFC6] px-3 py-2">
                <span className="font-semibold">{team.buddy.name}</span>

                <span className="flex gap-3 text-sm font-semibold text-[#4D0E12]">
                  {team.buddy.email && (
                    <a
                      href={`mailto:${team.buddy.email}`}
                      className="underline underline-offset-4"
                    >
                      Email
                    </a>
                  )}

                  {team.buddy.phone && (
                    <a
                      href={`tel:${team.buddy.phone}`}
                      className="underline underline-offset-4"
                    >
                      Call
                    </a>
                  )}
                </span>
              </div>
            ) : (
              <span className="text-[#231815]/45">
                Your buddy will be assigned soon.
              </span>
            )}
          </Panel>

          <Panel title="Certificates and letters">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#231815]/60">
              Invitation letter
            </h3>

            <div className="mb-4 mt-1">
              <Files files={toFiles(team.invitationLetters)} />
            </div>

            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#231815]/60">
              Certificates
            </h3>

            <div className="mt-1">
              <Files files={toFiles(team.certificates)} />
            </div>
          </Panel>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Panel title="Arrival">
            <Text v={team.arrivalDetails} />
          </Panel>

          <Panel title="Departure">
            <Text v={team.departureDetails} />
          </Panel>

          <Panel title="Accommodation">
            <Text v={team.accommodation} />
          </Panel>
        </div>

        {toFiles(team.travelDocuments).length > 0 && (
          <Panel title="Travel documents">
            <Files files={toFiles(team.travelDocuments)} />
          </Panel>
        )}

        <Panel title="Common resources">
          {resources.length === 0 ? (
            <span className="text-[#231815]/45">Nothing yet</span>
          ) : (
            <ul className="space-y-4">
              {resources.map((r) => (
                <li key={r.id}>
                  <p className="font-semibold">{r.title}</p>

                  {r.body && (
                    <p className="mt-1 whitespace-pre-line">{r.body}</p>
                  )}

                  {r.file?.url && (
                    <div className="mt-1">
                      <Files files={toFiles(r.file)} />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Panel>

      </main>
    </div>
  );
}