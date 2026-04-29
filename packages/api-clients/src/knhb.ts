import type { KNHBMatch } from '@sc-muiden/shared';

export interface KNHBClientConfig {
  apiKey: string;
  baseUrl?: string;
}

export async function fetchTeamSchedule(
  _config: KNHBClientConfig,
  _federationTeamId: string
): Promise<KNHBMatch[]> {
  throw new Error('Not implemented: fetchTeamSchedule — Phase 4');
}

export async function fetchMatchResults(
  _config: KNHBClientConfig,
  _federationTeamId: string
): Promise<KNHBMatch[]> {
  throw new Error('Not implemented: fetchMatchResults — Phase 4');
}
