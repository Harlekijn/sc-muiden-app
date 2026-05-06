export type Sport = 'voetbal' | 'hockey';

export type UserRole =
  | 'lid'
  | 'ouder'
  | 'trainer'
  | 'coach'
  | 'teammanager'
  | 'commissielid'
  | 'beheerder';

export type ActivityType = 'training' | 'wedstrijd' | 'bardienst' | 'clubactiviteit';

export type MatchStatus = 'gepland' | 'live' | 'gespeeld' | 'afgelast';

export type TeamMemberRole = 'speler' | 'trainer' | 'coach' | 'teammanager';

export type FamilyLinkStatus = 'pending' | 'approved' | 'rejected';

export type Platform = 'ios' | 'android';

export type FederationSource = 'knvb' | 'knhb';

export interface Profile {
  id: string;
  display_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  sport: Sport[];
  member_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Member {
  id: string;
  first_name: string;
  last_name: string;
  birth_date: string | null;
  email: string | null;
  phone: string | null;
  sport: Sport[];
  role: UserRole;
  clubbase_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface UserFamilyMember {
  id: string;
  profile_id: string;
  member_id: string;
  linked_at: string;
}

export interface FamilyLinkRequest {
  id: string;
  profile_id: string;
  first_name: string;
  last_name: string;
  birth_date: string | null;
  member_id: string | null;
  status: FamilyLinkStatus;
  admin_notes: string | null;
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: string;
  name: string;
  sport: Sport;
  age_category: string | null;
  season: string | null;
  federation_team_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface TeamMember {
  id: string;
  team_id: string;
  member_id: string;
  role: TeamMemberRole;
  jersey_number: number | null;
  created_at: string;
  deleted_at: string | null;
}

export interface Activity {
  id: string;
  type: ActivityType;
  sport: Sport | null;
  team_id: string | null;
  recurring_rule_id: string | null;
  title: string;
  starts_at: string;
  ends_at: string | null;
  location: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Match {
  id: string;
  activity_id: string | null;
  federation_match_id: string | null;
  home_team: string;
  away_team: string;
  score_home: number | null;
  score_away: number | null;
  status: MatchStatus;
  played_at: string | null;
  federation_source: FederationSource | null;
  raw_data: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface BarAssignment {
  id: string;
  activity_id: string;
  member_id: string;
  confirmed_at: string | null;
  created_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  sport: Sport[] | null;
  teams: string[] | null;
  published_at: string | null;
  author_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Notification {
  id: string;
  recipient_profile_id: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  sent_at: string | null;
  read_at: string | null;
  created_at: string;
}

export interface PushToken {
  id: string;
  profile_id: string;
  token: string;
  platform: Platform;
  created_at: string;
  updated_at: string;
}

export interface SyncLog {
  id: string;
  sport: Sport;
  started_at: string;
  finished_at: string | null;
  records_updated: number | null;
  error: string | null;
  created_at: string;
}

export interface RecurringRule {
  id: string;
  team_id: string;
  day_of_week: number; // 1=maandag, 7=zondag
  start_time: string;  // "HH:MM:SS"
  end_time: string | null;
  location: string | null;
  notes: string | null;
  valid_from: string;
  valid_until: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface BarAssignmentWithMember extends BarAssignment {
  member: Pick<Member, 'id' | 'first_name' | 'last_name'>;
}

export interface ActivityWithDetails extends Activity {
  team: Pick<Team, 'id' | 'name' | 'sport'> | null;
  match: Pick<Match, 'id' | 'home_team' | 'away_team' | 'score_home' | 'score_away' | 'status'> | null;
  bar_assignments: BarAssignmentWithMember[];
}
