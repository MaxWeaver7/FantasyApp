export interface PlayerGameLog {
  season: number;
  week: number;
  game_id: string;
  team: string;
  opponent: string;
  home_team: string;
  away_team: string;
  location: 'home' | 'away';
  // Receiving
  targets: number;
  receptions: number;
  rec_yards: number;
  rec_tds: number;
  air_yards: number;
  yac: number;
  epa_per_target: number;
  // Rushing
  rush_attempts: number;
  rush_yards: number;
  rush_tds: number;
  epa_per_rush: number;
}

export interface Player {
  player_id: string;
  player_name: string;
  team: string | null;
  position: string | null;
  season?: number;
  games?: number;
  targets?: number;
  receptions?: number;
  receivingYards?: number;
  receivingTouchdowns?: number;
  avgYardsPerCatch?: number;
  rushAttempts?: number;
  rushingYards?: number;
  rushingTouchdowns?: number;
  avgYardsPerRush?: number;
  photoUrl?: string;
  gameLogs?: PlayerGameLog[];
  seasonTotals?: {
    season: number;
    games: number;
    targets: number;
    receptions: number;
    receivingYards: number;
    receivingTouchdowns: number;
    avgYardsPerCatch: number;
    rushAttempts: number;
    rushingYards: number;
    rushingTouchdowns: number;
    avgYardsPerRush: number;
  };
}

export interface FilterOptions {
  seasons: number[];
  weeks: number[];
  teams: string[];
  positions: string[];
}

