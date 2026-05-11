import type { KNHBMatch } from '@sc-muiden/shared';

export interface KNHBClientConfig {
  apiKey: string;
  baseUrl?: string;
}

const MOCK_MATCHES: KNHBMatch[] = [
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

export async function fetchTeamSchedule(
  config: KNHBClientConfig,
  federationTeamId: string
): Promise<KNHBMatch[]> {
  if (!config.apiKey) {
    return MOCK_MATCHES.map((m) => ({
      ...m,
      id: `${m.id}-${federationTeamId}`,
    }));
  }

  const baseUrl = config.baseUrl ?? 'https://clubi.hockeyweerelt.nl/api/v1';
  const res = await fetch(`${baseUrl}/clubs/teams/${federationTeamId}/schedule`, {
    headers: { 'X-Api-Key': config.apiKey },
  });
  if (!res.ok) throw new Error(`KNHB API fout: ${res.status} ${res.statusText}`);
  return res.json() as Promise<KNHBMatch[]>;
}

export async function fetchMatchResults(
  config: KNHBClientConfig,
  federationTeamId: string
): Promise<KNHBMatch[]> {
  if (!config.apiKey) {
    return MOCK_MATCHES.filter((m) => m.status === 'gespeeld').map((m) => ({
      ...m,
      id: `${m.id}-${federationTeamId}`,
    }));
  }

  const baseUrl = config.baseUrl ?? 'https://clubi.hockeyweerelt.nl/api/v1';
  const res = await fetch(`${baseUrl}/clubs/teams/${federationTeamId}/results`, {
    headers: { 'X-Api-Key': config.apiKey },
  });
  if (!res.ok) throw new Error(`KNHB API fout: ${res.status} ${res.statusText}`);
  return res.json() as Promise<KNHBMatch[]>;
}
