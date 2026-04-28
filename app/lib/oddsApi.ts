const THE_ODDS_API_BASE = 'https://api.the-odds-api.com/v4/sports/baseball_mlb';
const BETSTACK_API_BASE = 'https://api.betstack.dev/api/v1';
const ESPN_SCOREBOARD_BASE = 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard';
const THE_ODDS_FALLBACK_API_KEY = '68bf845edcc203a1af3e7e42b05df487';
const BETSTACK_FALLBACK_API_KEY =
  'd4ef9de6c9591e1257dfa063d69abf1f4b4a5e0644a4cde86f051675e23f5841';
const THE_ODDS_API_KEY = process.env.ODDS_API_KEY || THE_ODDS_FALLBACK_API_KEY;
const BETSTACK_API_KEY = process.env.BETSTACK_API_KEY || BETSTACK_FALLBACK_API_KEY;

type QueryParams = Record<string, string>;

export type OddsFormat = 'decimal' | 'american';

export type OddsOutcome = {
  name: string;
  price: number;
  point?: number;
};

export type OddsMarket = {
  key: string;
  outcomes: OddsOutcome[];
};

export type OddsBookmaker = {
  key: string;
  title: string;
  markets: OddsMarket[];
};

export type OddsEvent = {
  id: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers?: OddsBookmaker[];
  source?: string;
};

export type ScoreEntry = {
  name: string;
  score: string;
};

export type ScoreEvent = {
  id: string;
  commence_time: string;
  completed: boolean;
  home_team: string;
  away_team: string;
  scores?: ScoreEntry[];
  last_update?: string;
  source?: string;
};

type EspnTeam = {
  displayName?: string;
  name?: string;
};

type EspnCompetitor = {
  homeAway?: 'home' | 'away' | string;
  score?: string;
  team?: EspnTeam;
};

type EspnOddsSide = {
  odds?: string;
  line?: string;
};

type EspnMoneyline = {
  home?: { close?: EspnOddsSide; open?: EspnOddsSide };
  away?: { close?: EspnOddsSide; open?: EspnOddsSide };
};

type EspnPointSpread = {
  home?: { close?: EspnOddsSide; open?: EspnOddsSide };
  away?: { close?: EspnOddsSide; open?: EspnOddsSide };
};

type EspnTotal = {
  over?: { close?: EspnOddsSide; open?: EspnOddsSide };
  under?: { close?: EspnOddsSide; open?: EspnOddsSide };
};

type EspnOdds = {
  provider?: {
    id?: string | number;
    name?: string;
    displayName?: string;
  };
  overUnder?: number;
  moneyline?: EspnMoneyline;
  pointSpread?: EspnPointSpread;
  total?: EspnTotal;
};

type EspnCompetition = {
  competitors?: EspnCompetitor[];
  odds?: EspnOdds[];
  status?: {
    type?: {
      state?: string;
      completed?: boolean;
    };
  };
};

type EspnEvent = {
  id: string;
  date: string;
  competitions?: EspnCompetition[];
  status?: {
    type?: {
      state?: string;
      completed?: boolean;
    };
  };
};

type EspnScoreboardResponse = {
  events?: EspnEvent[];
};

type BetStackLeague = {
  key?: string;
  name?: string;
};

type BetStackEventInfo = {
  id: number;
  commence_time: string;
  home_team: string;
  away_team: string;
  league?: BetStackLeague;
};

type BetStackLine = {
  id: number;
  event_id: number;
  event?: BetStackEventInfo;
  bookmaker?: {
    id?: number;
    key?: string;
    name?: string;
  };
  moneyline?: {
    home?: string | null;
    away?: string | null;
    draw?: string | null;
  };
  spread?: {
    home?: {
      point?: string | null;
      price?: string | null;
    };
    away?: {
      point?: string | null;
      price?: string | null;
    };
  };
  total?: {
    number?: string | null;
    over?: string | null;
    under?: string | null;
  };
  last_updated?: string;
  source?: string;
};

type BetStackResult = {
  id: number;
  event_id: number;
  home_score: number;
  away_score: number;
  total_score: number;
  final: boolean;
  event?: BetStackEventInfo;
};

async function requestOddsApi(path: string, params: QueryParams) {
  const url = new URL(`${THE_ODDS_API_BASE}/${path}`);

  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const response = await fetch(url.toString(), {
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Error ${response.status} al consultar The Odds API.`);
  }

  return response.json();
}

async function requestEspnScoreboard(date?: string): Promise<EspnScoreboardResponse> {
  const url = new URL(ESPN_SCOREBOARD_BASE);

  if (date) {
    url.searchParams.set('dates', date.replace(/-/g, ''));
  }

  const response = await fetch(url.toString(), {
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Error ${response.status} al consultar ESPN.`);
  }

  return response.json();
}

async function requestBetStack(path: string) {
  const url = new URL(`${BETSTACK_API_BASE}/${path}`);
  url.searchParams.set('api_key', BETSTACK_API_KEY);

  const response = await fetch(url.toString(), {
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Error ${response.status} al consultar BetStack.`);
  }

  return response.json();
}

const parseAmericanOdds = (value?: string | null) => {
  if (!value) {
    return null;
  }

  const parsedValue = Number(value);
  return Number.isNaN(parsedValue) ? null : parsedValue;
};

const parseNumericString = (value?: string | null) => {
  if (!value) {
    return null;
  }

  const parsedValue = Number(value);
  return Number.isNaN(parsedValue) ? null : parsedValue;
};

const convertAmericanToDecimal = (value: number | null) => {
  if (typeof value !== 'number' || Number.isNaN(value) || value === 0) {
    return null;
  }

  return value > 0 ? 1 + value / 100 : 1 + 100 / Math.abs(value);
};

const convertLineValue = (value: number | null, oddsFormat: OddsFormat) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return null;
  }

  if (oddsFormat === 'american') {
    return value;
  }

  return convertAmericanToDecimal(value);
};

const parseSpreadLine = (value?: string | null) => {
  if (!value) {
    return null;
  }

  const parsedValue = Number(value);
  return Number.isNaN(parsedValue) ? null : parsedValue;
};

const parseTotalLine = (value?: string | null) => {
  if (!value) {
    return null;
  }

  const normalizedValue = value.replace(/^[ou]/i, '');
  const parsedValue = Number(normalizedValue);
  return Number.isNaN(parsedValue) ? null : parsedValue;
};

const mapEspnOddsToEvent = (event: EspnEvent, oddsFormat: OddsFormat): OddsEvent | null => {
  const competition = event.competitions?.[0];
  const homeCompetitor = competition?.competitors?.find(
    (competitor) => competitor.homeAway === 'home'
  );
  const awayCompetitor = competition?.competitors?.find(
    (competitor) => competitor.homeAway === 'away'
  );
  const odds = competition?.odds?.[0];

  if (!competition || !homeCompetitor || !awayCompetitor || !odds) {
    return null;
  }

  const homeMoneylineAmerican = parseAmericanOdds(
    odds.moneyline?.home?.close?.odds ?? odds.moneyline?.home?.open?.odds
  );
  const awayMoneylineAmerican = parseAmericanOdds(
    odds.moneyline?.away?.close?.odds ?? odds.moneyline?.away?.open?.odds
  );
  const homeSpread = parseSpreadLine(
    odds.pointSpread?.home?.close?.line ?? odds.pointSpread?.home?.open?.line
  );
  const awaySpread = parseSpreadLine(
    odds.pointSpread?.away?.close?.line ?? odds.pointSpread?.away?.open?.line
  );
  const totalLine =
    parseTotalLine(odds.total?.over?.close?.line ?? odds.total?.over?.open?.line) ??
    (typeof odds.overUnder === 'number' ? odds.overUnder : null);
  const overOddsAmerican = parseAmericanOdds(
    odds.total?.over?.close?.odds ?? odds.total?.over?.open?.odds
  );
  const underOddsAmerican = parseAmericanOdds(
    odds.total?.under?.close?.odds ?? odds.total?.under?.open?.odds
  );

  return {
    id: event.id,
    commence_time: event.date,
    home_team: homeCompetitor.team?.displayName ?? homeCompetitor.team?.name ?? 'Home Team',
    away_team: awayCompetitor.team?.displayName ?? awayCompetitor.team?.name ?? 'Away Team',
    bookmakers: [
      {
        key: `espn-${odds.provider?.id ?? 'default'}`,
        title: odds.provider?.displayName ?? odds.provider?.name ?? 'ESPN Odds',
        markets: [
          {
            key: 'h2h',
            outcomes: [
              {
                name:
                  homeCompetitor.team?.displayName ??
                  homeCompetitor.team?.name ??
                  'Home Team',
                price: convertLineValue(homeMoneylineAmerican, oddsFormat) ?? 0,
              },
              {
                name:
                  awayCompetitor.team?.displayName ??
                  awayCompetitor.team?.name ??
                  'Away Team',
                price: convertLineValue(awayMoneylineAmerican, oddsFormat) ?? 0,
              },
            ].filter((outcome) => outcome.price !== 0),
          },
          {
            key: 'spreads',
            outcomes: [
              {
                name:
                  homeCompetitor.team?.displayName ??
                  homeCompetitor.team?.name ??
                  'Home Team',
                price: convertLineValue(
                  parseAmericanOdds(
                    odds.pointSpread?.home?.close?.odds ?? odds.pointSpread?.home?.open?.odds
                  ),
                  oddsFormat
                ) ?? 0,
                point: homeSpread ?? undefined,
              },
              {
                name:
                  awayCompetitor.team?.displayName ??
                  awayCompetitor.team?.name ??
                  'Away Team',
                price: convertLineValue(
                  parseAmericanOdds(
                    odds.pointSpread?.away?.close?.odds ?? odds.pointSpread?.away?.open?.odds
                  ),
                  oddsFormat
                ) ?? 0,
                point: awaySpread ?? undefined,
              },
            ].filter((outcome) => typeof outcome.point === 'number'),
          },
          {
            key: 'totals',
            outcomes: [
              {
                name: 'Over',
                price: convertLineValue(overOddsAmerican, oddsFormat) ?? 0,
                point: totalLine ?? undefined,
              },
              {
                name: 'Under',
                price: convertLineValue(underOddsAmerican, oddsFormat) ?? 0,
                point: totalLine ?? undefined,
              },
            ].filter((outcome) => typeof outcome.point === 'number'),
          },
        ],
      },
    ],
    source: 'ESPN',
  };
};

async function getEspnOddsFallback(
  oddsFormat: OddsFormat = 'decimal',
  dates: string[] = []
) {
  const uniqueDates =
    dates.length > 0
      ? [...new Set(dates)]
      : [new Date().toISOString().slice(0, 10)];
  const responses = await Promise.all(uniqueDates.map((date) => requestEspnScoreboard(date)));

  return responses.flatMap((response) =>
    (response.events ?? [])
      .map((event) => mapEspnOddsToEvent(event, oddsFormat))
      .filter(Boolean)
  ) as OddsEvent[];
}

async function getEspnScoresFallback() {
  const response = await requestEspnScoreboard();

  return (response.events ?? []).map((event) => {
    const competition = event.competitions?.[0];
    const statusState = competition?.status?.type?.state ?? event.status?.type?.state ?? 'pre';
    const isCompleted = Boolean(
      competition?.status?.type?.completed ?? event.status?.type?.completed
    );
    const competitors = competition?.competitors ?? [];
    const scores =
      statusState === 'pre'
        ? []
        : competitors.map((competitor) => ({
            name: competitor.team?.displayName ?? competitor.team?.name ?? 'Equipo',
            score: competitor.score ?? '0',
          }));

    return {
      id: event.id,
      commence_time: event.date,
      completed: isCompleted,
      home_team:
        competitors.find((competitor) => competitor.homeAway === 'home')?.team
          ?.displayName ?? 'Home Team',
      away_team:
        competitors.find((competitor) => competitor.homeAway === 'away')?.team
          ?.displayName ?? 'Away Team',
      scores,
      last_update: undefined,
      source: 'ESPN',
    } satisfies ScoreEvent;
  });
}

function mapBetStackLineToEvent(line: BetStackLine, oddsFormat: OddsFormat): OddsEvent | null {
  if (line.event?.league?.key !== 'baseball_mlb' || !line.event) {
    return null;
  }

  const homeMoneyline = convertLineValue(parseNumericString(line.moneyline?.home), oddsFormat);
  const awayMoneyline = convertLineValue(parseNumericString(line.moneyline?.away), oddsFormat);
  const homeSpreadPrice = convertLineValue(
    parseNumericString(line.spread?.home?.price),
    oddsFormat
  );
  const awaySpreadPrice = convertLineValue(
    parseNumericString(line.spread?.away?.price),
    oddsFormat
  );
  const homeSpreadPoint = parseNumericString(line.spread?.home?.point);
  const awaySpreadPoint = parseNumericString(line.spread?.away?.point);
  const totalNumber = parseNumericString(line.total?.number);
  const overLine = convertLineValue(parseNumericString(line.total?.over), oddsFormat);
  const underLine = convertLineValue(parseNumericString(line.total?.under), oddsFormat);

  return {
    id: String(line.event.id),
    commence_time: line.event.commence_time,
    home_team: line.event.home_team,
    away_team: line.event.away_team,
    bookmakers: [
      {
        key: line.bookmaker?.key ?? 'betstack',
        title: line.bookmaker?.name ?? 'BetStack',
        markets: [
          {
            key: 'h2h',
            outcomes: [
              {
                name: line.event.home_team,
                price: homeMoneyline ?? 0,
              },
              {
                name: line.event.away_team,
                price: awayMoneyline ?? 0,
              },
            ].filter((outcome) => outcome.price !== 0),
          },
          {
            key: 'spreads',
            outcomes: [
              {
                name: line.event.home_team,
                price: homeSpreadPrice ?? 0,
                point: homeSpreadPoint ?? undefined,
              },
              {
                name: line.event.away_team,
                price: awaySpreadPrice ?? 0,
                point: awaySpreadPoint ?? undefined,
              },
            ].filter((outcome) => typeof outcome.point === 'number'),
          },
          {
            key: 'totals',
            outcomes: [
              {
                name: 'Over',
                price: overLine ?? 0,
                point: totalNumber ?? undefined,
              },
              {
                name: 'Under',
                price: underLine ?? 0,
                point: totalNumber ?? undefined,
              },
            ].filter((outcome) => typeof outcome.point === 'number'),
          },
        ],
      },
    ],
    source: 'BetStack',
  };
}

async function getBetStackOddsFallback(oddsFormat: OddsFormat = 'decimal') {
  const response = (await requestBetStack('lines')) as BetStackLine[];
  const lines = Array.isArray(response) ? response : [];
  const latestByEvent = new Map<number, BetStackLine>();

  lines
    .filter((line) => line.event?.league?.key === 'baseball_mlb')
    .forEach((line) => {
      const previousLine = latestByEvent.get(line.event_id);

      if (!previousLine) {
        latestByEvent.set(line.event_id, line);
        return;
      }

      const previousUpdatedAt = previousLine.last_updated ?? '';
      const currentUpdatedAt = line.last_updated ?? '';

      if (currentUpdatedAt >= previousUpdatedAt) {
        latestByEvent.set(line.event_id, line);
      }
    });

  return [...latestByEvent.values()]
    .map((line) => mapBetStackLineToEvent(line, oddsFormat))
    .filter(Boolean) as OddsEvent[];
}

async function getBetStackScoresFallback() {
  const response = (await requestBetStack('results')) as BetStackResult[];
  const results = Array.isArray(response) ? response : [];

  return results
    .filter((result) => result.event?.league?.key === 'baseball_mlb' && result.event)
    .map((result) => ({
      id: String(result.event_id),
      commence_time: result.event?.commence_time ?? '',
      completed: result.final,
      home_team: result.event?.home_team ?? 'Home Team',
      away_team: result.event?.away_team ?? 'Away Team',
      scores: [
        {
          name: result.event?.home_team ?? 'Home Team',
          score: String(result.home_score),
        },
        {
          name: result.event?.away_team ?? 'Away Team',
          score: String(result.away_score),
        },
      ],
      last_update: undefined,
      source: 'BetStack',
    })) satisfies ScoreEvent[];
}

export function getUpcomingEvents() {
  return requestOddsApi('events', {
    apiKey: THE_ODDS_API_KEY,
    dateFormat: 'iso',
  });
}

export async function getUpcomingOdds(
  oddsFormat: OddsFormat = 'decimal',
  dates: string[] = []
) {
  try {
    const response = (await requestOddsApi('odds', {
      apiKey: THE_ODDS_API_KEY,
      regions: 'us',
      markets: 'h2h,spreads,totals',
      oddsFormat,
      dateFormat: 'iso',
    })) as OddsEvent[];

    return Array.isArray(response)
      ? response.map((event) => ({
          ...event,
          source: 'The Odds API',
        }))
      : [];
  } catch {
    try {
      return await getBetStackOddsFallback(oddsFormat);
    } catch {
      return getEspnOddsFallback(oddsFormat, dates);
    }
  }
}

export async function getCurrentScores() {
  try {
    const response = (await requestOddsApi('scores', {
      apiKey: THE_ODDS_API_KEY,
      dateFormat: 'iso',
    })) as ScoreEvent[];

    return Array.isArray(response)
      ? response.map((event) => ({
          ...event,
          source: 'The Odds API',
        }))
      : [];
  } catch {
    try {
      return await getBetStackScoresFallback();
    } catch {
      return getEspnScoresFallback();
    }
  }
}
