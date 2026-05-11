import type { KNVBMatch } from '@sc-muiden/shared';

export interface KNVBClientConfig {
  apiKey: string;
  baseUrl?: string;
}

const MOCK_MATCHES: KNVBMatch[] = [
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

export async function fetchTeamSchedule(
  config: KNVBClientConfig,
  federationTeamId: string
): Promise<KNVBMatch[]> {
  if (!config.apiKey) {
    return MOCK_MATCHES.filter((m) => m.status === 'gepland').map((m) => ({
      ...m,
      id: `${m.id}-${federationTeamId}`,
    }));
  }

  const baseUrl = config.baseUrl ?? 'https://api.knvbdataservice.nl/v1';
  const res = await fetch(`${baseUrl}/teams/${federationTeamId}/schedule`, {
    headers: { Authorization: `Bearer ${config.apiKey}` },
  });
  if (!res.ok) throw new Error(`KNVB API fout: ${res.status} ${res.statusText}`);
  return res.json() as Promise<KNVBMatch[]>;
}

export async function fetchMatchResults(
  config: KNVBClientConfig,
  federationTeamId: string
): Promise<KNVBMatch[]> {
  if (!config.apiKey) {
    return MOCK_MATCHES.filter((m) => m.status === 'gespeeld').map((m) => ({
      ...m,
      id: `${m.id}-${federationTeamId}`,
    }));
  }

  const baseUrl = config.baseUrl ?? 'https://api.knvbdataservice.nl/v1';
  const res = await fetch(`${baseUrl}/teams/${federationTeamId}/results`, {
    headers: { Authorization: `Bearer ${config.apiKey}` },
  });
  if (!res.ok) throw new Error(`KNVB API fout: ${res.status} ${res.statusText}`);
  return res.json() as Promise<KNVBMatch[]>;
}
