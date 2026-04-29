export interface KNVBMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  scheduledAt: string;
  venue: string | null;
  status: string;
}

export interface KNVBStanding {
  position: number;
  teamId: string;
  teamName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
}

export interface KNVBStandings {
  teamId: string;
  season: string;
  standings: KNVBStanding[];
}

export interface KNHBMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  scheduledAt: string;
  venue: string | null;
  status: string;
}
