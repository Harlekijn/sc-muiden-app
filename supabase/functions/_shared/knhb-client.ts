export interface KnhbMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  scheduledAt: string;
  venue: string | null;
  status: string;
}

const MOCK_MATCHES: KnhbMatch[] = [
  {
    id: 'knhb-mock-001',
    homeTeam: 'SC Muiden Hockey 1',
    awayTeam: 'HC Muiderberg 1',
    homeScore: null,
    awayScore: null,
    scheduledAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    venue: 'Hockeyveld Muiden, Muiden',
    status: 'gepland',
  },
  {
    id: 'knhb-mock-002',
    homeTeam: 'HC Naarden 1',
    awayTeam: 'SC Muiden Hockey 1',
    homeScore: 2,
    awayScore: 2,
    scheduledAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    venue: 'Hockeyveld Naarden, Naarden',
    status: 'gespeeld',
  },
];

export async function fetchKnhbTeamSchedule(
  teamId: string,
  apiKey: string | undefined
): Promise<KnhbMatch[]> {
  if (!apiKey) {
    return MOCK_MATCHES.map((m) => ({ ...m, id: `${m.id}-${teamId}` }));
  }

  const res = await fetch(
    `https://clubi.hockeyweerelt.nl/api/v1/clubs/teams/${teamId}/schedule`,
    { headers: { 'X-Api-Key': apiKey } }
  );
  if (!res.ok) throw new Error(`KNHB API fout: ${res.status} ${res.statusText}`);

  const raw = (await res.json()) as unknown[];
  return raw as KnhbMatch[];
}
