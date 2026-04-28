'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import styles from './Home.module.css';

type OddsFormat = 'american' | 'decimal';
type StandingScope = 'general' | 'league' | 'division';

type TeamOption = {
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

type StandingRow = {
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

type GameSummary = {
  id: number;
  date: string;
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

type SeriesSummary = {
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

type OddsRow = {
  teamName: string;
  abbreviation: string;
  logo: string | null;
  homeAway?: 'home' | 'away' | null;
  moneylineAmerican: number | null;
  runLine: number | null;
  runLinePriceAmerican: number | null;
  isSelected: boolean;
};

type OddsSnapshot = {
  source: string;
  commenceTime: string;
  totalLine: number | null;
  overOddsAmerican: number | null;
  underOddsAmerican: number | null;
  rows: OddsRow[];
};

type LiveGameSnapshot = {
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

type PlayerCard = {
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

type TeamOverview = {
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

type MatchFocusCard = {
  market: string;
  recommendation: string;
  price: string;
  note: string;
  confidenceLabel: string;
};

type MatchFocusOption = {
  key: string;
  title: string;
  subtitle: string;
  price: string;
  note: string;
  confidenceLabel: string;
  isBest: boolean;
};

type MatchFocusTeamRow = {
  key: string;
  teamName: string;
  abbreviation: string;
  sideLabel: string;
  isSelected: boolean;
  moneyline: string;
  spreadLabel: string;
  spreadPrice: string;
  totalLabel: string;
  totalPrice: string;
};

type MatchFocus = {
  matchupTitle: string;
  selectedTeamName: string;
  selectedTeamAbbreviation: string;
  opponentTeamName: string;
  opponentTeamAbbreviation: string;
  kickoffLabel: string;
  tags: string[];
  cards: MatchFocusCard[];
  teamRows: MatchFocusTeamRow[];
  allOptions: MatchFocusOption[];
  bestOptionTitle: string;
  bestOptionPrice: string;
  bestOptionConfidence: string;
  summary: string;
  opinion: string;
};

type UpcomingEventPreview = {
  id: string;
  commenceTime: string;
  homeTeam: string;
  awayTeam: string;
  source: string | null;
};

const standingsTabs: Array<{ key: StandingScope; label: string }> = [
  { key: 'general', label: 'General' },
  { key: 'league', label: 'Liga' },
  { key: 'division', label: 'Division' },
];

const normalizeTeamToken = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const MLB_MULTI_WORD_NICKNAMES = [
  'Blue Jays',
  'Red Sox',
  'White Sox',
  'Red Legs',
];

const getTeamQueryValue = (
  team: Pick<TeamOption, 'officialName' | 'displayName' | 'abbreviation'>
) =>
  normalizeTeamToken(team.officialName) ||
  normalizeTeamToken(team.displayName) ||
  normalizeTeamToken(team.abbreviation);

type TeamLookup = {
  id?: number | null;
  abbreviation?: string | null;
  officialName?: string | null;
  displayName?: string | null;
  teamName?: string | null;
  locationName?: string | null;
};

const findTeamOption = (teams: TeamOption[], lookup: TeamLookup) => {
  if (lookup.id !== null && lookup.id !== undefined) {
    const byId = teams.find((team) => team.id === lookup.id);
    if (byId) {
      return byId;
    }
  }

  const lookupTokens = [
    lookup.abbreviation,
    lookup.officialName,
    lookup.displayName,
    lookup.teamName,
    lookup.locationName,
  ]
    .filter((value): value is string => Boolean(value))
    .map(normalizeTeamToken)
    .filter(Boolean);

  if (lookupTokens.length === 0) {
    return null;
  }

  return (
    teams.find((team) => {
      const teamTokens = new Set([
        normalizeTeamToken(team.abbreviation),
        normalizeTeamToken(team.officialName),
        normalizeTeamToken(team.displayName),
        normalizeTeamToken(team.teamName),
        normalizeTeamToken(team.locationName),
        normalizeTeamToken(`${team.locationName} ${team.teamName}`),
      ]);

      return lookupTokens.some((token) => teamTokens.has(token));
    }) ?? null
  );
};

const findTeamOptionByQuery = (teams: TeamOption[], teamParam: string) => {
  const parsedId = Number.parseInt(teamParam, 10);

  return findTeamOption(teams, {
    id: Number.isFinite(parsedId) ? parsedId : null,
    abbreviation: teamParam,
    officialName: teamParam,
    displayName: teamParam,
    teamName: teamParam,
    locationName: teamParam,
  });
};

const americanToDecimal = (value: number | null) => {
  if (value === null || value === 0) {
    return null;
  }

  return value > 0 ? 1 + value / 100 : 1 + 100 / Math.abs(value);
};

const formatOddsValue = (value: number | null, oddsFormat: OddsFormat) => {
  if (value === null) {
    return '--';
  }

  if (oddsFormat === 'american') {
    return value > 0 ? `+${value}` : `${value}`;
  }

  const decimalValue = americanToDecimal(value);
  return decimalValue ? decimalValue.toFixed(2) : '--';
};

const formatSignedNumber = (value: number | null) => {
  if (value === null) {
    return '--';
  }

  return value > 0 ? `+${value.toFixed(1)}` : value.toFixed(1);
};

const formatShortDate = (dateString: string) =>
  new Intl.DateTimeFormat('es-MX', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(dateString));

const formatGameDate = (dateString: string) =>
  new Intl.DateTimeFormat('es-MX', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
const formatUpcomingGameDate = (dateString: string) =>
  new Intl.DateTimeFormat('es-MX', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));

const normalizeTeamLabel = (value: string | null | undefined) =>
  (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const matchesTeamLabel = (
  source: string | null | undefined,
  candidates: Array<string | null | undefined>
) => {
  const sourceToken = normalizeTeamLabel(source);

  if (!sourceToken) {
    return false;
  }

  return candidates.some((candidate) => {
    const candidateToken = normalizeTeamLabel(candidate);

    return (
      candidateToken.length > 0 &&
      (sourceToken === candidateToken ||
        sourceToken.endsWith(`-${candidateToken}`) ||
        candidateToken.endsWith(`-${sourceToken}`))
    );
  });
};

const formatLiveInning = (liveGame: LiveGameSnapshot) => {
  if (!liveGame.inning) {
    return liveGame.status;
  }

  const half =
    liveGame.inningHalf?.toLowerCase() === 'top'
      ? 'Alta'
      : liveGame.inningHalf?.toLowerCase() === 'bottom'
        ? 'Baja'
        : liveGame.inningHalf ?? 'Inning';

  return `${half} ${liveGame.inning}`;
};

const formatLiveCount = (liveGame: LiveGameSnapshot) =>
  liveGame.balls !== null && liveGame.strikes !== null
    ? `${liveGame.balls}-${liveGame.strikes}`
    : '--';

const formatLiveOuts = (liveGame: LiveGameSnapshot) =>
  liveGame.outs !== null ? `${liveGame.outs}` : '--';

const formatLiveBatterStatLine = (liveGame: LiveGameSnapshot) => {
  const stats = [
    liveGame.batterHits !== null && liveGame.batterAtBats !== null
      ? `H-AB ${liveGame.batterHits}-${liveGame.batterAtBats}`
      : null,
    liveGame.batterRbi !== null ? `RBI ${liveGame.batterRbi}` : null,
  ].filter((value): value is string => Boolean(value));

  return stats.join(' · ') || 'Sin turno registrado';
};

const formatLivePitcherStatLine = (liveGame: LiveGameSnapshot) => {
  const stats = [
    liveGame.pitcherInningsPitched ? `IP ${liveGame.pitcherInningsPitched}` : null,
    liveGame.pitcherStrikeouts !== null ? `K ${liveGame.pitcherStrikeouts}` : null,
    liveGame.pitcherPitchesThrown !== null ? `Pit ${liveGame.pitcherPitchesThrown}` : null,
  ].filter((value): value is string => Boolean(value));

  return stats.join(' · ') || 'Sin labor registrada';
};

const formatRunDiff = (value: number) => {
  if (value === 0) {
    return '0';
  }

  return value > 0 ? `+${value}` : `${value}`;
};

const getGameDifferential = (game: GameSummary) => {
  if (game.teamScore === null || game.opponentScore === null) {
    return 0;
  }

  return game.teamScore - game.opponentScore;
};

const getFormBarHeight = (game: GameSummary) => {
  const diff = Math.abs(getGameDifferential(game));
  return Math.max(16, Math.min(96, 16 + diff * 18));
};

const recentSeriesToneClasses = [
  styles.seriesTone1,
  styles.seriesTone2,
  styles.seriesTone3,
  styles.seriesTone4,
];

const getRecentGamesWithSeriesTone = (games: GameSummary[]) => {
  let activeSeriesKey = '';
  let activeSeriesIndex = -1;

  return games.map((game) => {
    const nextSeriesKey = `${game.opponentAbbreviation ?? game.opponentDisplayName}-${game.isHome ? 'H' : 'A'}`;

    if (nextSeriesKey !== activeSeriesKey) {
      activeSeriesKey = nextSeriesKey;
      activeSeriesIndex += 1;
    }

    return {
      ...game,
      seriesToneClass:
        recentSeriesToneClasses[activeSeriesIndex % recentSeriesToneClasses.length],
    };
  });
};

const americanToProbability = (value: number | null) => {
  if (value === null || value === 0) {
    return null;
  }

  return value > 0 ? 100 / (value + 100) : Math.abs(value) / (Math.abs(value) + 100);
};

const formatPercent = (value: number | null) => {
  if (value === null) {
    return '--';
  }

  return `${(value * 100).toFixed(1)}%`;
};

const parseRate = (value: string | null) => {
  if (!value) {
    return null;
  }

  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const average = (values: number[]) => {
  if (values.length === 0) {
    return null;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

const getRecentSample = (overview: TeamOverview) =>
  overview.history.recentGames.filter(
    (game) => game.teamScore !== null && game.opponentScore !== null
  );

const buildMatchFocus = (
  overview: TeamOverview | null,
  oddsFormat: OddsFormat
): MatchFocus | null => {
  if (!overview?.odds || overview.odds.rows.length < 2) {
    return null;
  }

  const selectedRow =
    overview.odds.rows.find((row) => row.isSelected) ?? overview.odds.rows[0] ?? null;
  const opponentRow =
    overview.odds.rows.find((row) => !row.isSelected) ?? overview.odds.rows[1] ?? null;

  if (!selectedRow || !opponentRow) {
    return null;
  }

  const recentSample = getRecentSample(overview);
  const sampleSize = recentSample.length;
  const recentWins = recentSample.filter((game) => game.result === 'W').length;
  const recentLosses = recentSample.filter((game) => game.result === 'L').length;
  const averageRunDiff = average(recentSample.map((game) => getGameDifferential(game))) ?? 0;
  const averageCombinedRuns =
    average(
      recentSample.map((game) => (game.teamScore ?? 0) + (game.opponentScore ?? 0))
    ) ?? 0;
  const totalLine = overview.odds.totalLine;
  const gamesAboveTotal =
    totalLine === null
      ? 0
      : recentSample.filter(
          (game) => (game.teamScore ?? 0) + (game.opponentScore ?? 0) > totalLine
        ).length;
  const overRate =
    totalLine === null || sampleSize === 0 ? null : gamesAboveTotal / sampleSize;

  const selectedMoneylineProbability = americanToProbability(selectedRow.moneylineAmerican);
  const opponentMoneylineProbability = americanToProbability(opponentRow.moneylineAmerican);
  const teamWinRate = parseRate(overview.team.winningPercentage);
  const opponentWinRate = teamWinRate !== null ? 1 - teamWinRate : null;
  const teamOps = parseRate(overview.team.ops);
  const teamEra = parseRate(overview.team.era);
  const underRate = overRate !== null ? 1 - overRate : null;

  type FocusBet = MatchFocusCard & {
    key: string;
    title: string;
    subtitle: string;
    score: number;
  };

  const getMoneylineConfidence = (edge: number) => {
    if (edge >= 0.035) {
      return 'Valor';
    }

    if (edge >= 0.01) {
      return 'Firme';
    }

    return 'Cobertura';
  };

  const getSpreadConfidence = (edge: number) => {
    if (edge >= 0.9) {
      return 'Fuerte';
    }

    if (edge >= 0.35) {
      return 'Balanceada';
    }

    return 'Ajustada';
  };

  const getTotalConfidence = (edge: number) => {
    if (edge >= 1) {
      return 'Ritmo';
    }

    if (edge >= 0.45) {
      return 'Leve';
    }

    return 'Mercado';
  };

  const selectedMoneylineEdge =
    selectedMoneylineProbability !== null && teamWinRate !== null
      ? teamWinRate - selectedMoneylineProbability
      : null;
  const opponentMoneylineEdge =
    opponentMoneylineProbability !== null && opponentWinRate !== null
      ? opponentWinRate - opponentMoneylineProbability
      : null;

  const moneylineBets: FocusBet[] = [
    {
      key: 'moneyline-selected',
      market: 'Gana',
      title: `Gana: ${selectedRow.teamName}`,
      subtitle: selectedRow.abbreviation,
      recommendation: selectedRow.teamName,
      price: formatOddsValue(selectedRow.moneylineAmerican, oddsFormat),
      note: `${overview.team.displayName} llega ${recentWins}-${recentLosses} en su muestra reciente y su win % (${formatPercent(teamWinRate)}) respalda esta cuota.`,
      confidenceLabel: getMoneylineConfidence(selectedMoneylineEdge ?? -0.03),
      score: (selectedMoneylineEdge ?? -0.03) * 100,
    },
    {
      key: 'moneyline-opponent',
      market: 'Gana',
      title: `Gana: ${opponentRow.teamName}`,
      subtitle: opponentRow.abbreviation,
      recommendation: opponentRow.teamName,
      price: formatOddsValue(opponentRow.moneylineAmerican, oddsFormat),
      note: `El mercado pide demasiado de ${overview.team.displayName}, así que el moneyline rival gana valor si buscas el otro lado del juego.`,
      confidenceLabel: getMoneylineConfidence(opponentMoneylineEdge ?? -0.03),
      score: (opponentMoneylineEdge ?? -0.03) * 100,
    },
  ];

  const selectedSpreadEdge =
    selectedRow.runLine !== null ? averageRunDiff + selectedRow.runLine : Number.NEGATIVE_INFINITY;
  const opponentSpreadEdge =
    opponentRow.runLine !== null ? -averageRunDiff + opponentRow.runLine : Number.NEGATIVE_INFINITY;
  const spreadBets: FocusBet[] = [
    {
      key: 'spread-selected',
      market: 'Run line',
      title: `Spread: ${selectedRow.abbreviation} ${formatSignedNumber(selectedRow.runLine)}`,
      subtitle: selectedRow.abbreviation,
      recommendation: `${selectedRow.abbreviation} ${formatSignedNumber(selectedRow.runLine)}`,
      price: formatOddsValue(selectedRow.runLinePriceAmerican, oddsFormat),
      note: `El diferencial reciente del equipo (${averageRunDiff >= 0 ? '+' : ''}${averageRunDiff.toFixed(1)}) sostiene mejor esta línea si sigues a ${overview.team.displayName}.`,
      confidenceLabel: getSpreadConfidence(
        Number.isFinite(selectedSpreadEdge) ? selectedSpreadEdge : -0.4
      ),
      score: Number.isFinite(selectedSpreadEdge) ? selectedSpreadEdge * 16 : -6,
    },
    {
      key: 'spread-opponent',
      market: 'Run line',
      title: `Spread: ${opponentRow.abbreviation} ${formatSignedNumber(opponentRow.runLine)}`,
      subtitle: opponentRow.abbreviation,
      recommendation: `${opponentRow.abbreviation} ${formatSignedNumber(opponentRow.runLine)}`,
      price: formatOddsValue(opponentRow.runLinePriceAmerican, oddsFormat),
      note: `El margen reciente de ${overview.team.displayName} deja más colchón del lado rival para esta línea.`,
      confidenceLabel: getSpreadConfidence(
        Number.isFinite(opponentSpreadEdge) ? opponentSpreadEdge : -0.4
      ),
      score: Number.isFinite(opponentSpreadEdge) ? opponentSpreadEdge * 16 : -6,
    },
  ];

  const shouldPlayOver =
    totalLine !== null &&
    (averageCombinedRuns >= totalLine + 0.45 ||
      ((overRate ?? 0) >= 0.6 && (teamOps ?? 0) >= 0.74));
  const shouldPlayUnder =
    totalLine !== null &&
    (averageCombinedRuns <= totalLine - 0.45 ||
      ((overRate ?? 1) <= 0.4 && teamEra !== null && teamEra <= 3.9));
  const overEdge =
    totalLine === null ? Number.NEGATIVE_INFINITY : averageCombinedRuns - totalLine;
  const underEdge =
    totalLine === null ? Number.NEGATIVE_INFINITY : totalLine - averageCombinedRuns;
  const totalBets: FocusBet[] = [
    {
      key: 'total-over',
      market: 'Total',
      title: totalLine === null ? 'Total: Sin línea' : `Total: Over ${totalLine.toFixed(1)}`,
      subtitle: totalLine === null ? '--' : `O ${totalLine.toFixed(1)}`,
      recommendation: totalLine === null ? 'Sin línea' : `Over ${totalLine.toFixed(1)}`,
      price: formatOddsValue(overview.odds.overOddsAmerican, oddsFormat),
      note:
        totalLine === null
          ? 'Sin línea total disponible.'
          : `${sampleSize > 0 ? `${sampleSize} juegos recientes` : 'Muestra limitada'} con ${averageCombinedRuns.toFixed(1)} carreras combinadas por juego frente a una línea de ${totalLine.toFixed(1)}. El over gana fuerza cuando el ritmo reciente supera esa cifra.`,
      confidenceLabel: getTotalConfidence(
        Number.isFinite(overEdge) ? overEdge : -0.3
      ),
      score:
        Number.isFinite(overEdge)
          ? overEdge * 12 + ((overRate ?? 0.5) - 0.5) * 10 + (shouldPlayOver ? 3 : 0)
          : -6,
    },
    {
      key: 'total-under',
      market: 'Total',
      title: totalLine === null ? 'Total: Sin línea' : `Total: Under ${totalLine.toFixed(1)}`,
      subtitle: totalLine === null ? '--' : `U ${totalLine.toFixed(1)}`,
      recommendation: totalLine === null ? 'Sin línea' : `Under ${totalLine.toFixed(1)}`,
      price: formatOddsValue(overview.odds.underOddsAmerican, oddsFormat),
      note:
        totalLine === null
          ? 'Sin línea total disponible.'
          : `${sampleSize > 0 ? `${sampleSize} juegos recientes` : 'Muestra limitada'} con ${averageCombinedRuns.toFixed(1)} carreras combinadas por juego frente a una línea de ${totalLine.toFixed(1)}. El under toma valor cuando el ritmo queda por debajo de esa cifra.`,
      confidenceLabel: getTotalConfidence(
        Number.isFinite(underEdge) ? underEdge : -0.3
      ),
      score:
        Number.isFinite(underEdge)
          ? underEdge * 12 + ((underRate ?? 0.5) - 0.5) * 10 + (shouldPlayUnder ? 3 : 0)
          : -6,
    },
  ];

  const moneylinePick = [...moneylineBets].sort((left, right) => right.score - left.score)[0];
  const spreadPick = [...spreadBets].sort((left, right) => right.score - left.score)[0];
  const totalPick = [...totalBets].sort((left, right) => right.score - left.score)[0];

  const cards: MatchFocusCard[] = [
    {
      market: 'Gana',
      recommendation: moneylinePick.recommendation,
      price: moneylinePick.price,
      note: moneylinePick.note,
      confidenceLabel: moneylinePick.confidenceLabel,
    },
    {
      market: 'Run line',
      recommendation: spreadPick.recommendation,
      price: spreadPick.price,
      note: spreadPick.note,
      confidenceLabel: spreadPick.confidenceLabel,
    },
    {
      market: 'Total',
      recommendation: totalPick.recommendation,
      price: totalPick.price,
      note: totalPick.note,
      confidenceLabel: totalPick.confidenceLabel,
    },
  ];

  const allBets = [...moneylineBets, ...spreadBets, ...totalBets];
  const bestBet = [...allBets].sort((left, right) => right.score - left.score)[0];
  const orderedRows = overview.odds.rows;
  const awayRow = orderedRows.find((row) => row.homeAway === 'away') ?? orderedRows[0];
  const homeRow = orderedRows.find((row) => row.homeAway === 'home') ?? orderedRows[1] ?? orderedRows[0];

  return {
    matchupTitle: `${selectedRow.teamName} vs ${opponentRow.teamName}`,
    selectedTeamName: selectedRow.teamName,
    selectedTeamAbbreviation: selectedRow.abbreviation,
    opponentTeamName: opponentRow.teamName,
    opponentTeamAbbreviation: opponentRow.abbreviation,
    kickoffLabel: `${formatGameDate(overview.odds.commenceTime)} · ${overview.odds.source}`,
    tags: [
      overview.liveGame ? 'Juego en vivo' : 'Previo al primer pitch',
      `Moneyline ${selectedRow.abbreviation} ${formatPercent(selectedMoneylineProbability)}`,
      `Forma ${recentWins}-${recentLosses}`,
      totalLine !== null ? `Total ${totalLine.toFixed(1)}` : 'Total --',
      sampleSize > 0 ? `Prom. ${averageCombinedRuns.toFixed(1)} carreras` : 'Muestra corta',
    ],
    cards,
    teamRows: [
      {
        key: 'away',
        teamName: awayRow.teamName,
        abbreviation: awayRow.abbreviation,
        sideLabel: 'Visitante',
        isSelected: awayRow.isSelected,
        moneyline: formatOddsValue(awayRow.moneylineAmerican, oddsFormat),
        spreadLabel: `${awayRow.abbreviation} ${formatSignedNumber(awayRow.runLine)}`,
        spreadPrice: formatOddsValue(awayRow.runLinePriceAmerican, oddsFormat),
        totalLabel: totalLine === null ? '--' : `↑ ${totalLine.toFixed(1)}`,
        totalPrice: formatOddsValue(overview.odds.overOddsAmerican, oddsFormat),
      },
      {
        key: 'home',
        teamName: homeRow.teamName,
        abbreviation: homeRow.abbreviation,
        sideLabel: 'Local',
        isSelected: homeRow.isSelected,
        moneyline: formatOddsValue(homeRow.moneylineAmerican, oddsFormat),
        spreadLabel: `${homeRow.abbreviation} ${formatSignedNumber(homeRow.runLine)}`,
        spreadPrice: formatOddsValue(homeRow.runLinePriceAmerican, oddsFormat),
        totalLabel: totalLine === null ? '--' : `↓ ${totalLine.toFixed(1)}`,
        totalPrice: formatOddsValue(overview.odds.underOddsAmerican, oddsFormat),
      },
    ],
    allOptions: allBets.map((bet) => ({
      key: bet.key,
      title: bet.title,
      subtitle: bet.subtitle,
      price: bet.price,
      note: bet.note,
      confidenceLabel: bet.confidenceLabel,
      isBest: bet.key === bestBet.key,
    })),
    bestOptionTitle: bestBet.title,
    bestOptionPrice: bestBet.price,
    bestOptionConfidence: bestBet.confidenceLabel,
    summary: `${overview.team.displayName} llega con record ${overview.team.record}, racha ${overview.team.streak} y un diferencial reciente de ${averageRunDiff >= 0 ? '+' : ''}${averageRunDiff.toFixed(1)} carreras. El mercado abre con ${selectedRow.teamName} ${formatOddsValue(selectedRow.moneylineAmerican, oddsFormat)} en moneyline y una lectura total de ${totalLine?.toFixed(1) ?? '--'} carreras para el juego.`,
    opinion: `comparando los seis momios disponibles entre ambos equipos y el total del juego, la lectura mas estable hoy es ${bestBet.market.toLowerCase()} ${bestBet.recommendation} (${bestBet.price}), porque ${bestBet.note.charAt(0).toLowerCase()}${bestBet.note.slice(1)}`,
  };
};

function HomeContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const teamParam = searchParams.get('team');
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [draftTeamId, setDraftTeamId] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [oddsFormat, setOddsFormat] = useState<OddsFormat>('decimal');
  const [standingScope, setStandingScope] = useState<StandingScope>('division');
  const [overview, setOverview] = useState<TeamOverview | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEventPreview[]>([]);
  const [selectedPlayerKey, setSelectedPlayerKey] = useState<string | null>(null);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [upcomingEventsLoading, setUpcomingEventsLoading] = useState(true);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selectedTeamIdRef = useRef<number | null>(null);
  const overviewRequestRef = useRef(0);

  const refreshOverview = useCallback(
    async (teamId: number, isBackgroundRefresh: boolean) => {
      const requestId = overviewRequestRef.current + 1;
      overviewRequestRef.current = requestId;

      try {
        if (!isBackgroundRefresh) {
          setOverviewLoading(true);
        }

        setError(null);

        const response = await fetch(`/api/team-overview/${teamId}`, {
          cache: 'no-store',
        });

        if (!response.ok) {
          const data = (await response.json()) as { error?: string };
          throw new Error(data.error ?? 'No pude cargar el tablero del equipo.');
        }

        const data = (await response.json()) as TeamOverview;
        if (
          overviewRequestRef.current !== requestId ||
          selectedTeamIdRef.current !== teamId
        ) {
          return;
        }

        setOverview(data);
        setSelectedPlayerKey((currentKey) =>
          data.players.some((player) => player.entryKey === currentKey)
            ? currentKey
            : data.players[0]?.entryKey ?? null
        );
      } catch (requestError) {
        if (
          overviewRequestRef.current !== requestId ||
          selectedTeamIdRef.current !== teamId
        ) {
          return;
        }

        setError(
          requestError instanceof Error
            ? requestError.message
            : 'No pude cargar el tablero del equipo.'
        );
      } finally {
        if (
          !isBackgroundRefresh &&
          overviewRequestRef.current === requestId &&
          selectedTeamIdRef.current === teamId
        ) {
          setOverviewLoading(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    selectedTeamIdRef.current = selectedTeamId;
  }, [selectedTeamId]);

  useEffect(() => {
    let cancelled = false;

    const loadTeams = async () => {
      try {
        setTeamsLoading(true);
        setError(null);

        const response = await fetch('/api/teams', { cache: 'no-store' });
        if (!response.ok) {
          throw new Error('No pude cargar el catalogo de equipos MLB.');
        }

        const data = (await response.json()) as TeamOption[];
        if (cancelled) {
          return;
        }

        setTeams(data);
      } catch (requestError) {
        if (!cancelled) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : 'No pude cargar el catalogo de equipos MLB.'
          );
        }
      } finally {
        if (!cancelled) {
          setTeamsLoading(false);
        }
      }
    };

    loadTeams();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadUpcomingEvents = async () => {
      try {
        setUpcomingEventsLoading(true);

        const response = await fetch('/api/events', { cache: 'no-store' });
        if (!response.ok) {
          throw new Error('No pude cargar los proximos juegos MLB.');
        }

        const data = (await response.json()) as Array<{
          id: string;
          commence_time: string;
          home_team: string;
          away_team: string;
          source?: string;
        }>;

        if (cancelled || !Array.isArray(data)) {
          return;
        }

        const upcoming = data
          .filter((event) => event.commence_time && event.home_team && event.away_team)
          .sort(
            (left, right) =>
              new Date(left.commence_time).getTime() - new Date(right.commence_time).getTime()
          )
          .slice(0, 4)
          .map((event) => ({
            id: event.id,
            commenceTime: event.commence_time,
            homeTeam: event.home_team,
            awayTeam: event.away_team,
            source: event.source ?? null,
          }));

        setUpcomingEvents(upcoming);
      } catch {
        if (!cancelled) {
          setUpcomingEvents([]);
        }
      } finally {
        if (!cancelled) {
          setUpcomingEventsLoading(false);
        }
      }
    };

    void loadUpcomingEvents();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (teams.length === 0) {
      return;
    }

    if (!teamParam) {
      setDraftTeamId('');
      setSelectedTeamId(null);
      return;
    }

    const matchedTeam = findTeamOptionByQuery(teams, teamParam);
    if (!matchedTeam) {
      setDraftTeamId('');
      setSelectedTeamId(null);
      return;
    }

    setDraftTeamId((currentValue) =>
      currentValue === String(matchedTeam.id) ? currentValue : String(matchedTeam.id)
    );
    setSelectedTeamId((currentValue) =>
      currentValue === matchedTeam.id ? currentValue : matchedTeam.id
    );
  }, [teamParam, teams]);

  useEffect(() => {
    if (!selectedTeamId) {
      overviewRequestRef.current += 1;
      setOverview(null);
      setSelectedPlayerKey(null);
      return;
    }

    void refreshOverview(selectedTeamId, false);

    return () => {
      overviewRequestRef.current += 1;
    };
  }, [refreshOverview, selectedTeamId]);

  useEffect(() => {
    if (!selectedTeamId) {
      return;
    }

    const refreshInterval = overview?.liveGame ? 15_000 : 300_000;
    const timerId = window.setInterval(() => {
      void refreshOverview(selectedTeamId, true);
    }, refreshInterval);

    return () => {
      window.clearInterval(timerId);
    };
  }, [overview?.liveGame, refreshOverview, selectedTeamId]);

  const orderedTeams = [...teams].sort((left, right) =>
    left.displayName.localeCompare(right.displayName, 'es')
  );
  const teamNicknameByAbbreviation = new Map(
    teams.map((team) => [team.abbreviation, team.teamName])
  );

  const standingRows = overview ? overview.standings[standingScope] : [];
  const selectedPlayer =
    overview?.players.find((player) => player.entryKey === selectedPlayerKey) ??
    overview?.players[0] ??
    null;
  const recentGamesWithSeriesTone = overview
    ? getRecentGamesWithSeriesTone(overview.history.recentGames)
    : [];
  const matchFocus = buildMatchFocus(overview, oddsFormat);
  const activeTeam = overview
    ? findTeamOption(teams, {
        id: overview.team.id,
        abbreviation: overview.team.abbreviation,
        displayName: overview.team.displayName,
      })
    : null;
  const liveOpponentTeam = overview?.liveGame
    ? findTeamOption(teams, {
        abbreviation: overview.liveGame.opponentAbbreviation,
        displayName: overview.liveGame.opponentDisplayName,
      })
    : null;
  const matchFocusSelectedTeam = matchFocus
    ? findTeamOption(teams, {
        abbreviation: matchFocus.selectedTeamAbbreviation,
        teamName: matchFocus.selectedTeamName,
      })
    : null;
  const matchFocusOpponentTeam = matchFocus
    ? findTeamOption(teams, {
        abbreviation: matchFocus.opponentTeamAbbreviation,
        teamName: matchFocus.opponentTeamName,
      })
    : null;
  const currentSeriesGameLabel = overview?.history.currentSeries?.currentGameNumber
    ? `Juego ${overview.history.currentSeries.currentGameNumber}`
    : null;
  const liveScoreRows = overview?.liveGame
    ? overview.liveGame.isHome
      ? [
          {
            key: 'away',
            team: liveOpponentTeam,
            displayName: overview.liveGame.opponentDisplayName,
            abbreviation: overview.liveGame.opponentAbbreviation ?? 'MLB',
            logo: overview.liveGame.opponentLogo,
            score: overview.liveGame.opponentScore,
            isSelected: false,
          },
          {
            key: 'home',
            team: activeTeam,
            displayName: overview.team.displayName,
            abbreviation: overview.team.abbreviation,
            logo: overview.team.logo,
            score: overview.liveGame.teamScore,
            isSelected: true,
          },
        ]
      : [
          {
            key: 'away',
            team: activeTeam,
            displayName: overview.team.displayName,
            abbreviation: overview.team.abbreviation,
            logo: overview.team.logo,
            score: overview.liveGame.teamScore,
            isSelected: true,
          },
          {
            key: 'home',
            team: liveOpponentTeam,
            displayName: overview.liveGame.opponentDisplayName,
            abbreviation: overview.liveGame.opponentAbbreviation ?? 'MLB',
            logo: overview.liveGame.opponentLogo,
            score: overview.liveGame.opponentScore,
            isSelected: false,
          },
        ]
    : [];
  const liveInningRows = overview?.liveGame
    ? overview.liveGame.inningLines.map((line) => ({
        inning: line.inning,
        awayRuns: line.awayRuns,
        homeRuns: line.homeRuns,
      }))
    : [];
  const upcomingMatchups = upcomingEvents.map((event) => ({
    ...event,
    awayTeamOption: findTeamOption(teams, {
      officialName: event.awayTeam,
      displayName: event.awayTeam,
      teamName: event.awayTeam,
    }),
    homeTeamOption: findTeamOption(teams, {
      officialName: event.homeTeam,
      displayName: event.homeTeam,
      teamName: event.homeTeam,
    }),
  }));

  const heroCallout = overview?.liveGame
    ? {
        eyebrow: 'Marcador en vivo',
        title: `${liveScoreRows[0]?.displayName ?? overview.liveGame.opponentDisplayName} vs ${liveScoreRows[1]?.displayName ?? overview.team.displayName}`,
        copy: `${formatLiveInning(overview.liveGame)}${overview.liveGame.venueName ? ` · ${overview.liveGame.venueName}` : ''}. Score actual ${liveScoreRows[0]?.score ?? '--'}-${liveScoreRows[1]?.score ?? '--'} con conteo ${overview.liveGame.balls ?? 0}-${overview.liveGame.strikes ?? 0} y ${overview.liveGame.outs ?? 0} outs.`,
      }
    : matchFocus
      ? {
          eyebrow: 'Lectura rapida',
          title: `Listo para analizar ${matchFocus.matchupTitle}`,
          copy: `${matchFocus.summary} Opinion IA: ${matchFocus.opinion}`,
        }
      : {
          eyebrow: 'Lectura rapida',
          title: 'Listo para analizar la jornada MLB',
          copy:
            'Selecciona un equipo para ver momios, clasificacion contextual, historial reciente, marcador en vivo y jugadores clave desde una sola vista.',
        };

  const heroMetrics = overview?.liveGame
    ? [
        {
          label: liveScoreRows[0]?.abbreviation ?? 'VIS',
          value:
            liveScoreRows[0]?.score === null || liveScoreRows[0]?.score === undefined
              ? '--'
              : String(liveScoreRows[0]?.score),
        },
        {
          label: liveScoreRows[1]?.abbreviation ?? 'LOC',
          value:
            liveScoreRows[1]?.score === null || liveScoreRows[1]?.score === undefined
              ? '--'
              : String(liveScoreRows[1]?.score),
        },
        {
          label: 'Estado',
          value: formatLiveInning(overview.liveGame),
        },
      ]
    : overview
      ? [
          { label: 'Record', value: overview.team.record },
          { label: 'Division', value: overview.team.divisionRank },
          { label: 'Racha', value: overview.team.streak },
        ]
      : [];

  const getUpcomingTeamLabel = (
    teamOption: TeamOption | null,
    fallbackName: string
  ) => {
    if (teamOption?.teamName) {
      return teamOption.teamName;
    }

    const resolvedTeam = findTeamOption(teams, {
      officialName: fallbackName,
      displayName: fallbackName,
      teamName: fallbackName,
    });

    if (resolvedTeam?.teamName) {
      return resolvedTeam.teamName;
    }

    const multiWordNickname = MLB_MULTI_WORD_NICKNAMES.find((nickname) =>
      fallbackName.endsWith(nickname)
    );

    if (multiWordNickname) {
      return multiWordNickname;
    }

    const trimmedName = fallbackName.trim();
    const nameParts = trimmedName.split(/\s+/);

    return nameParts.at(-1) ?? trimmedName;
  };

  const getTeamHref = (
    team: Pick<TeamOption, 'officialName' | 'displayName' | 'abbreviation'>
  ) => {
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set('team', getTeamQueryValue(team));
    const query = nextParams.toString();

    return query ? `${pathname}?${query}` : pathname;
  };

  const handleTeamLinkClick = (teamId: number) => {
    setDraftTeamId(String(teamId));
    setSelectedTeamId(teamId);
  };
  const selectedTeamOption = overview
    ? teams.find((team) => team.abbreviation === overview.team.abbreviation) ?? null
    : null;
  const opponentTeamOption =
    overview?.liveGame?.opponentAbbreviation
      ? teams.find((team) => team.abbreviation === overview.liveGame?.opponentAbbreviation) ??
        null
      : null;
  const offenseIsSelectedTeam = overview?.liveGame
    ? matchesTeamLabel(overview.liveGame.offenseTeamName, [
        overview.team.displayName,
        selectedTeamOption?.displayName,
        selectedTeamOption?.teamName,
        overview.team.abbreviation,
      ])
    : false;
  const offenseIsOpponentTeam = overview?.liveGame
    ? matchesTeamLabel(overview.liveGame.offenseTeamName, [
        overview.liveGame.opponentDisplayName,
        opponentTeamOption?.displayName,
        opponentTeamOption?.teamName,
        overview.liveGame.opponentAbbreviation,
      ])
    : false;
  const batterTeamLogo = offenseIsOpponentTeam
    ? overview?.liveGame?.opponentLogo ?? opponentTeamOption?.logo ?? null
    : offenseIsSelectedTeam
      ? overview?.team.logo ?? selectedTeamOption?.logo ?? null
      : null;
  const pitcherTeamLogo = offenseIsOpponentTeam
    ? overview?.team.logo ?? selectedTeamOption?.logo ?? null
    : offenseIsSelectedTeam
      ? overview?.liveGame?.opponentLogo ?? opponentTeamOption?.logo ?? null
      : null;

  const handleTeamSubmit = () => {
    if (!draftTeamId) {
      return;
    }

    const nextTeam = findTeamOption(teams, { id: Number.parseInt(draftTeamId, 10) });
    if (!nextTeam) {
      return;
    }

    setSelectedTeamId(nextTeam.id);
    router.replace(getTeamHref(nextTeam), { scroll: false });
  };

  // ── MLB team colors lookup ──
  const getTeamColors = (abbreviation: string | null | undefined) => {
    if (!abbreviation) return { primary: '#003087', secondary: '#C4CED4', accent: '#ffffff', primaryRgb: '0,48,135' };
    const map: Record<string, { primary: string; secondary: string; accent: string; primaryRgb: string }> = {
      ARI: { primary: '#A71930', secondary: '#E3D4AD', accent: '#000000', primaryRgb: '167,25,48' },
      ATL: { primary: '#CE1141', secondary: '#13274F', accent: '#EAAA00', primaryRgb: '206,17,65' },
      BAL: { primary: '#DF4601', secondary: '#000000', accent: '#ffffff', primaryRgb: '223,70,1' },
      BOS: { primary: '#BD3039', secondary: '#0D2B56', accent: '#BD3039', primaryRgb: '189,48,57' },
      CHC: { primary: '#0E3386', secondary: '#CC3433', accent: '#ffffff', primaryRgb: '14,51,134' },
      CWS: { primary: '#27251F', secondary: '#C4CED4', accent: '#ffffff', primaryRgb: '39,37,31' },
      CIN: { primary: '#C6011F', secondary: '#000000', accent: '#ffffff', primaryRgb: '198,1,31' },
      CLE: { primary: '#00385D', secondary: '#E31937', accent: '#ffffff', primaryRgb: '0,56,93' },
      COL: { primary: '#33006F', secondary: '#C4CED4', accent: '#ffffff', primaryRgb: '51,0,111' },
      DET: { primary: '#0C2340', secondary: '#FA4616', accent: '#ffffff', primaryRgb: '12,35,64' },
      HOU: { primary: '#002D62', secondary: '#EB6E1F', accent: '#F4911E', primaryRgb: '0,45,98' },
      KC:  { primary: '#004687', secondary: '#C09A5B', accent: '#ffffff', primaryRgb: '0,70,135' },
      LAA: { primary: '#BA0021', secondary: '#003263', accent: '#862633', primaryRgb: '186,0,33' },
      LAD: { primary: '#005A9C', secondary: '#EF3E42', accent: '#ffffff', primaryRgb: '0,90,156' },
      MIA: { primary: '#00A3E0', secondary: '#EF3340', accent: '#FFD100', primaryRgb: '0,163,224' },
      MIL: { primary: '#12284B', secondary: '#FFC52F', accent: '#FFC52F', primaryRgb: '18,40,75' },
      MIN: { primary: '#002B5C', secondary: '#D31145', accent: '#B9975B', primaryRgb: '0,43,92' },
      NYM: { primary: '#002D72', secondary: '#FF5910', accent: '#ffffff', primaryRgb: '0,45,114' },
      NYY: { primary: '#003087', secondary: '#003087', accent: '#C4CED4', primaryRgb: '0,48,135' },
      OAK: { primary: '#003831', secondary: '#EFB21E', accent: '#EFB21E', primaryRgb: '0,56,49' },
      PHI: { primary: '#E81828', secondary: '#002D72', accent: '#ffffff', primaryRgb: '232,24,40' },
      PIT: { primary: '#27251F', secondary: '#FDB827', accent: '#FDB827', primaryRgb: '39,37,31' },
      SD:  { primary: '#2F241D', secondary: '#FFC425', accent: '#FFC425', primaryRgb: '47,36,29' },
      SF:  { primary: '#FD5A1E', secondary: '#27251F', accent: '#EFD19F', primaryRgb: '253,90,30' },
      SEA: { primary: '#0C2C56', secondary: '#005C5C', accent: '#C4CED4', primaryRgb: '12,44,86' },
      STL: { primary: '#C41E3A', secondary: '#0C2340', accent: '#FEDB00', primaryRgb: '196,30,58' },
      TB:  { primary: '#092C5C', secondary: '#8FBCE6', accent: '#F5D130', primaryRgb: '9,44,92' },
      TEX: { primary: '#003278', secondary: '#C0111F', accent: '#ffffff', primaryRgb: '0,50,120' },
      TOR: { primary: '#134A8E', secondary: '#1D2D5C', accent: '#E8291C', primaryRgb: '19,74,142' },
      WSH: { primary: '#AB0003', secondary: '#14225A', accent: '#ffffff', primaryRgb: '171,0,3' },
    };
    return map[abbreviation] ?? { primary: '#003087', secondary: '#C4CED4', accent: '#ffffff', primaryRgb: '0,48,135' };
  };

  const teamColors = getTeamColors(overview?.team.abbreviation);
  const teamStyle = {
    '--team-primary': teamColors.primary,
    '--team-secondary': teamColors.secondary,
    '--team-accent': teamColors.accent,
    '--team-primary-rgb': teamColors.primaryRgb,
  } as React.CSSProperties;

  // ── Division grouping for sidebar ──
  const divisionOrder = ['AL East', 'AL Central', 'AL West', 'NL East', 'NL Central', 'NL West'];
  const teamsByDivision = divisionOrder.reduce<Record<string, TeamOption[]>>((acc, div) => {
    acc[div] = orderedTeams.filter((t) => `${t.leagueName} ${t.divisionName}`.includes(div.split(' ').slice(1).join(' ')) && t.leagueName.startsWith(div.split(' ')[0]));
    return acc;
  }, {});

  return (
    <main className={styles.page} style={teamStyle}>
      <div className={styles.shell}>

        {/* ── Navbar ── */}
        <nav className={styles.navbar}>
          <Link href="/" className={styles.navBrand}>
            <span className={styles.navBrandDot} />
            MLB Valles
          </Link>
          {overview ? (
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.82rem', fontWeight: 600 }}>
              {overview.team.displayName} · {overview.team.record}
            </span>
          ) : null}
          <div className={styles.navSpacer} />
          <div className={styles.navOddsToggle}>
            <button
              type="button"
              className={`${styles.navToggleBtn} ${oddsFormat === 'decimal' ? styles.navToggleBtnActive : ''}`}
              onClick={() => setOddsFormat('decimal')}
            >
              Decimal
            </button>
            <button
              type="button"
              className={`${styles.navToggleBtn} ${oddsFormat === 'american' ? styles.navToggleBtnActive : ''}`}
              onClick={() => setOddsFormat('american')}
            >
              Americano
            </button>
          </div>
        </nav>

        {/* ── Left Sidebar ── */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <span className={styles.sidebarLabel}>Selecciona un equipo</span>
            <select
              id="team-select"
              className={styles.sidebarSelect}
              value={draftTeamId}
              onChange={(e) => setDraftTeamId(e.target.value)}
              disabled={teamsLoading}
            >
              <option value="" disabled>Equipo...</option>
              {orderedTeams.map((team) => (
                <option key={team.id} value={team.id}>{team.displayName}</option>
              ))}
            </select>
            <button
              type="button"
              className={styles.sidebarSubmit}
              onClick={handleTeamSubmit}
              disabled={teamsLoading || !draftTeamId}
            >
              Ver tablero
            </button>
          </div>

          <div className={styles.teamList}>
            {orderedTeams.map((team) => (
              <Link
                key={team.id}
                href={getTeamHref(team)}
                replace
                scroll={false}
                className={`${styles.teamListItem} ${overview?.team.id === team.id ? styles.teamListItemActive : ''}`}
                onClick={() => handleTeamLinkClick(team.id)}
              >
                <Image
                  className={styles.teamListLogo}
                  src={team.logo}
                  alt={team.displayName}
                  width={22}
                  height={22}
                  unoptimized
                />
                {team.teamName}
              </Link>
            ))}
          </div>
        </aside>

        {/* ── Main Content ── */}
        <div className={styles.main}>

          {error ? (
            <section className={styles.errorCard}>
              <strong>Hubo un problema cargando la app.</strong>
              <p>{error}</p>
            </section>
          ) : null}

          {overviewLoading && !overview ? (
            <section className={styles.loadingCard}>
              <div className={styles.loadingPulse} />
              <strong>Cargando tablero MLB...</strong>
              <p>Estoy armando el perfil del equipo, standings, momios y lideres.</p>
            </section>
          ) : null}

          {!overview && !overviewLoading && !error ? (
            <div className={styles.welcomeCard}>
              <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>⚾</div>
              <h2 className={styles.welcomeTitle}>Bienvenido a MLB Valles</h2>
              <p className={styles.welcomeText}>
                Selecciona un equipo del panel izquierdo para ver momios, clasificación,
                historial reciente, marcador en vivo y jugadores clave desde una sola vista.
              </p>
            </div>
          ) : null}

          {overview ? (
            <>
              {/* Team Hero Banner */}
              <div className={styles.teamHeroBanner}>
                <Image
                  className={styles.teamHeroLogo}
                  src={overview.team.logo}
                  alt={overview.team.displayName}
                  width={76}
                  height={76}
                  unoptimized
                />
                <div className={styles.teamHeroInfo}>
                  <h1 className={styles.teamHeroName}>{overview.team.displayName}</h1>
                  <p className={styles.teamHeroSub}>
                    {overview.team.venueName ?? 'Estadio pendiente'} · {overview.team.leagueName} · {overview.team.divisionName}
                  </p>
                  <div className={styles.teamHeroStats}>
                    <div className={styles.teamHeroStat}>
                      <span className={styles.teamHeroStatLabel}>División</span>
                      <span className={styles.teamHeroStatValue}>#{overview.team.divisionRank}</span>
                    </div>
                    <div className={styles.teamHeroStat}>
                      <span className={styles.teamHeroStatLabel}>Liga</span>
                      <span className={styles.teamHeroStatValue}>#{overview.team.leagueRank}</span>
                    </div>
                    <div className={styles.teamHeroStat}>
                      <span className={styles.teamHeroStatLabel}>MLB</span>
                      <span className={styles.teamHeroStatValue}>#{overview.team.overallRank}</span>
                    </div>
                    <div className={styles.teamHeroStat}>
                      <span className={styles.teamHeroStatLabel}>Racha</span>
                      <span className={styles.teamHeroStatValue}>{overview.team.streak}</span>
                    </div>
                    <div className={styles.teamHeroStat}>
                      <span className={styles.teamHeroStatLabel}>GB</span>
                      <span className={styles.teamHeroStatValue}>{overview.team.gamesBack}</span>
                    </div>
                    {overview.liveGame ? (
                      <div className={styles.teamHeroStat}>
                        <span className={styles.teamHeroStatLabel}>🔴 Juego en vivo</span>
                        <span className={styles.teamHeroStatValue}>{formatLiveInning(overview.liveGame)}</span>
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className={styles.teamHeroBadge}>
                  <span className={styles.teamHeroBadgeRecord}>{overview.team.record}</span>
                  <span className={styles.teamHeroBadgeLabel}>G-P</span>
                </div>
              </div>

              {/* Odds / Live Game Card */}
              <article className={styles.oddsCard}>
                <div className={styles.cardAccent} />
                <div className={styles.cardHeader}>
                  <div className={styles.cardHeaderLead}>
                    <span className={styles.cardKicker}>
                      {overview.liveGame ? 'Marcador actual' : 'Momio por juego'}
                    </span>
                    {currentSeriesGameLabel ? (
                      <span className={styles.seriesGameSticker}>{currentSeriesGameLabel}</span>
                    ) : null}
                  </div>
                  <span className={`${styles.cardHint} ${overview.liveGame ? styles.liveLabel : ''}`}>
                    {overview.liveGame
                      ? `LIVE · ${overview.liveGame.status}`
                      : overview.odds
                        ? `Fuente ${overview.odds.source}`
                        : 'Sin cuota disponible'}
                  </span>
                </div>

                {overview.liveGame ? (
                  <div className={styles.liveGamePanel}>
                    <div className={styles.liveGameMeta}>
                      <strong>{overview.team.displayName}</strong>
                      <span>{overview.liveGame.isHome ? 'Local' : 'Visitante'} · {overview.liveGame.venueName ?? overview.liveGame.status}</span>
                    </div>
                    <div className={styles.liveBoard}>
                      <div className={styles.liveScoreboard}>
                        {liveScoreRows.map((row) => {
                          const rowTeam = row.team;
                          return (
                            <article key={row.key} className={`${styles.liveScoreRow} ${row.isSelected ? styles.tableRowSelected : ''}`}>
                              {rowTeam ? (
                                <Link href={getTeamHref(rowTeam)} replace scroll={false} className={`${styles.teamCell} ${styles.teamJumpLink}`} onClick={() => handleTeamLinkClick(rowTeam.id)}>
                                  {row.logo ? <Image className={styles.rowLogo} src={row.logo} alt={row.displayName} width={30} height={30} unoptimized /> : null}
                                  <div>
                                    <strong>{row.displayName}</strong>
                                    <p>{row.abbreviation}</p>
                                  </div>
                                </Link>
                              ) : (
                                <div className={styles.teamCell}>
                                  {row.logo ? <Image className={styles.rowLogo} src={row.logo} alt={row.displayName} width={30} height={30} unoptimized /> : null}
                                  <div><strong>{row.displayName}</strong><p>{row.abbreviation}</p></div>
                                </div>
                              )}
                              <strong className={styles.liveScoreValue}>{row.score ?? '--'}</strong>
                            </article>
                          );
                        })}
                      </div>

                      <div className={styles.liveCenterColumn}>
                        <div className={styles.liveDiamondCard}>
                          <span className={styles.liveMiniLabel}>En base</span>
                          <div className={styles.liveDiamond}>
                            <span className={`${styles.baseDot} ${styles.baseSecond} ${overview.liveGame.secondBaseOccupied ? styles.baseDotActive : ''}`} />
                            <span className={`${styles.baseDot} ${styles.baseThird} ${overview.liveGame.thirdBaseOccupied ? styles.baseDotActive : ''}`} />
                            <span className={`${styles.baseDot} ${styles.baseFirst} ${overview.liveGame.firstBaseOccupied ? styles.baseDotActive : ''}`} />
                          </div>
                        </div>
                        <div className={styles.liveStatusGrid}>
                          <div className={styles.liveStatusCard}><span>Inning</span><strong>{formatLiveInning(overview.liveGame)}</strong></div>
                          <div className={styles.liveStatusCard}><span>Cuenta</span><strong>{formatLiveCount(overview.liveGame)}</strong></div>
                          <div className={styles.liveStatusCard}><span>Outs</span><strong>{formatLiveOuts(overview.liveGame)}</strong></div>
                          <div className={styles.liveStatusCard}><span>En base</span><strong>{[overview.liveGame.firstBaseOccupied, overview.liveGame.secondBaseOccupied, overview.liveGame.thirdBaseOccupied].filter(Boolean).length}</strong></div>
                        </div>
                      </div>

                      <div className={styles.liveMatchupMeta}>
                        <div className={styles.livePersonCard}>
                          {batterTeamLogo ? <div className={styles.livePersonWatermark} aria-hidden="true"><Image className={styles.livePersonWatermarkLogo} src={batterTeamLogo} alt="" width={90} height={90} unoptimized /></div> : null}
                          <div className={styles.livePersonTop}>
                            {overview.liveGame.batterHeadshot ? <Image className={styles.livePersonHeadshot} src={overview.liveGame.batterHeadshot} alt={overview.liveGame.batterName ?? 'Bateador'} width={38} height={38} unoptimized /> : null}
                            <div>
                              <span className={styles.liveMiniLabel}>Bateador</span>
                              <strong>{overview.liveGame.batterName ?? '--'}</strong>
                              <p className={styles.livePersonNote}>{overview.liveGame.batterGameSummary ?? 'Turno en seguimiento'}</p>
                            </div>
                          </div>
                          <div className={styles.livePlayerStatsCompact}>{formatLiveBatterStatLine(overview.liveGame)}</div>
                        </div>
                        <div className={styles.livePersonCard}>
                          {pitcherTeamLogo ? <div className={styles.livePersonWatermark} aria-hidden="true"><Image className={styles.livePersonWatermarkLogo} src={pitcherTeamLogo} alt="" width={90} height={90} unoptimized /></div> : null}
                          <div className={styles.livePersonTop}>
                            {overview.liveGame.pitcherHeadshot ? <Image className={styles.livePersonHeadshot} src={overview.liveGame.pitcherHeadshot} alt={overview.liveGame.pitcherName ?? 'Pitcher'} width={38} height={38} unoptimized /> : null}
                            <div>
                              <span className={styles.liveMiniLabel}>Pitcher</span>
                              <strong>{overview.liveGame.pitcherName ?? '--'}</strong>
                              <p className={styles.livePersonNote}>{overview.liveGame.pitcherGameSummary ?? 'Labor en seguimiento'}</p>
                            </div>
                          </div>
                          <div className={styles.livePlayerStatsCompact}>{formatLivePitcherStatLine(overview.liveGame)}</div>
                        </div>
                      </div>
                    </div>

                    {liveInningRows.length > 0 ? (
                      <div className={styles.liveInningPanel}>
                        <div className={styles.liveInningHeader}><span className={styles.liveMiniLabel}>Carreras por inning</span></div>
                        <div className={styles.liveInningScroller}>
                          <div className={styles.liveInningTable} style={{ gridTemplateColumns: `minmax(80px, 100px) repeat(${liveInningRows.length}, minmax(38px, 1fr))` }}>
                            <div className={styles.liveInningCorner}>Inning</div>
                            {liveInningRows.map((line) => <div key={`i-${line.inning}`} className={styles.liveInningCell}>{line.inning}</div>)}
                            <div className={`${styles.liveInningTeamLabel} ${liveScoreRows[0]?.isSelected ? styles.liveInningTeamSelected : ''}`}>{liveScoreRows[0]?.abbreviation ?? 'VIS'}</div>
                            {liveInningRows.map((line) => <div key={`a-${line.inning}`} className={styles.liveInningCell}>{line.awayRuns ?? '--'}</div>)}
                            <div className={`${styles.liveInningTeamLabel} ${liveScoreRows[1]?.isSelected ? styles.liveInningTeamSelected : ''}`}>{liveScoreRows[1]?.abbreviation ?? 'LOC'}</div>
                            {liveInningRows.map((line) => <div key={`h-${line.inning}`} className={styles.liveInningCell}>{line.homeRuns ?? '--'}</div>)}
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : overview.odds ? (
                  <>
                    <div className={styles.tableScroller}>
                      <div className={styles.oddsTable}>
                        <div className={styles.tableHeader}>
                          <span>Equipo</span><span>Moneyline</span><span>Run line</span><span>Total</span>
                        </div>
                        <div className={styles.tableBody}>
                          {overview.odds.rows.map((row) => {
                            const rowTeam = findTeamOption(teams, { abbreviation: row.abbreviation, teamName: row.teamName });
                            return (
                              <article key={row.abbreviation} className={`${styles.tableRow} ${row.isSelected ? styles.tableRowSelected : ''}`}>
                                {rowTeam ? (
                                  <Link href={getTeamHref(rowTeam)} replace scroll={false} className={`${styles.teamCell} ${styles.teamJumpLink}`} onClick={() => handleTeamLinkClick(rowTeam.id)}>
                                    {row.logo ? <Image className={styles.rowLogo} src={row.logo} alt={row.teamName} width={30} height={30} unoptimized /> : null}
                                    <div>
                                      <strong className={styles.teamNameDesktop}>{row.teamName}</strong>
                                      <strong className={styles.teamNameMobile}>{teamNicknameByAbbreviation.get(row.abbreviation) ?? row.teamName}</strong>
                                      <p>{row.abbreviation}</p>
                                    </div>
                                  </Link>
                                ) : (
                                  <div className={styles.teamCell}>
                                    {row.logo ? <Image className={styles.rowLogo} src={row.logo} alt={row.teamName} width={30} height={30} unoptimized /> : null}
                                    <div>
                                      <strong className={styles.teamNameDesktop}>{row.teamName}</strong>
                                      <strong className={styles.teamNameMobile}>{teamNicknameByAbbreviation.get(row.abbreviation) ?? row.teamName}</strong>
                                      <p>{row.abbreviation}</p>
                                    </div>
                                  </div>
                                )}
                                <span>{formatOddsValue(row.moneylineAmerican, oddsFormat)}</span>
                                <span>{formatSignedNumber(row.runLine)} / {formatOddsValue(row.runLinePriceAmerican, oddsFormat)}</span>
                                <span>{overview.odds?.totalLine?.toFixed(1) ?? '--'}</span>
                              </article>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                    <div className={styles.totalsBand}>
                      <div><span>Total carreras</span><strong>{overview.odds?.totalLine?.toFixed(1) ?? '--'}</strong></div>
                      <div><span>Over</span><strong>{formatOddsValue(overview.odds?.overOddsAmerican ?? null, oddsFormat)}</strong></div>
                      <div><span>Under</span><strong>{formatOddsValue(overview.odds?.underOddsAmerican ?? null, oddsFormat)}</strong></div>
                    </div>
                  </>
                ) : (
                  <div className={styles.emptyState}>
                    <strong>No encontramos líneas disponibles en las fuentes configuradas.</strong>
                    <p>El tablero sigue mostrando historial, clasificación y líderes mientras aparecen momios de DraftKings, Caesars, FanDuel o ESPN.</p>
                  </div>
                )}
              </article>

              {/* Team Stats Card */}
              <article className={styles.teamCard}>
                <div className={styles.cardAccent} />
                <div className={styles.cardHeader}>
                  <span className={styles.cardKicker}>Equipo activo</span>
                  <span className={styles.liveStamp}>Actualizado {formatGameDate(overview.generatedAt)}</span>
                </div>
                <div className={styles.metricsRow}>
                  <div className={styles.metricChip}><span>División</span><strong>#{overview.team.divisionRank}</strong></div>
                  <div className={styles.metricChip}><span>Liga</span><strong>#{overview.team.leagueRank}</strong></div>
                  <div className={styles.metricChip}><span>MLB</span><strong>#{overview.team.overallRank}</strong></div>
                  <div className={styles.metricChip}><span>GB</span><strong>{overview.team.gamesBack}</strong></div>
                  <div className={styles.metricChip}><span>Racha</span><strong>{overview.team.streak}</strong></div>
                </div>
                <div className={styles.statBlocks}>
                  <div className={styles.statBlock}><span>Bateo</span><strong>{overview.team.battingAverage ?? '--'}</strong><small>AVG</small></div>
                  <div className={styles.statBlock}><span>OPS</span><strong>{overview.team.ops ?? '--'}</strong><small>Ataque</small></div>
                  <div className={styles.statBlock}><span>ERA</span><strong>{overview.team.era ?? '--'}</strong><small>Pitcheo</small></div>
                  <div className={styles.statBlock}><span>WHIP</span><strong>{overview.team.whip ?? '--'}</strong><small>Control</small></div>
                </div>
                <div className={styles.teamSummaryWrap}>
                  <div className={styles.subsectionHeader}>
                    <strong>Volumen de temporada</strong>
                    <span>Acumulado</span>
                  </div>
                  <div className={styles.summaryGrid}>
                    <div className={styles.summaryItem}><span>Hits</span><strong>{overview.team.hits}</strong></div>
                    <div className={styles.summaryItem}><span>HR</span><strong>{overview.team.homeRuns}</strong></div>
                    <div className={styles.summaryItem}><span>Bases tot.</span><strong>{overview.team.totalBases}</strong></div>
                    <div className={styles.summaryItem}><span>Ponches</span><strong>{overview.team.strikeOuts}</strong></div>
                  </div>
                </div>
              </article>

              {/* History Card */}
              <article className={styles.historyCard}>
                <div className={styles.cardAccent} />
                <div className={styles.cardHeader}>
                  <span className={styles.cardKicker}>Historial</span>
                  <span className={styles.cardHint}>Forma reciente + últimos juegos</span>
                </div>
                <div className={styles.formPanel}>
                  <div className={styles.formHeader}>
                    <strong>Forma reciente</strong>
                    <span>{overview.history.recentForm.length} juegos</span>
                  </div>
                  <div className={styles.formChart}>
                    {overview.history.recentForm.map((game) => {
                      const diff = getGameDifferential(game);
                      const isWin = diff > 0;
                      const barClass = diff === 0 ? styles.formBarNeutral : isWin ? styles.formBarWin : styles.formBarLoss;
                      return (
                        <div key={game.id} className={styles.formColumn}>
                          <div className={styles.formLogoWrap}>
                            {game.opponentLogo ? (
                              <Image className={styles.formLogo} src={game.opponentLogo} alt={game.opponentDisplayName} width={26} height={26} unoptimized />
                            ) : (
                              <span className={styles.formLogoFallback}>{game.opponentAbbreviation ?? 'MLB'}</span>
                            )}
                          </div>
                          <div className={styles.formBarTrack}>
                            <div className={`${styles.formBar} ${barClass}`} style={{ height: `${getFormBarHeight(game)}px` }} />
                          </div>
                          <div className={styles.formMeta}>
                            <strong>{game.result}</strong>
                            <span>{formatShortDate(game.date)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className={styles.gamesList}>
                  {recentGamesWithSeriesTone.map((game) => (
                    <article key={game.id} className={`${styles.gameRow} ${game.seriesToneClass}`}>
                      <div className={styles.gameResult}>
                        <span className={`${styles.resultBadge} ${game.result === 'W' ? styles.resultWin : game.result === 'L' ? styles.resultLoss : ''}`}>{game.result}</span>
                        <div>
                          <strong>{game.opponentDisplayName}</strong>
                          <p>{game.isHome ? 'Local' : 'Visitante'} · {formatShortDate(game.date)}</p>
                        </div>
                      </div>
                      <div className={styles.gameMeta}>
                        <strong>{game.teamScore ?? '--'} - {game.opponentScore ?? '--'}</strong>
                        <p>{game.venueName ?? game.status}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </article>

              {/* AI Match Focus Card */}
              <article className={styles.matchFocusCard}>
                <div className={styles.cardAccent} />
                <div className={styles.cardHeader}>
                  <span className={styles.cardKicker}>Momios y análisis IA</span>
                </div>
                {matchFocus ? (
                  <div className={styles.matchFocusPanel}>
                    <div className={styles.matchFocusBoard}>
                      <div className={styles.matchFocusTop}>
                        <div className={styles.matchFocusTitleWrap}>
                          <h3 className={styles.matchFocusMatchup}>
                            {matchFocusSelectedTeam ? (
                              <Link href={getTeamHref(matchFocusSelectedTeam)} replace scroll={false} className={styles.inlineTeamLink} onClick={() => handleTeamLinkClick(matchFocusSelectedTeam.id)}>{matchFocus.selectedTeamName}</Link>
                            ) : <span>{matchFocus.selectedTeamName}</span>}
                            <span className={styles.matchFocusVersus}>vs</span>
                            {matchFocusOpponentTeam ? (
                              <Link href={getTeamHref(matchFocusOpponentTeam)} replace scroll={false} className={styles.inlineTeamLink} onClick={() => handleTeamLinkClick(matchFocusOpponentTeam.id)}>{matchFocus.opponentTeamName}</Link>
                            ) : <span>{matchFocus.opponentTeamName}</span>}
                          </h3>
                          <p>{matchFocus.kickoffLabel}</p>
                        </div>
                        <div className={styles.matchFocusTagRow}>
                          {matchFocus.tags.map((tag) => <span key={tag} className={styles.matchFocusTag}>{tag}</span>)}
                        </div>
                      </div>
                      <div className={styles.matchFocusMatrixScroll}>
                        <div className={styles.matchFocusMatrix}>
                          <div className={styles.matchFocusMatrixHeader} />
                          <div className={styles.matchFocusMatrixHeader}>Gana</div>
                          <div className={styles.matchFocusMatrixHeader}>Spread</div>
                          <div className={styles.matchFocusMatrixHeader}>Total</div>
                          {matchFocus.teamRows.map((row) => {
                            const rowTeam = teams.find((t) => t.abbreviation === row.abbreviation) ?? null;
                            return (
                              <React.Fragment key={row.key}>
                                <div className={`${styles.matchFocusTeamCell} ${row.isSelected ? styles.matchFocusTeamCellSelected : ''}`}>
                                  {rowTeam ? (
                                    <Link href={getTeamHref(rowTeam)} replace scroll={false} className={styles.matchFocusTeamLink} onClick={() => handleTeamLinkClick(rowTeam.id)}>
                                      <Image className={styles.matchFocusTeamLogo} src={rowTeam.logo} alt={row.teamName} width={30} height={30} unoptimized />
                                      <div><strong>{row.teamName}</strong><p>{row.sideLabel}</p></div>
                                    </Link>
                                  ) : (
                                    <div className={styles.matchFocusTeamLink}><div><strong>{row.teamName}</strong><p>{row.sideLabel}</p></div></div>
                                  )}
                                </div>
                                <div className={styles.matchFocusQuoteCell}><span>{row.abbreviation}</span><strong>{row.moneyline}</strong></div>
                                <div className={styles.matchFocusQuoteCell}><span>{row.spreadLabel}</span><strong>{row.spreadPrice}</strong></div>
                                <div className={styles.matchFocusQuoteCell}><span>{row.totalLabel}</span><strong>{row.totalPrice}</strong></div>
                              </React.Fragment>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                    <div className={styles.matchFocusAnalysis}>
                      <div className={styles.matchFocusAnalysisHeader}>
                        <span className={styles.matchFocusAnalysisBadge}>Análisis IA</span>
                        <span className={styles.matchFocusConfidencePill}>{matchFocus.bestOptionConfidence}</span>
                      </div>
                      <div className={styles.matchFocusAnalysisIntro}>
                        <strong>{matchFocus.bestOptionTitle}: {matchFocus.bestOptionPrice}</strong>
                        <p>{matchFocus.opinion}</p>
                      </div>
                      <div className={styles.matchFocusOptionsGrid}>
                        {matchFocus.allOptions.map((option) => (
                          <article key={option.key} className={`${styles.matchFocusOptionCard} ${option.isBest ? styles.matchFocusOptionCardBest : ''}`}>
                            <strong>{option.title}</strong>
                            <em>{option.price}</em>
                            <p>{option.note}</p>
                          </article>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className={styles.matchFocusEmpty}>
                    <strong>Sin momios suficientes para generar enfoque.</strong>
                    <p>{overview.liveGame ? 'Esta fuente ya no entrega las tres líneas necesarias.' : 'Este módulo se activa cuando hay moneyline, run line y total disponibles.'}</p>
                  </div>
                )}
              </article>

              {/* Players Section */}
              <section className={styles.playersSection}>
                <div className={styles.cardAccent} />
                <div className={styles.cardHeader}>
                  <span className={styles.cardKicker}>Jugadores clave</span>
                </div>
                <div className={styles.playersLayout}>
                  <aside className={styles.playerDetail}>
                    {selectedPlayer ? (
                      <>
                        <div className={styles.playerDetailHeader}>
                          <Image className={styles.playerDetailHeadshot} src={selectedPlayer.headshot} alt={selectedPlayer.fullName} width={56} height={56} />
                          <div>
                            <span className={styles.playerBadge}>{selectedPlayer.badge}</span>
                            <h3>{selectedPlayer.fullName}</h3>
                            <p>#{selectedPlayer.jersey} · {selectedPlayer.position}</p>
                          </div>
                        </div>
                        <div className={styles.detailGrid}>
                          <div className={styles.detailMetric}><span>Ponches %</span><strong>{selectedPlayer.strikeoutShare ?? '--'}</strong></div>
                          <div className={styles.detailMetric}><span>Total bases %</span><strong>{selectedPlayer.totalBasesShare ?? '--'}</strong></div>
                          <div className={styles.detailMetric}><span>Hits %</span><strong>{selectedPlayer.hitsShare ?? '--'}</strong></div>
                          <div className={styles.detailMetric}><span>HR %</span><strong>{selectedPlayer.homeRunsShare ?? '--'}</strong></div>
                        </div>
                        <div className={styles.detailNotes}>
                          <div><span>AVG bateo</span><strong>{selectedPlayer.battingAverage ?? '--'}</strong></div>
                          <div><span>ERA</span><strong>{selectedPlayer.earnedRunAverage ?? '--'}</strong></div>
                        </div>
                      </>
                    ) : (
                      <div className={styles.emptyState}>
                        <strong>Selecciona un jugador.</strong>
                        <p>El panel detalle se actualiza cuando eliges una tarjeta.</p>
                      </div>
                    )}
                  </aside>
                  <div className={styles.playersGrid}>
                    {overview.players.map((player) => (
                      <button key={player.entryKey} type="button" className={`${styles.playerCard} ${selectedPlayer?.entryKey === player.entryKey ? styles.playerCardActive : ''}`} onClick={() => setSelectedPlayerKey(player.entryKey)}>
                        <div className={styles.playerTop}>
                          <Image className={styles.playerHeadshot} src={player.headshot} alt={player.fullName} width={42} height={42} />
                          <div>
                            <span className={styles.playerBadge}>{player.badge}</span>
                            <strong>{player.fullName}</strong>
                            <p>#{player.jersey} · {player.position}</p>
                          </div>
                        </div>
                        <div className={styles.playerStats}>
                          <div><span>{player.primaryLabel}</span><strong>{player.primaryValue}</strong></div>
                          <div><span>{player.secondaryLabel}</span><strong>{player.secondaryValue}</strong></div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              {/* Standings Card */}
              <article className={styles.standingsCard}>
                <div className={styles.cardAccent} />
                <div className={styles.cardHeader}>
                  <span className={styles.cardKicker}>Clasificación</span>
                  <div className={styles.segmented}>
                    {standingsTabs.map((tab) => (
                      <button key={tab.key} type="button" className={`${styles.segmentButton} ${standingScope === tab.key ? styles.segmentButtonActive : ''}`} onClick={() => setStandingScope(tab.key)}>
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className={`${styles.tableScroller} ${styles.standingsScroller}`}>
                  <div className={styles.standingsTable}>
                    <div className={styles.tableHeader}>
                      <span className={styles.rankColumn}>#</span>
                      <span>Equipo</span>
                      <span>G-P</span>
                      <span className={styles.mobileWinPct}>%</span>
                      <span>GB</span>
                      <span className={styles.runDiffColumn}>RD</span>
                      <span className={styles.streakColumn}>Racha</span>
                    </div>
                    <div className={styles.tableBody}>
                      {standingRows.map((row) => (
                        <article key={row.teamId} className={`${styles.tableRow} ${row.isSelected ? styles.tableRowSelected : ''}`}>
                          <span className={`${styles.rankCell} ${styles.rankColumn}`}>{row.rank}</span>
                          <div className={styles.teamCell}>
                            <Image className={styles.rowLogo} src={row.logo} alt={row.displayName} width={28} height={28} unoptimized />
                            <div><strong>{row.displayName}</strong><p>{row.abbreviation}</p></div>
                          </div>
                          <span>{row.wins}-{row.losses}</span>
                          <span className={styles.mobileWinPct}>{row.winningPercentage}</span>
                          <span>{row.gamesBack}</span>
                          <span className={styles.runDiffColumn}>{formatRunDiff(row.runDifferential)}</span>
                          <span className={styles.streakColumn}>{row.streak}</span>
                        </article>
                      ))}
                    </div>
                  </div>
                </div>
              </article>
            </>
          ) : null}
        </div>

        {/* ── Right Panel ── */}
        <aside className={styles.rightPanel}>
          {/* Upcoming games widget */}
          <div className={styles.widgetCard}>
            <div className={styles.widgetHeader}>
              <span className={styles.widgetKicker}>Radar MLB</span>
              <div className={styles.widgetTitle}>Próximos 4 juegos</div>
            </div>
            <div className={styles.widgetBody}>
              {upcomingEventsLoading ? (
                <p className={styles.dailyGamesState}>Cargando juegos...</p>
              ) : upcomingMatchups.length === 0 ? (
                <p className={styles.dailyGamesState}>Sin juegos por mostrar.</p>
              ) : (
                <div className={styles.dailyGamesList}>
                  {upcomingMatchups.map((event) => (
                    <article key={event.id} className={styles.dailyGameItem}>
                      <div className={styles.dailyGameMeta}>{formatUpcomingGameDate(event.commenceTime)}</div>
                      <div className={styles.dailyGameTeams}>
                        {event.awayTeamOption ? (
                          <Link href={getTeamHref(event.awayTeamOption)} replace scroll={false} className={styles.dailyGameTeamLink} onClick={() => handleTeamLinkClick(event.awayTeamOption!.id)}>
                            <Image className={styles.dailyGameLogo} src={event.awayTeamOption.logo} alt={event.awayTeam} width={20} height={20} unoptimized />
                            <span>{getUpcomingTeamLabel(event.awayTeamOption, event.awayTeam)}</span>
                          </Link>
                        ) : <div className={styles.dailyGameTeamStatic}><span>{event.awayTeam}</span></div>}
                        <span className={styles.dailyGameVs}>vs</span>
                        {event.homeTeamOption ? (
                          <Link href={getTeamHref(event.homeTeamOption)} replace scroll={false} className={styles.dailyGameTeamLink} onClick={() => handleTeamLinkClick(event.homeTeamOption!.id)}>
                            <Image className={styles.dailyGameLogo} src={event.homeTeamOption.logo} alt={event.homeTeam} width={20} height={20} unoptimized />
                            <span>{getUpcomingTeamLabel(event.homeTeamOption, event.homeTeam)}</span>
                          </Link>
                        ) : <div className={styles.dailyGameTeamStatic}><span>{event.homeTeam}</span></div>}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Team quick stats widget (if team selected) */}
          {overview ? (
            <div className={styles.widgetCard}>
              <div className={styles.widgetHeader}>
                <span className={styles.widgetKicker}>Stats rápidas</span>
                <div className={styles.widgetTitle}>{overview.team.displayName}</div>
              </div>
              <div className={styles.widgetBody}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {[
                    { label: 'AVG', value: overview.team.battingAverage ?? '--' },
                    { label: 'OPS', value: overview.team.ops ?? '--' },
                    { label: 'ERA', value: overview.team.era ?? '--' },
                    { label: 'WHIP', value: overview.team.whip ?? '--' },
                    { label: 'HR', value: String(overview.team.homeRuns) },
                    { label: 'K', value: String(overview.team.strikeOuts) },
                  ].map((s) => (
                    <div key={s.label} style={{ background: '#fff', borderRadius: '8px', padding: '8px', textAlign: 'center', border: '1px solid rgba(0,0,0,0.06)' }}>
                      <span style={{ display: 'block', fontSize: '0.6rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '3px' }}>{s.label}</span>
                      <strong style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--team-primary)' }}>{s.value}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {/* Odds format toggle widget */}
          <div className={styles.widgetCard}>
            <div className={styles.widgetHeader}>
              <span className={styles.widgetKicker}>Formato de momios</span>
            </div>
            <div className={styles.widgetBody}>
              <div className={styles.formatToggle}>
                <button type="button" className={`${styles.formatToggleButton} ${oddsFormat === 'decimal' ? styles.formatToggleButtonActive : ''}`} onClick={() => setOddsFormat('decimal')}>Decimal</button>
                <button type="button" className={`${styles.formatToggleButton} ${oddsFormat === 'american' ? styles.formatToggleButtonActive : ''}`} onClick={() => setOddsFormat('american')}>Americano</button>
              </div>
            </div>
          </div>
        </aside>

      </div>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <main className={styles.page}>
          <div className={styles.shell}>
            <div className={styles.main} style={{ gridColumn: '1 / -1' }}>
              <section className={styles.loadingCard}>
                <div className={styles.loadingPulse} />
                <strong>Cargando tablero MLB...</strong>
                <p>Estoy preparando la selección del equipo desde la URL.</p>
              </section>
            </div>
          </div>
        </main>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
