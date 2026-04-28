import nbaTeams from './nbaTeams.json';

const teamMap = new Map();

nbaTeams.forEach((team) => {
  teamMap.set(team.apiName.toLowerCase(), team);
  teamMap.set(team.abbreviation.toLowerCase(), team);
});

export const getTeamData = (teamName) => {
  if (!teamName) {
    return null;
  }

  return teamMap.get(String(teamName).toLowerCase()) ?? null;
};

const normalizeTeamLabel = (teamName) => getTeamData(teamName)?.apiName ?? teamName ?? null;

export const getAllTeams = () => nbaTeams;

export const formatGameTime = (dateString) =>
  new Intl.DateTimeFormat('es-MX', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));

export const formatDecimalOdds = (value) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '--';
  }

  return value.toFixed(2);
};

export const formatAmericanOdds = (value) => {
  if (typeof value !== 'number' || Number.isNaN(value) || value === 0) {
    return '--';
  }

  const roundedValue = Math.round(value);
  return roundedValue > 0 ? `+${roundedValue}` : `${roundedValue}`;
};

export const convertOddsToDecimal = (value, oddsFormat = 'decimal') => {
  if (typeof value !== 'number' || Number.isNaN(value) || value === 0) {
    return null;
  }

  if (oddsFormat === 'american') {
    return value > 0 ? 1 + value / 100 : 1 + 100 / Math.abs(value);
  }

  return value;
};

export const formatOddsValue = (value, oddsFormat = 'decimal') =>
  oddsFormat === 'american'
    ? formatAmericanOdds(value)
    : formatDecimalOdds(value);

export const formatSpread = (point) => {
  if (typeof point !== 'number' || Number.isNaN(point)) {
    return '--';
  }

  if (point > 0) {
    return `+${point.toFixed(1)}`;
  }

  return point.toFixed(1);
};

export const formatLineValue = (value) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '--';
  }

  return value.toFixed(1);
};

export const getImpliedProbability = (value, oddsFormat = 'decimal') => {
  if (typeof value !== 'number' || Number.isNaN(value) || value === 0) {
    return null;
  }

  if (oddsFormat === 'american') {
    const probability =
      value > 0
        ? (100 / (value + 100)) * 100
        : (Math.abs(value) / (Math.abs(value) + 100)) * 100;

    return probability.toFixed(1);
  }

  return ((1 / value) * 100).toFixed(1);
};

export const findMarket = (bookmaker, key) =>
  bookmaker?.markets?.find((market) => market.key === key);

export const getOutcome = (market, teamName) =>
  market?.outcomes?.find((outcome) => {
    if (outcome.name === teamName) {
      return true;
    }

    return normalizeTeamLabel(outcome.name) === normalizeTeamLabel(teamName);
  });

export const getBestPrice = (bookmakers = [], marketKey, teamName, oddsFormat = 'decimal') => {
  let bestPrice = null;

  for (const bookmaker of bookmakers) {
    const market = findMarket(bookmaker, marketKey);
    const outcome = getOutcome(market, teamName);

    if (!outcome || typeof outcome.price !== 'number') {
      continue;
    }

    const decimalPrice = convertOddsToDecimal(outcome.price, oddsFormat);

    if (decimalPrice === null) {
      continue;
    }

    if (!bestPrice || decimalPrice > bestPrice.decimalPrice) {
      bestPrice = {
        bookmaker: bookmaker.title,
        price: outcome.price,
        point: typeof outcome.point === 'number' ? outcome.point : null,
        decimalPrice,
      };
    }
  }

  return bestPrice;
};

const average = (values) => {
  if (values.length === 0) {
    return null;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

export const getConsensusSpread = (bookmakers = [], teamName) => {
  const values = bookmakers
    .map((bookmaker) => {
      const market = findMarket(bookmaker, 'spreads');
      const outcome = getOutcome(market, teamName);
      return typeof outcome?.point === 'number' ? outcome.point : null;
    })
    .filter((value) => typeof value === 'number');

  return average(values);
};

export const getConsensusTotal = (bookmakers = []) => {
  const values = bookmakers
    .map((bookmaker) => {
      const market = findMarket(bookmaker, 'totals');
      const point = market?.outcomes?.find(
        (outcome) => typeof outcome.point === 'number'
      )?.point;

      return typeof point === 'number' ? point : null;
    })
    .filter((value) => typeof value === 'number');

  return average(values);
};
