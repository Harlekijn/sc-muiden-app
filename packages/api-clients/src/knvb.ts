import type { KNVBMatch, KNVBStandings } from '@sc-muiden/shared';

export interface KNVBClientConfig {
  apiKey: string;
  baseUrl?: string;
}

export async function fetchTeamSchedule(
  _config: KNVBClientConfig,
  _federationTeamId: string
): Promise<KNVBMatch[]> {
  throw new Error('Not implemented: fetchTeamSchedule — Phase 4');
}

export async function fetchMatchResults(
  _config: KNVBClientConfig,
  _federationTeamId: string
): Promise<KNVBMatch[]> {
  throw new Error('Not implemented: fetchMatchResults — Phase 4');
}

export async function fetchStandings(
  _config: KNVBClientConfig,
  _federationTeamId: string
): Promise<KNVBStandings> {
  throw new Error('Not implemented: fetchStandings — Phase 4');
}
