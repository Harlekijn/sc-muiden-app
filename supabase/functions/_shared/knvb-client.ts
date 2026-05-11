export interface KnvbMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  scheduledAt: string;
  venue: string | null;
  status: 'gepland' | 'gespeeld' | 'afgelast';
}

const MOCK_MATCHES: KnvbMatch[] = [
  {
    id: 'knvb-mock-001',
    homeTeam: 'SC Muiden 1',
    awayTeam: 'FC Diemen 1',
    homeScore: null,
    awayScore: null,
    scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    venue: 'Sportpark Muiden, Muiden',
    status: 'gepland',
  },
  {
    id: 'knvb-mock-002',
    homeTeam: 'HV Weesp 2',
    awayTeam: 'SC Muiden 1',
    homeScore: 1,
    awayScore: 3,
    scheduledAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    venue: 'Sportpark Weesp, Weesp',
    status: 'gespeeld',
  },
];

export async function fetchKnvbTeamSchedule(
  teamId: string,
  apiKey: string | undefined
): Promise<KnvbMatch[]> {
  if (!apiKey) {
    return MOCK_MATCHES.map((m) => ({ ...m, id: `${m.id}-${teamId}` }));
  }

  const res = await fetch(
    `https://api.knvbdataservice.nl/v1/teams/${teamId}/schedule`,
    { headers: { Authorization: `Bearer ${apiKey}` } }
  );
  if (!res.ok) throw new Error(`KNVB API fout: ${res.status} ${res.statusText}`);

  const raw = (await res.json()) as unknown[];
  return raw as KnvbMatch[];
}
