const MLB_API_BASE = 'https://statsapi.mlb.com/api/v1';
const ESPN_SCOREBOARD_BASE =
  'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard';
const THE_ODDS_API_BASE = 'https://api.the-odds-api.com/v4/sports/baseball_mlb/odds';
const DEFAULT_BOOKMAKERS = ['draftkings', 'caesars', 'fanduel'];
const ODDS_API_KEY = process.env.ODDS_API_KEY ?? '';
const ODDS_API_BOOKMAKERS = (process.env.ODDS_API_BOOKMAKERS ?? '')
  .split(',')
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);
const BOOKMAKER_PRIORITY =
  ODDS_API_BOOKMAKERS.length > 0 ? ODDS_API_BOOKMAKERS : DEFAULT_BOOKMAKERS;

const CURRENT_SEASON = new Date().getFullYear();

type TeamApiResponse = {
  teams?: Array<{
    id: number;
    name: string;
    abbreviation: string;
    teamName?: string;
    locationName?: string;
    league?: {
      id: number;
      name: string;
    };
    division?: {
      id: number;
      name: string;
    };
    venue?: {
      name?: string;
    };
  }>;
};

type StandingRecordResponse = {
  records?: Array<{
    standingsType?: string;
    league?: {
      id: number;
    };
    division?: {
      id: number;
    };
    teamRecords?: Array<{
      team?: {
        id: number;
        name: string;
      };
      wins?: number;
      losses?: number;
      divisionRank?: string;
      leagueRank?: string;
      sportRank?: string;
      gamesBack?: string;
      divisionGamesBack?: string;
      runDifferential?: number;
      winningPercentage?: string;
      streak?: {
        streakCode?: string;
      };
    }>;
  }>;
};

type TeamStatsResponse = {
  stats?: Array<{
    group?: {
      displayName?: string;
    };
    splits?: Array<{
      stat?: Record<string, string | number | undefined>;
    }>;
  }>;
};

type ScheduleResponse = {
  dates?: Array<{
    date?: string;
    games?: ScheduleGame[];
  }>;
};

type ScheduleGame = {
  gamePk: number;
  gameDate: string;
  seriesDescription?: string;
  status?: {
    abstractGameState?: string;
    detailedState?: string;
  };
  venue?: {
    name?: string;
  };
  teams?: {
    home?: {
      score?: number;
      isWinner?: boolean;
      team?: {
        id: number;
        name: string;
      };
    };
    away?: {
      score?: number;
      isWinner?: boolean;
      team?: {
        id: number;
        name: string;
      };
    };
  };
};

type TeamLeadersResponse = {
  teamLeaders?: Array<{
    leaderCategory?: string;
    statGroup?: string;
    leaders?: Array<{
      rank?: number;
      value?: string;
      person?: {
        id: number;
        fullName: string;
      };
    }>;
  }>;
};

type PersonResponse = {
  people?: Array<{
    id: number;
    fullName: string;
    primaryNumber?: string;
    primaryPosition?: {
      abbreviation?: string;
    };
  }>;
};

type PersonStatsResponse = {
  stats?: Array<{
    group?: {
      displayName?: string;
    };
    splits?: Array<{
      stat?: Record<string, string | number | undefined>;
    }>;
  }>;
};

type EspnScoreboardResponse = {
  events?: Array<{
    id: string;
    date: string;
    competitions?: Array<{
      competitors?: Array<{
        homeAway?: 'home' | 'away' | string;
        team?: {
          abbreviation?: string;
          displayName?: string;
          logo?: string;
        };
      }>;
      odds?: Array<{
        provider?: {
          displayName?: string;
        };
        moneyline?: {
          home?: { close?: { odds?: string } };
          away?: { close?: { odds?: string } };
        };
        pointSpread?: {
          home?: { close?: { line?: string; odds?: string } };
          away?: { close?: { line?: string; odds?: string } };
        };
        total?: {
          over?: { close?: { line?: string; odds?: string } };
          under?: { close?: { line?: string; odds?: string } };
        };
      }>;
    }>;
  }>;
};

type TheOddsApiResponse = Array<{
  id?: string;
  commence_time?: string;
  home_team?: string;
  away_team?: string;
  bookmakers?: Array<{
    key?: string;
    title?: string;
    markets?: Array<{
      key?: string;
      outcomes?: Array<{
        name?: string;
        price?: number;
        point?: number;
      }>;
    }>;
  }>;
}>;

export type TeamOption = {
  id: number;
  abbreviation: string;
  officialName: string;
  displayName: string;
  teamName: string;
  locationName: string;
  leagueName: string;
  divisionName: string;
  venueName: string | null;
  logo: string;
};

export type StandingRow = {
  teamId: number;
  abbreviation: string;
  displayName: string;
  logo: string;
  wins: number;
  losses: number;
  winningPercentage: string;
  gamesBack: string;
  rank: number;
  runDifferential: number;
  streak: string;
  isSelected: boolean;
};

export type GameSummary = {
  id: number;
  date: string;
  opponentId: number | null;
  opponentDisplayName: string;
  opponentAbbreviation: string | null;
  opponentLogo: string | null;
  isHome: boolean;
  status: string;
  venueName: string | null;
  teamScore: number | null;
  opponentScore: number | null;
  result: 'W' | 'L' | '--';
  isLive: boolean;
};

export type LiveGameSnapshot = {
  id: number;
  date: string;
  status: string;
  venueName: string | null;
  isHome: boolean;
  opponentDisplayName: string;
  opponentAbbreviation: string | null;
  opponentLogo: string | null;
  teamScore: number | null;
  opponentScore: number | null;
  inning: number | null;
  inningOrdinal: string | null;
  inningHalf: string | null;
  outs: number | null;
  balls: number | null;
  strikes: number | null;
  offenseTeamName: string | null;
  batterName: string | null;
  pitcherName: string | null;
  batterHeadshot: string | null;
  pitcherHeadshot: string | null;
  batterGameSummary: string | null;
  batterHits: number | null;
  batterAtBats: number | null;
  batterRbi: number | null;
  pitcherGameSummary: string | null;
  pitcherInningsPitched: string | null;
  pitcherStrikeouts: number | null;
  pitcherPitchesThrown: number | null;
  firstBaseOccupied: boolean;
  secondBaseOccupied: boolean;
  thirdBaseOccupied: boolean;
  inningLines: Array<{
    inning: number;
    awayRuns: number | null;
    homeRuns: number | null;
  }>;
};

type LiveGameFeedResponse = {
  liveData?: {
    linescore?: {
      currentInning?: number;
      currentInningOrdinal?: string;
      inningHalf?: string;
      outs?: number;
      balls?: number;
      strikes?: number;
      innings?: Array<{
        num?: number;
        away?: {
          runs?: number;
        };
        home?: {
          runs?: number;
        };
      }>;
      offense?: {
        batter?: {
          id?: number;
          fullName?: string;
        };
        pitcher?: {
          id?: number;
          fullName?: string;
        };
        team?: {
          id?: number;
          name?: string;
        };
        first?: {
          id?: number;
        };
        second?: {
          id?: number;
        };
        third?: {
          id?: number;
        };
      };
    };
    plays?: {
      currentPlay?: {
        matchup?: {
          batter?: {
            id?: number;
            fullName?: string;
          };
          pitcher?: {
            id?: number;
            fullName?: string;
          };
        };
      };
    };
    boxscore?: {
      teams?: {
        home?: {
          players?: Record<
            string,
            {
              stats?: {
                batting?: Record<string, string | number | undefined>;
                pitching?: Record<string, string | number | undefined>;
              };
            }
          >;
        };
        away?: {
          players?: Record<
            string,
            {
              stats?: {
                batting?: Record<string, string | number | undefined>;
                pitching?: Record<string, string | number | undefined>;
              };
            }
          >;
        };
      };
    };
  };
};

type LiveMatchupStats = {
  batterHeadshot: string | null;
  pitcherHeadshot: string | null;
  batterGameSummary: string | null;
  batterHits: number | null;
  batterAtBats: number | null;
  batterRbi: number | null;
  pitcherGameSummary: string | null;
  pitcherInningsPitched: string | null;
  pitcherStrikeouts: number | null;
  pitcherPitchesThrown: number | null;
};

export type SeriesSummary = {
  label: string;
  opponentDisplayName: string;
  opponentLogo: string | null;
  opponentAbbreviation: string | null;
  gamesCount: number;
  currentGameNumber: number | null;
  summary: string;
  wins: number;
  losses: number;
  startDate: string;
  endDate: string;
};

export type OddsRow = {
  teamName: string;
  abbreviation: string;
  logo: string | null;
  moneylineAmerican: number | null;
  runLine: number | null;
  runLinePriceAmerican: number | null;
  isSelected: boolean;
};

export type OddsSnapshot = {
  source: string;
  commenceTime: string;
  totalLine: number | null;
  overOddsAmerican: number | null;
  underOddsAmerican: number | null;
  rows: OddsRow[];
};

export type PlayerCard = {
  entryKey: string;
  id: number;
  fullName: string;
  jersey: string;
  position: string;
  badge: string;
  statGroup: 'hitting' | 'pitching';
  leaderValue: string;
  primaryLabel: string;
  primaryValue: string;
  secondaryLabel: string;
  secondaryValue: string;
  headshot: string;
  strikeoutShare: string | null;
  totalBasesShare: string | null;
  hitsShare: string | null;
  homeRunsShare: string | null;
  battingAverage: string | null;
  earnedRunAverage: string | null;
};

export type TeamOverview = {
  generatedAt: string;
  team: {
    id: number;
    abbreviation: string;
    displayName: string;
    logo: string;
    venueName: string | null;
    leagueName: string;
    divisionName: string;
    record: string;
    winningPercentage: string;
    gamesBack: string;
    divisionRank: string;
    leagueRank: string;
    overallRank: string;
    streak: string;
    battingAverage: string | null;
    ops: string | null;
    homeRuns: number;
    hits: number;
    totalBases: number;
    era: string | null;
    strikeOuts: number;
    whip: string | null;
  };
  history: {
    recentGames: GameSummary[];
    previousSeries: SeriesSummary[];
    currentSeries: SeriesSummary | null;
    recentForm: GameSummary[];
  };
  standings: {
    general: StandingRow[];
    league: StandingRow[];
    division: StandingRow[];
  };
  liveGame: LiveGameSnapshot | null;
  odds: OddsSnapshot | null;
  players: PlayerCard[];
};

type LeaderConfig = {
  category: string;
  statGroup: 'hitting' | 'pitching';
  badge: string;
  primaryLabel: string;
  secondaryLabel: string;
};

const leaderConfigs: LeaderConfig[] = [
  {
    category: 'homeRuns',
    statGroup: 'hitting',
    badge: 'Lider HR',
    primaryLabel: 'Home runs',
    secondaryLabel: 'AVG',
  },
  {
    category: 'hits',
    statGroup: 'hitting',
    badge: 'Lider Hits',
    primaryLabel: 'Hits',
    secondaryLabel: 'AVG',
  },
  {
    category: 'totalBases',
    statGroup: 'hitting',
    badge: 'Lider TB',
    primaryLabel: 'Bases totales',
    secondaryLabel: 'AVG',
  },
  {
    category: 'battingAverage',
    statGroup: 'hitting',
    badge: 'Lider AVG',
    primaryLabel: 'AVG',
    secondaryLabel: 'Hits',
  },
  {
    category: 'strikeouts',
    statGroup: 'pitching',
    badge: 'Lider K',
    primaryLabel: 'Ponches',
    secondaryLabel: 'ERA',
  },
  {
    category: 'earnedRunAverage',
    statGroup: 'pitching',
    badge: 'Lider ERA',
    primaryLabel: 'ERA',
    secondaryLabel: 'WHIP',
  },
];

async function fetchJson<T>(url: string, revalidate = 1800): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
    },
    next: {
      revalidate,
    },
  });

  if (!response.ok) {
    throw new Error(`No se pudo consultar la fuente MLB (${response.status}).`);
  }

  return response.json() as Promise<T>;
}

function toNumber(value: string | number | undefined | null) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  if (!value) {
    return 0;
  }

  const parsedValue = Number(String(value).replace(/[^0-9.-]/g, ''));
  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

function percentage(part: number, total: number) {
  if (part <= 0 || total <= 0) {
    return null;
  }

  return `${((part / total) * 100).toFixed(1)}%`;
}

function getTeamLogo(teamId: number) {
  return `https://www.mlbstatic.com/team-logos/${teamId}.svg`;
}

function getPlayerHeadshot(playerId: number) {
  return `https://img.mlbstatic.com/mlb-photos/image/upload/w_180,q_auto:best/v1/people/${playerId}/headshot/67/current`;
}

function normalizeDateKey(dateString: string) {
  return dateString.slice(0, 10).replace(/-/g, '');
}

function normalizeTeamToken(value: string | null | undefined) {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function matchesTeamName(
  source: string | null | undefined,
  candidates: Array<string | null | undefined>
) {
  const sourceToken = normalizeTeamToken(source);

  if (!sourceToken) {
    return false;
  }

  return candidates.some((candidate) => {
    const candidateToken = normalizeTeamToken(candidate);

    return (
      candidateToken.length > 0 &&
      (sourceToken === candidateToken ||
        sourceToken.endsWith(`-${candidateToken}`) ||
        candidateToken.endsWith(`-${sourceToken}`))
    );
  });
}

function getTeamCandidates(team: TeamOption) {
  return [
    team.officialName,
    team.displayName,
    team.locationName,
    team.teamName,
    team.abbreviation,
  ];
}

function getStatsSplit(
  stats: TeamStatsResponse['stats'] | PersonStatsResponse['stats'],
  groupName: string
) {
  return (
    stats?.find((entry) => entry.group?.displayName?.toLowerCase() === groupName)?.splits?.[0]
      ?.stat ?? {}
  );
}

function rankValue(value: string | undefined) {
  const parsedValue = Number.parseInt(value ?? '999', 10);
  return Number.isFinite(parsedValue) ? parsedValue : 999;
}

function buildSeriesSummary(label: string, games: GameSummary[]): SeriesSummary | null {
  if (games.length === 0) {
    return null;
  }

  const wins = games.filter((game) => game.result === 'W').length;
  const losses = games.filter((game) => game.result === 'L').length;
  const sortedGames = [...games].sort(
    (left, right) => new Date(left.date).getTime() - new Date(right.date).getTime()
  );
  const opponent = sortedGames[0];

  return {
    label,
    opponentDisplayName: opponent.opponentDisplayName,
    opponentLogo: opponent.opponentLogo,
    opponentAbbreviation: opponent.opponentAbbreviation,
    gamesCount: games.length,
    currentGameNumber: null,
    summary:
      wins + losses > 0
        ? `${wins}-${losses} en la serie`
        : `${games.length} juego${games.length === 1 ? '' : 's'} programado${games.length === 1 ? '' : 's'}`,
    wins,
    losses,
    startDate: sortedGames[0].date,
    endDate: sortedGames[sortedGames.length - 1].date,
  } satisfies SeriesSummary;
}

function getSeriesKey(game: GameSummary) {
  return `${game.opponentId ?? game.opponentAbbreviation ?? game.opponentDisplayName}-${
    game.isHome ? 'H' : 'A'
  }`;
}

function extractSeriesGroups(
  games: GameSummary[],
  direction: 'past' | 'future',
  limit = Number.POSITIVE_INFINITY
) {
  if (games.length === 0) {
    return [];
  }

  const orderedGames = [...games].sort((left, right) =>
    direction === 'past'
      ? new Date(right.date).getTime() - new Date(left.date).getTime()
      : new Date(left.date).getTime() - new Date(right.date).getTime()
  );

  const groups: GameSummary[][] = [];

  for (const game of orderedGames) {
    const lastGroup = groups[groups.length - 1];
    const lastGame = lastGroup?.[lastGroup.length - 1];

    if (!lastGroup || !lastGame || getSeriesKey(lastGame) !== getSeriesKey(game)) {
      if (groups.length >= limit) {
        break;
      }

      groups.push([game]);
      continue;
    }

    lastGroup.push(game);
  }

  return groups;
}

function buildCurrentSeriesSummary(games: GameSummary[]): SeriesSummary | null {
  if (games.length === 0) {
    return null;
  }

  const orderedGames = [...games].sort(
    (left, right) => new Date(left.date).getTime() - new Date(right.date).getTime()
  );
  const anchorIndex = orderedGames.findIndex((game) => game.isLive || game.result === '--');

  if (anchorIndex === -1) {
    return null;
  }

  const anchorGame = orderedGames[anchorIndex];
  const anchorKey = getSeriesKey(anchorGame);
  const seriesGames = [anchorGame];

  for (let index = anchorIndex - 1; index >= 0; index -= 1) {
    if (getSeriesKey(orderedGames[index]) !== anchorKey) {
      break;
    }

    seriesGames.unshift(orderedGames[index]);
  }

  for (let index = anchorIndex + 1; index < orderedGames.length; index += 1) {
    if (getSeriesKey(orderedGames[index]) !== anchorKey) {
      break;
    }

    seriesGames.push(orderedGames[index]);
  }

  const seriesSummary = buildSeriesSummary('Serie actual', seriesGames);
  if (!seriesSummary) {
    return null;
  }

  return {
    ...seriesSummary,
    currentGameNumber: seriesGames.findIndex((game) => game.id === anchorGame.id) + 1,
  } satisfies SeriesSummary;
}

function parseAmericanOdds(value: string | undefined) {
  if (!value) {
    return null;
  }

  const parsedValue = Number.parseInt(value.replace(/[^0-9+-]/g, ''), 10);
  return Number.isFinite(parsedValue) ? parsedValue : null;
}

function parseRunLine(value: string | undefined) {
  if (!value) {
    return null;
  }

  const parsedValue = Number(value.replace(/[^0-9.+-]/g, ''));
  return Number.isFinite(parsedValue) ? parsedValue : null;
}

function parseTotalLine(value: string | undefined) {
  if (!value) {
    return null;
  }

  const cleanedValue = value.replace(/^[ou]/i, '');
  const parsedValue = Number(cleanedValue);
  return Number.isFinite(parsedValue) ? parsedValue : null;
}

function buildGameSummary(
  game: ScheduleGame,
  selectedTeamId: number,
  teamsById: Map<number, TeamOption>
) {
  const homeTeam = game.teams?.home?.team;
  const awayTeam = game.teams?.away?.team;

  if (!homeTeam || !awayTeam) {
    return null;
  }

  const isHome = homeTeam.id === selectedTeamId;
  const opponent = isHome ? awayTeam : homeTeam;
  const teamLine = isHome ? game.teams?.home : game.teams?.away;
  const opponentLine = isHome ? game.teams?.away : game.teams?.home;
  const opponentData = teamsById.get(opponent.id);
  const didWin =
    typeof teamLine?.isWinner === 'boolean'
      ? teamLine.isWinner
      : typeof opponentLine?.isWinner === 'boolean'
        ? !opponentLine.isWinner
        : null;

  return {
    id: game.gamePk,
    date: game.gameDate,
    opponentId: opponent.id ?? null,
    opponentDisplayName: opponentData?.displayName ?? opponent.name,
    opponentAbbreviation: opponentData?.abbreviation ?? null,
    opponentLogo: opponentData?.logo ?? null,
    isHome,
    status: game.status?.detailedState ?? 'Programado',
    venueName: game.venue?.name ?? null,
    teamScore: typeof teamLine?.score === 'number' ? teamLine.score : null,
    opponentScore: typeof opponentLine?.score === 'number' ? opponentLine.score : null,
    result:
      didWin === true
        ? 'W'
        : didWin === false
          ? 'L'
          : '--',
    isLive: game.status?.abstractGameState === 'Live',
  } satisfies GameSummary;
}

async function getLiveGameDetails(gamePk: number, teamsById: Map<number, TeamOption>) {
  const data = await fetchJson<LiveGameFeedResponse>(
    `${MLB_API_BASE}.1/game/${gamePk}/feed/live`,
    15
  );

  const linescore = data.liveData?.linescore;
  const offense = linescore?.offense;
  const currentMatchup = data.liveData?.plays?.currentPlay?.matchup;
  const offenseTeam =
    (offense?.team?.id ? teamsById.get(offense.team.id) : null) ?? null;
  const batterId = currentMatchup?.batter?.id ?? offense?.batter?.id ?? null;
  const pitcherId = currentMatchup?.pitcher?.id ?? offense?.pitcher?.id ?? null;
  const matchupStats = getLiveMatchupStats(data, batterId, pitcherId);

  return {
    inning: linescore?.currentInning ?? null,
    inningOrdinal: linescore?.currentInningOrdinal ?? null,
    inningHalf: linescore?.inningHalf ?? null,
    outs: typeof linescore?.outs === 'number' ? linescore.outs : null,
    balls: typeof linescore?.balls === 'number' ? linescore.balls : null,
    strikes: typeof linescore?.strikes === 'number' ? linescore.strikes : null,
    offenseTeamName: offenseTeam?.displayName ?? offense?.team?.name ?? null,
    batterName: currentMatchup?.batter?.fullName ?? offense?.batter?.fullName ?? null,
    pitcherName: currentMatchup?.pitcher?.fullName ?? offense?.pitcher?.fullName ?? null,
    batterHeadshot: matchupStats.batterHeadshot,
    pitcherHeadshot: matchupStats.pitcherHeadshot,
    batterGameSummary: matchupStats.batterGameSummary,
    batterHits: matchupStats.batterHits,
    batterAtBats: matchupStats.batterAtBats,
    batterRbi: matchupStats.batterRbi,
    pitcherGameSummary: matchupStats.pitcherGameSummary,
    pitcherInningsPitched: matchupStats.pitcherInningsPitched,
    pitcherStrikeouts: matchupStats.pitcherStrikeouts,
    pitcherPitchesThrown: matchupStats.pitcherPitchesThrown,
    firstBaseOccupied: Boolean(offense?.first),
    secondBaseOccupied: Boolean(offense?.second),
    thirdBaseOccupied: Boolean(offense?.third),
    inningLines: (linescore?.innings ?? []).map((entry) => ({
      inning: typeof entry.num === 'number' ? entry.num : 0,
      awayRuns: typeof entry.away?.runs === 'number' ? entry.away.runs : null,
      homeRuns: typeof entry.home?.runs === 'number' ? entry.home.runs : null,
    })),
  };
}

function getLiveMatchupStats(
  data: LiveGameFeedResponse,
  batterId: number | null,
  pitcherId: number | null
): LiveMatchupStats {
  const homePlayers = data.liveData?.boxscore?.teams?.home?.players ?? {};
  const awayPlayers = data.liveData?.boxscore?.teams?.away?.players ?? {};
  const players = {
    ...homePlayers,
    ...awayPlayers,
  };
  const batterStats = batterId ? players[`ID${batterId}`]?.stats?.batting ?? {} : {};
  const pitcherStats = pitcherId ? players[`ID${pitcherId}`]?.stats?.pitching ?? {} : {};

  return {
    batterHeadshot: batterId ? getPlayerHeadshot(batterId) : null,
    pitcherHeadshot: pitcherId ? getPlayerHeadshot(pitcherId) : null,
    batterGameSummary:
      batterStats.summary !== undefined && batterStats.summary !== null
        ? String(batterStats.summary)
        : null,
    batterHits:
      batterStats.hits !== undefined && batterStats.hits !== null
        ? toNumber(batterStats.hits)
        : null,
    batterAtBats:
      batterStats.atBats !== undefined && batterStats.atBats !== null
        ? toNumber(batterStats.atBats)
        : null,
    batterRbi:
      batterStats.rbi !== undefined && batterStats.rbi !== null
        ? toNumber(batterStats.rbi)
        : null,
    pitcherGameSummary:
      pitcherStats.summary !== undefined && pitcherStats.summary !== null
        ? String(pitcherStats.summary)
        : null,
    pitcherInningsPitched:
      pitcherStats.inningsPitched !== undefined && pitcherStats.inningsPitched !== null
        ? String(pitcherStats.inningsPitched)
        : null,
    pitcherStrikeouts:
      pitcherStats.strikeOuts !== undefined && pitcherStats.strikeOuts !== null
        ? toNumber(pitcherStats.strikeOuts)
        : null,
    pitcherPitchesThrown:
      pitcherStats.pitchesThrown !== undefined && pitcherStats.pitchesThrown !== null
        ? toNumber(pitcherStats.pitchesThrown)
        : pitcherStats.numberOfPitches !== undefined && pitcherStats.numberOfPitches !== null
          ? toNumber(pitcherStats.numberOfPitches)
          : null,
  };
}

function mapEspnEventToOddsSnapshot(
  event: NonNullable<EspnScoreboardResponse['events']>[number],
  selectedTeam: TeamOption
) {
  const competition = event.competitions?.[0];
  const odds = competition?.odds?.[0];

  if (!competition || !odds) {
    return null;
  }

  const homeCompetitor = competition.competitors?.find(
    (competitor) => competitor.homeAway === 'home'
  );
  const awayCompetitor = competition.competitors?.find(
    (competitor) => competitor.homeAway === 'away'
  );

  if (!homeCompetitor?.team || !awayCompetitor?.team) {
    return null;
  }

  return {
    source: odds.provider?.displayName ?? 'ESPN',
    commenceTime: event.date,
    totalLine:
      parseTotalLine(odds.total?.over?.close?.line) ??
      parseTotalLine(odds.total?.under?.close?.line),
    overOddsAmerican: parseAmericanOdds(odds.total?.over?.close?.odds),
    underOddsAmerican: parseAmericanOdds(odds.total?.under?.close?.odds),
    rows: [
      {
        teamName: awayCompetitor.team.displayName ?? awayCompetitor.team.abbreviation ?? 'Away',
        abbreviation: awayCompetitor.team.abbreviation ?? 'AWY',
        logo: awayCompetitor.team.logo ?? null,
        moneylineAmerican: parseAmericanOdds(odds.moneyline?.away?.close?.odds),
        runLine: parseRunLine(odds.pointSpread?.away?.close?.line),
        runLinePriceAmerican: parseAmericanOdds(odds.pointSpread?.away?.close?.odds),
        isSelected: awayCompetitor.team.abbreviation === selectedTeam.abbreviation,
      },
      {
        teamName: homeCompetitor.team.displayName ?? homeCompetitor.team.abbreviation ?? 'Home',
        abbreviation: homeCompetitor.team.abbreviation ?? 'HME',
        logo: homeCompetitor.team.logo ?? null,
        moneylineAmerican: parseAmericanOdds(odds.moneyline?.home?.close?.odds),
        runLine: parseRunLine(odds.pointSpread?.home?.close?.line),
        runLinePriceAmerican: parseAmericanOdds(odds.pointSpread?.home?.close?.odds),
        isSelected: homeCompetitor.team.abbreviation === selectedTeam.abbreviation,
      },
    ],
  } satisfies OddsSnapshot;
}

function findTeamByOddsName(teams: TeamOption[], name: string | undefined) {
  if (!name) {
    return null;
  }

  return (
    teams.find((team) => matchesTeamName(name, getTeamCandidates(team))) ?? null
  );
}

function mapTheOddsEventToSnapshot(
  event: TheOddsApiResponse[number],
  selectedTeam: TeamOption,
  teams: TeamOption[]
) {
  const bookmakers = event.bookmakers ?? [];

  if (!event.home_team || !event.away_team || bookmakers.length === 0) {
    return null;
  }

  const bookmaker =
    BOOKMAKER_PRIORITY.map((key) =>
      bookmakers.find((entry) => entry.key?.toLowerCase() === key)
    ).find(Boolean) ?? bookmakers[0];

  if (!bookmaker?.markets?.length) {
    return null;
  }

  const homeTeam = findTeamByOddsName(teams, event.home_team);
  const awayTeam = findTeamByOddsName(teams, event.away_team);
  const h2hMarket = bookmaker.markets.find((market) => market.key === 'h2h');
  const spreadsMarket = bookmaker.markets.find((market) => market.key === 'spreads');
  const totalsMarket = bookmaker.markets.find((market) => market.key === 'totals');
  const homeMoneyline = h2hMarket?.outcomes?.find((outcome) =>
    matchesTeamName(outcome.name, [event.home_team, homeTeam?.officialName, homeTeam?.displayName])
  );
  const awayMoneyline = h2hMarket?.outcomes?.find((outcome) =>
    matchesTeamName(outcome.name, [event.away_team, awayTeam?.officialName, awayTeam?.displayName])
  );
  const homeSpread = spreadsMarket?.outcomes?.find((outcome) =>
    matchesTeamName(outcome.name, [event.home_team, homeTeam?.officialName, homeTeam?.displayName])
  );
  const awaySpread = spreadsMarket?.outcomes?.find((outcome) =>
    matchesTeamName(outcome.name, [event.away_team, awayTeam?.officialName, awayTeam?.displayName])
  );
  const overOutcome = totalsMarket?.outcomes?.find((outcome) =>
    normalizeTeamToken(outcome.name) === 'over'
  );
  const underOutcome = totalsMarket?.outcomes?.find((outcome) =>
    normalizeTeamToken(outcome.name) === 'under'
  );

  if (!homeMoneyline && !awayMoneyline && !homeSpread && !awaySpread && !overOutcome && !underOutcome) {
    return null;
  }

  return {
    source: bookmaker.title ?? 'The Odds API',
    commenceTime: event.commence_time ?? new Date().toISOString(),
    totalLine:
      typeof overOutcome?.point === 'number'
        ? overOutcome.point
        : typeof underOutcome?.point === 'number'
          ? underOutcome.point
          : null,
    overOddsAmerican:
      typeof overOutcome?.price === 'number' ? overOutcome.price : null,
    underOddsAmerican:
      typeof underOutcome?.price === 'number' ? underOutcome.price : null,
    rows: [
      {
        teamName: awayTeam?.displayName ?? event.away_team,
        abbreviation: awayTeam?.abbreviation ?? 'AWY',
        logo: awayTeam?.logo ?? null,
        moneylineAmerican:
          typeof awayMoneyline?.price === 'number' ? awayMoneyline.price : null,
        runLine:
          typeof awaySpread?.point === 'number' ? awaySpread.point : null,
        runLinePriceAmerican:
          typeof awaySpread?.price === 'number' ? awaySpread.price : null,
        isSelected: awayTeam?.abbreviation === selectedTeam.abbreviation,
      },
      {
        teamName: homeTeam?.displayName ?? event.home_team,
        abbreviation: homeTeam?.abbreviation ?? 'HME',
        logo: homeTeam?.logo ?? null,
        moneylineAmerican:
          typeof homeMoneyline?.price === 'number' ? homeMoneyline.price : null,
        runLine:
          typeof homeSpread?.point === 'number' ? homeSpread.point : null,
        runLinePriceAmerican:
          typeof homeSpread?.price === 'number' ? homeSpread.price : null,
        isSelected: homeTeam?.abbreviation === selectedTeam.abbreviation,
      },
    ],
  } satisfies OddsSnapshot;
}

async function getBookmakerOddsForTeam(
  selectedTeam: TeamOption,
  teams: TeamOption[],
  dates: string[]
) {
  if (!ODDS_API_KEY) {
    return null;
  }

  try {
    const uniqueDates = [...new Set(dates.map((date) => normalizeDateKey(date)).filter(Boolean))];
    const url = new URL(THE_ODDS_API_BASE);
    url.searchParams.set('apiKey', ODDS_API_KEY);
    url.searchParams.set('regions', 'us');
    url.searchParams.set('markets', 'h2h,spreads,totals');
    url.searchParams.set('oddsFormat', 'american');
    url.searchParams.set('dateFormat', 'iso');
    url.searchParams.set('bookmakers', BOOKMAKER_PRIORITY.join(','));

    const response = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as TheOddsApiResponse;
    const event = data.find((entry) => {
      const eventDate = entry.commence_time ? normalizeDateKey(entry.commence_time) : '';
      return (
        matchesTeamName(entry.home_team, getTeamCandidates(selectedTeam)) ||
        matchesTeamName(entry.away_team, getTeamCandidates(selectedTeam))
      ) && (uniqueDates.length === 0 || uniqueDates.includes(eventDate));
    });

    if (!event) {
      return null;
    }

    return mapTheOddsEventToSnapshot(event, selectedTeam, teams);
  } catch {
    return null;
  }
}

async function getEspnOddsForTeam(selectedTeam: TeamOption, dates: string[]) {
  const uniqueDates = [...new Set(dates.map((date) => normalizeDateKey(date)).filter(Boolean))];

  for (const date of uniqueDates) {
    const url = new URL(ESPN_SCOREBOARD_BASE);
    url.searchParams.set('dates', date);

    const response = await fetchJson<EspnScoreboardResponse>(url.toString(), 300);
    const event = (response.events ?? []).find((entry) =>
      entry.competitions?.[0]?.competitors?.some(
        (competitor) => competitor.team?.abbreviation === selectedTeam.abbreviation
      )
    );

    if (!event) {
      continue;
    }

    const snapshot = mapEspnEventToOddsSnapshot(event, selectedTeam);
    if (snapshot) {
      return snapshot;
    }
  }

  return null;
}

async function getPlayerCard(
  playerId: number,
  config: LeaderConfig,
  leaderValue: string,
  teamTotals: {
    homeRuns: number;
    hits: number;
    totalBases: number;
    strikeOuts: number;
  }
) {
  const [personData, statsData] = await Promise.all([
    fetchJson<PersonResponse>(`${MLB_API_BASE}/people/${playerId}`, 3600),
    fetchJson<PersonStatsResponse>(
      `${MLB_API_BASE}/people/${playerId}/stats?stats=season&group=hitting,pitching&season=${CURRENT_SEASON}`,
      3600
    ),
  ]);

  const person = personData.people?.[0];
  const hittingStats = getStatsSplit(statsData.stats, 'hitting');
  const pitchingStats = getStatsSplit(statsData.stats, 'pitching');
  const hittingAverageRaw = hittingStats.avg;
  const earnedRunAverageRaw = pitchingStats.era;
  const whipRaw = pitchingStats.whip;
  const homeRuns = toNumber(hittingStats.homeRuns);
  const hits = toNumber(hittingStats.hits);
  const totalBases = toNumber(hittingStats.totalBases);
  const strikeOuts = toNumber(pitchingStats.strikeOuts);

  let primaryValue = leaderValue;
  let secondaryValue =
    config.statGroup === 'pitching'
      ? String(earnedRunAverageRaw ?? '--')
      : String(hittingAverageRaw ?? '--');

  if (config.category === 'battingAverage') {
    primaryValue = String(hittingAverageRaw ?? leaderValue ?? '--');
    secondaryValue = hits > 0 ? String(hits) : '--';
  }

  if (config.category === 'earnedRunAverage') {
    primaryValue = String(earnedRunAverageRaw ?? leaderValue ?? '--');
    secondaryValue = String(whipRaw ?? '--');
  }

  return {
    entryKey: `${config.category}-${playerId}`,
    id: playerId,
    fullName: person?.fullName ?? 'Jugador MLB',
    jersey: person?.primaryNumber ?? '--',
    position: person?.primaryPosition?.abbreviation ?? '--',
    badge: config.badge,
    statGroup: config.statGroup,
    leaderValue,
    primaryLabel: config.primaryLabel,
    primaryValue,
    secondaryLabel: config.secondaryLabel,
    secondaryValue,
    headshot: getPlayerHeadshot(playerId),
    strikeoutShare: percentage(strikeOuts, teamTotals.strikeOuts),
    totalBasesShare: percentage(totalBases, teamTotals.totalBases),
    hitsShare: percentage(hits, teamTotals.hits),
    homeRunsShare: percentage(homeRuns, teamTotals.homeRuns),
    battingAverage:
      hittingAverageRaw !== undefined && hittingAverageRaw !== null
        ? String(hittingAverageRaw)
        : null,
    earnedRunAverage:
      earnedRunAverageRaw !== undefined && earnedRunAverageRaw !== null
        ? String(earnedRunAverageRaw)
        : null,
  } satisfies PlayerCard;
}

export async function getMlbTeams() {
  const data = await fetchJson<TeamApiResponse>(
    `${MLB_API_BASE}/teams?sportId=1&season=${CURRENT_SEASON}`,
    86400
  );

  return (data.teams ?? [])
    .map((team) => {
      const locationName = team.locationName ?? '';
      const officialName = team.name;
      const teamName = team.teamName ?? team.name;
      const displayName = [locationName, teamName].filter(Boolean).join(' ').trim();

      return {
        id: team.id,
        abbreviation: team.abbreviation,
        officialName,
        displayName,
        teamName,
        locationName,
        leagueName: team.league?.name ?? 'MLB',
        divisionName: team.division?.name ?? 'Division',
        venueName: team.venue?.name ?? null,
        logo: getTeamLogo(team.id),
      } satisfies TeamOption;
    })
    .sort((left, right) => left.displayName.localeCompare(right.displayName, 'es'));
}

export async function getMlbTeamOverview(teamId: number) {
  const teams = await getMlbTeams();
  const teamsById = new Map(teams.map((team) => [team.id, team]));
  const selectedTeam = teamsById.get(teamId);

  if (!selectedTeam) {
    throw new Error('No encontré ese equipo en MLB.');
  }

  const [standingsData, teamStatsData, scheduleData, leadersData] = await Promise.all([
    fetchJson<StandingRecordResponse>(
      `${MLB_API_BASE}/standings?leagueId=103,104&season=${CURRENT_SEASON}&standingsTypes=byDivision`,
      900
    ),
    fetchJson<TeamStatsResponse>(
      `${MLB_API_BASE}/teams/${teamId}/stats?stats=season&group=hitting,pitching&season=${CURRENT_SEASON}`,
      1800
    ),
    fetchJson<ScheduleResponse>(
      `${MLB_API_BASE}/schedule?teamId=${teamId}&sportId=1&season=${CURRENT_SEASON}&gameType=R`,
      300
    ),
    fetchJson<TeamLeadersResponse>(
      `${MLB_API_BASE}/teams/${teamId}/leaders?leaderCategories=homeRuns,hits,totalBases,battingAverage,strikeouts,earnedRunAverage&season=${CURRENT_SEASON}&leaderGameTypes=R`,
      1800
    ),
  ]);

  const standings = (standingsData.records ?? []).flatMap((record) =>
    (record.teamRecords ?? []).map((teamRecord) => {
      const team = teamsById.get(teamRecord.team?.id ?? 0);

      return {
        teamId: teamRecord.team?.id ?? 0,
        abbreviation: team?.abbreviation ?? teamRecord.team?.name ?? 'MLB',
        displayName: team?.displayName ?? teamRecord.team?.name ?? 'Equipo MLB',
        logo: team?.logo ?? getTeamLogo(teamRecord.team?.id ?? 0),
        wins: teamRecord.wins ?? 0,
        losses: teamRecord.losses ?? 0,
        winningPercentage: teamRecord.winningPercentage ?? '.000',
        gamesBack: teamRecord.divisionGamesBack ?? teamRecord.gamesBack ?? '-',
        rank: rankValue(teamRecord.sportRank),
        runDifferential: teamRecord.runDifferential ?? 0,
        streak: teamRecord.streak?.streakCode ?? '--',
        leagueName: team?.leagueName ?? 'MLB',
        divisionName: team?.divisionName ?? 'Division',
        divisionRank: teamRecord.divisionRank ?? '--',
        leagueRank: teamRecord.leagueRank ?? '--',
        overallRank: teamRecord.sportRank ?? '--',
      };
    })
  );

  const uniqueStandings = [...new Map(standings.map((row) => [row.teamId, row])).values()];
  const selectedStanding =
    uniqueStandings.find((row) => row.teamId === teamId) ??
    ({
      teamId,
      abbreviation: selectedTeam.abbreviation,
      displayName: selectedTeam.displayName,
      logo: selectedTeam.logo,
      wins: 0,
      losses: 0,
      winningPercentage: '.000',
      gamesBack: '-',
      rank: 999,
      runDifferential: 0,
      streak: '--',
      leagueName: selectedTeam.leagueName,
      divisionName: selectedTeam.divisionName,
      divisionRank: '--',
      leagueRank: '--',
      overallRank: '--',
    } as const);

  const generalStandings = [...uniqueStandings]
    .sort((left, right) => left.rank - right.rank)
    .map((row) => ({
      teamId: row.teamId,
      abbreviation: row.abbreviation,
      displayName: row.displayName,
      logo: row.logo,
      wins: row.wins,
      losses: row.losses,
      winningPercentage: row.winningPercentage,
      gamesBack: row.gamesBack,
      rank: row.rank,
      runDifferential: row.runDifferential,
      streak: row.streak,
      isSelected: row.teamId === teamId,
    }));

  const leagueStandings = uniqueStandings
    .filter((row) => row.leagueName === selectedTeam.leagueName)
    .sort((left, right) => rankValue(String(left.leagueRank)) - rankValue(String(right.leagueRank)))
    .map((row) => ({
      teamId: row.teamId,
      abbreviation: row.abbreviation,
      displayName: row.displayName,
      logo: row.logo,
      wins: row.wins,
      losses: row.losses,
      winningPercentage: row.winningPercentage,
      gamesBack: row.teamId === teamId ? row.gamesBack : '--',
      rank: rankValue(String(row.leagueRank)),
      runDifferential: row.runDifferential,
      streak: row.streak,
      isSelected: row.teamId === teamId,
    }));

  const divisionStandings = uniqueStandings
    .filter((row) => row.divisionName === selectedTeam.divisionName)
    .sort(
      (left, right) => rankValue(String(left.divisionRank)) - rankValue(String(right.divisionRank))
    )
    .map((row) => ({
      teamId: row.teamId,
      abbreviation: row.abbreviation,
      displayName: row.displayName,
      logo: row.logo,
      wins: row.wins,
      losses: row.losses,
      winningPercentage: row.winningPercentage,
      gamesBack: row.gamesBack,
      rank: rankValue(String(row.divisionRank)),
      runDifferential: row.runDifferential,
      streak: row.streak,
      isSelected: row.teamId === teamId,
    }));

  const scheduleGames = (scheduleData.dates ?? []).flatMap((date) =>
    (date.games ?? []).reduce<GameSummary[]>((games, game) => {
      const summary = buildGameSummary(game, teamId, teamsById);

      if (summary) {
        games.push(summary);
      }

      return games;
    }, [])
  );

  const liveGameSummary = scheduleGames.find((game) => game.isLive) ?? null;
  const completedGames = scheduleGames.filter((game) => game.result !== '--' && !game.isLive);
  const upcomingGames = scheduleGames.filter((game) => game.result === '--' && !game.isLive);

  const recentGames = [...completedGames]
    .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime())
    .slice(0, 5);
  const previousSeries = extractSeriesGroups(completedGames, 'past', 2)
    .map((group, index) =>
      buildSeriesSummary(index === 0 ? 'Serie previa' : 'Serie anterior', group)
    )
    .filter((series): series is SeriesSummary => Boolean(series));
  const currentSeries = buildCurrentSeriesSummary(scheduleGames);
  const recentForm = [...completedGames]
    .sort((left, right) => new Date(left.date).getTime() - new Date(right.date).getTime())
    .slice(-8);

  const hittingStats = getStatsSplit(teamStatsData.stats, 'hitting');
  const pitchingStats = getStatsSplit(teamStatsData.stats, 'pitching');
  const teamTotals = {
    homeRuns: toNumber(hittingStats.homeRuns),
    hits: toNumber(hittingStats.hits),
    totalBases: toNumber(hittingStats.totalBases),
    strikeOuts: toNumber(pitchingStats.strikeOuts),
  };

  const selectedLeaders = leaderConfigs.flatMap((config) => {
    const leaderGroup = (leadersData.teamLeaders ?? []).find(
      (entry) =>
        entry.leaderCategory === config.category && entry.statGroup === config.statGroup
    );
    const leader = leaderGroup?.leaders?.[0];

    if (!leader?.person?.id || !leader.value) {
      return [];
    }

    return [
      {
        config,
        playerId: leader.person.id,
        leaderValue: leader.value,
      },
    ];
  });

  const players = await Promise.all(
    selectedLeaders.map((leader) =>
      getPlayerCard(leader.playerId, leader.config, leader.leaderValue, teamTotals)
    )
  );

  const oddsCandidateDates = [
    liveGameSummary?.date,
    ...upcomingGames.slice(0, 5).map((game) => game.date),
  ].filter((date): date is string => Boolean(date));
  const odds = oddsCandidateDates.length > 0
    ? (await getBookmakerOddsForTeam(selectedTeam, teams, oddsCandidateDates)) ??
      (await getEspnOddsForTeam(selectedTeam, oddsCandidateDates))
    : null;

  const liveGame = liveGameSummary
    ? {
        id: liveGameSummary.id,
        date: liveGameSummary.date,
        status: liveGameSummary.status,
        venueName: liveGameSummary.venueName,
        isHome: liveGameSummary.isHome,
        opponentDisplayName: liveGameSummary.opponentDisplayName,
        opponentAbbreviation: liveGameSummary.opponentAbbreviation,
        opponentLogo: liveGameSummary.opponentLogo,
        teamScore: liveGameSummary.teamScore,
        opponentScore: liveGameSummary.opponentScore,
        inning: null,
        inningOrdinal: null,
        inningHalf: null,
        outs: null,
        balls: null,
        strikes: null,
        offenseTeamName: null,
        batterName: null,
        pitcherName: null,
        batterHeadshot: null,
        pitcherHeadshot: null,
        batterGameSummary: null,
        batterHits: null,
        batterAtBats: null,
        batterRbi: null,
        pitcherGameSummary: null,
        pitcherInningsPitched: null,
        pitcherStrikeouts: null,
        pitcherPitchesThrown: null,
        firstBaseOccupied: false,
        secondBaseOccupied: false,
        thirdBaseOccupied: false,
        inningLines: [],
      }
    : null;

  if (liveGame) {
    try {
      const details = await getLiveGameDetails(liveGame.id, teamsById);
      Object.assign(liveGame, details);
    } catch {
      // Keep the score panel usable even if the live-feed details fail transiently.
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    team: {
      id: selectedTeam.id,
      abbreviation: selectedTeam.abbreviation,
      displayName: selectedTeam.displayName,
      logo: selectedTeam.logo,
      venueName: selectedTeam.venueName,
      leagueName: selectedTeam.leagueName,
      divisionName: selectedTeam.divisionName,
      record: `${selectedStanding.wins}-${selectedStanding.losses}`,
      winningPercentage: selectedStanding.winningPercentage,
      gamesBack: selectedStanding.gamesBack,
      divisionRank: selectedStanding.divisionRank,
      leagueRank: selectedStanding.leagueRank,
      overallRank: selectedStanding.overallRank,
      streak: selectedStanding.streak,
      battingAverage:
        hittingStats.avg !== undefined && hittingStats.avg !== null ? String(hittingStats.avg) : null,
      ops: hittingStats.ops !== undefined && hittingStats.ops !== null ? String(hittingStats.ops) : null,
      homeRuns: teamTotals.homeRuns,
      hits: teamTotals.hits,
      totalBases: teamTotals.totalBases,
      era:
        pitchingStats.era !== undefined && pitchingStats.era !== null
          ? String(pitchingStats.era)
          : null,
      strikeOuts: teamTotals.strikeOuts,
      whip:
        pitchingStats.whip !== undefined && pitchingStats.whip !== null
          ? String(pitchingStats.whip)
          : null,
    },
    history: {
      recentGames,
      previousSeries,
      currentSeries,
      recentForm,
    },
    standings: {
      general: generalStandings,
      league: leagueStandings,
      division: divisionStandings,
    },
    liveGame,
    odds,
    players,
  } satisfies TeamOverview;
}
