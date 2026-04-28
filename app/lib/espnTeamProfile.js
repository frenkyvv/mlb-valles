const ESPN_SITE_BASE = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba';
const ESPN_COMMON_BASE = 'https://site.api.espn.com/apis/common/v3/sports/basketball/nba';
const ESPN_WEB_BASE = 'https://site.web.api.espn.com/apis/v2/sports/basketball/nba';

const fetchEspnJson = async (url) => {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
    },
    next: {
      revalidate: 3600,
    },
  });

  if (!response.ok) {
    throw new Error(`No se pudo consultar ESPN (${response.status}).`);
  }

  return response.json();
};

const toNumber = (value) => {
  if (typeof value === 'number') {
    return value;
  }

  if (!value) {
    return 0;
  }

  return Number(String(value).replace(/,/g, ''));
};

const getCategoryByName = (categories = [], categoryName) =>
  categories.find((category) => category.name === categoryName);

const getStatByName = (stats = [], statName) =>
  stats.find((stat) => stat.name === statName || stat.type === statName) ?? null;

const getLatestTeamStatRecord = (category, teamId) => {
  if (!category?.statistics) {
    return null;
  }

  return category.statistics
    .filter((entry) => entry.teamId === teamId)
    .sort((left, right) => right.season.year - left.season.year)[0] ?? null;
};

const mapCategoryStats = (category, record) => {
  if (!category || !record?.stats) {
    return {};
  }

  return category.names.reduce((accumulator, statName, index) => {
    accumulator[statName] = record.stats[index];
    return accumulator;
  }, {});
};

const getMadeValue = (value) => {
  if (typeof value === 'number') {
    return value;
  }

  if (!value) {
    return 0;
  }

  return toNumber(String(value).split('-')[0]);
};

const mapRosterPlayer = (player) => ({
  id: player.id,
  fullName: player.displayName,
  shortName: player.shortName ?? player.displayName,
  jersey: player.jersey ?? '--',
  position: player.position?.abbreviation ?? 'ATH',
  headshot: player.headshot?.href ?? null,
});

const loadPlayerSnapshot = async (player, teamId) => {
  const data = await fetchEspnJson(
    `${ESPN_COMMON_BASE}/athletes/${player.id}/stats`
  );

  const averagesCategory = getCategoryByName(data.categories, 'averages');
  const totalsCategory = getCategoryByName(data.categories, 'totals');

  const averagesRecord = getLatestTeamStatRecord(averagesCategory, teamId);
  const totalsRecord = getLatestTeamStatRecord(totalsCategory, teamId);

  const averageStats = mapCategoryStats(averagesCategory, averagesRecord);
  const totalStats = mapCategoryStats(totalsCategory, totalsRecord);

  return {
    ...player,
    season: Math.max(
      averagesRecord?.season?.year ?? 0,
      totalsRecord?.season?.year ?? 0
    ),
    gamesPlayed: toNumber(averageStats.gamesPlayed),
    pointsPerGame: toNumber(averageStats.avgPoints),
    reboundsPerGame: toNumber(averageStats.avgRebounds),
    assistsPerGame: toNumber(averageStats.avgAssists),
    pointsTotal: toNumber(totalStats.points),
    reboundsTotal: toNumber(totalStats.totalRebounds),
    threesMadePerGame: getMadeValue(
      averageStats['avgThreePointFieldGoalsMade-avgThreePointFieldGoalsAttempted']
    ),
    threesMadeTotal: getMadeValue(
      totalStats['threePointFieldGoalsMade-threePointFieldGoalsAttempted']
    ),
    threePointPct: toNumber(averageStats.threePointFieldGoalPct),
  };
};

const sortPlayersByStat = (players, statName) =>
  [...players]
    .filter((player) => toNumber(player[statName]) > 0)
    .sort((left, right) => toNumber(right[statName]) - toNumber(left[statName]))
    .slice(0, 5);

const getPlayoffStatus = (seed) => {
  if (typeof seed !== 'number' || Number.isNaN(seed)) {
    return 'outside';
  }

  if (seed <= 6) {
    return 'playoffs';
  }

  if (seed <= 10) {
    return 'play-in';
  }

  return 'outside';
};

const getWinPct = (wins, losses) => {
  const totalGames = wins + losses;

  if (totalGames === 0) {
    return '--';
  }

  return `${((wins / totalGames) * 100).toFixed(1)}%`;
};

const mapStandingRow = (entry, index, selectedAbbreviation) => {
  const wins = toNumber(getStatByName(entry.stats, 'wins')?.value);
  const losses = toNumber(getStatByName(entry.stats, 'losses')?.value);
  const playoffSeed = toNumber(getStatByName(entry.stats, 'playoffseed')?.value);

  return {
    position: index + 1,
    teamId: entry.team?.id ?? null,
    abbreviation: entry.team?.abbreviation ?? null,
    displayName: entry.team?.displayName ?? 'Equipo',
    shortDisplayName: entry.team?.shortDisplayName ?? entry.team?.name ?? 'Equipo',
    logo: entry.team?.logos?.[0]?.href ?? null,
    wins,
    losses,
    gamesBehind: getStatByName(entry.stats, 'gamesbehind')?.displayValue ?? '--',
    winPct: getWinPct(wins, losses),
    playoffSeed,
    clincher: getStatByName(entry.stats, 'clincher')?.displayValue ?? null,
    playoffStatus: getPlayoffStatus(playoffSeed),
    isSelected:
      entry.team?.abbreviation?.toLowerCase() === selectedAbbreviation.toLowerCase(),
  };
};

const sortAndPositionRows = (rows = []) =>
  [...rows]
    .sort((left, right) => left.playoffSeed - right.playoffSeed)
    .map((row, index) => ({
      ...row,
      position: index + 1,
    }));

const loadDivisionStanding = async (groupId, selectedAbbreviation) => {
  if (!groupId) {
    return null;
  }

  const data = await fetchEspnJson(`${ESPN_WEB_BASE}/standings?group=${groupId}`);
  const rows = sortAndPositionRows(
    (data.standings?.entries ?? []).map((entry, index) =>
      mapStandingRow(entry, index, selectedAbbreviation)
    )
  );

  if (rows.length === 0) {
    return null;
  }

  const selectedRow = rows.find((row) => row.isSelected);

  return {
    name: data.name ?? 'División',
    abbreviation: data.abbreviation ?? null,
    selectedPosition: selectedRow?.position ?? null,
    rows,
  };
};

const loadConferenceStanding = async (groupId, selectedAbbreviation) => {
  if (!groupId) {
    return null;
  }

  const data = await fetchEspnJson(`${ESPN_WEB_BASE}/standings?group=${groupId}`);
  const rows = sortAndPositionRows(
    (data.children ?? []).flatMap((child) =>
      (child.standings?.entries ?? []).map((entry, index) =>
        mapStandingRow(entry, index, selectedAbbreviation)
      )
    )
  );

  if (rows.length === 0) {
    return null;
  }

  const selectedRow = rows.find((row) => row.isSelected);

  return {
    name: data.name ?? 'Conferencia',
    abbreviation: data.abbreviation ?? null,
    selectedPosition: selectedRow?.playoffSeed ?? null,
    rows,
  };
};

const mapUpcomingGame = (event, selectedAbbreviation) => {
  const competition = event.competitions?.[0];
  const competitors = competition?.competitors ?? [];

  if (!competition || competitors.length < 2) {
    return null;
  }

  const homeTeam = competitors.find((competitor) => competitor.homeAway === 'home');
  const awayTeam = competitors.find((competitor) => competitor.homeAway === 'away');

  if (!homeTeam || !awayTeam) {
    return null;
  }

  const isHome =
    homeTeam.team?.abbreviation?.toLowerCase() === selectedAbbreviation.toLowerCase();
  const opponent = isHome ? awayTeam.team : homeTeam.team;

  return {
    id: event.id,
    date: event.date,
    isHome,
    venueName: competition.venue?.fullName ?? null,
    venueCity: competition.venue?.address?.city ?? null,
    venueState: competition.venue?.address?.state ?? null,
    statusDetail: event.status?.type?.shortDetail ?? null,
    opponentDisplayName: opponent?.displayName ?? 'Rival',
    opponentShortName: opponent?.shortDisplayName ?? opponent?.name ?? 'Rival',
    opponentAbbreviation: opponent?.abbreviation ?? null,
    homeTeam: homeTeam.team?.displayName ?? null,
    awayTeam: awayTeam.team?.displayName ?? null,
  };
};

export const getEspnTeamProfile = async (abbreviation) => {
  const normalizedAbbreviation = abbreviation.toLowerCase();

  const [scheduleData, rosterData, teamData] = await Promise.all([
    fetchEspnJson(`${ESPN_SITE_BASE}/teams/${normalizedAbbreviation}/schedule`),
    fetchEspnJson(`${ESPN_SITE_BASE}/teams/${normalizedAbbreviation}/roster`),
    fetchEspnJson(`${ESPN_SITE_BASE}/teams/${normalizedAbbreviation}`),
  ]);

  const teamId = scheduleData.team?.id;
  const seasonSummary =
    scheduleData.requestedSeason?.displayName ??
    scheduleData.team?.seasonSummary ??
    String(scheduleData.season?.year ?? '');
  const rosterPlayers = (rosterData.athletes ?? []).map(mapRosterPlayer);

  const playerSnapshots = (
    await Promise.allSettled(
      rosterPlayers.map((player) => loadPlayerSnapshot(player, teamId))
    )
  )
    .filter((result) => result.status === 'fulfilled')
    .map((result) => result.value);

  const conferenceStanding = await loadConferenceStanding(
    teamData.team?.groups?.parent?.id,
    normalizedAbbreviation
  ).catch(() => null);
  const groupStanding = await loadDivisionStanding(
    teamData.team?.groups?.id,
    normalizedAbbreviation
  ).catch(() => null);
  const selectedConferenceRow = conferenceStanding?.rows?.find((row) => row.isSelected) ?? null;
  const selectedDivisionRow = groupStanding?.rows?.find((row) => row.isSelected) ?? null;
  const nextGames = (scheduleData.events ?? [])
    .filter((event) => new Date(event.date).getTime() >= Date.now())
    .map((event) => mapUpcomingGame(event, normalizedAbbreviation))
    .filter(Boolean)
    .slice(0, 3);

  return {
    team: {
      id: teamId,
      abbreviation: scheduleData.team?.abbreviation,
      displayName: scheduleData.team?.displayName,
      shortDisplayName: scheduleData.team?.name ?? scheduleData.team?.shortDisplayName,
      recordSummary: scheduleData.team?.recordSummary ?? '--',
      standingSummary: scheduleData.team?.standingSummary ?? 'Sin standing disponible',
      seasonSummary,
      venueName: teamData.team?.franchise?.venue?.fullName ?? null,
      venueCity: teamData.team?.franchise?.venue?.address?.city ?? null,
      venueState: teamData.team?.franchise?.venue?.address?.state ?? null,
      conferenceName: conferenceStanding?.name ?? teamData.team?.groups?.parent?.name ?? null,
      divisionName: groupStanding?.name ?? teamData.team?.groups?.name ?? null,
      conferenceSeed: selectedConferenceRow?.playoffSeed ?? null,
      divisionPosition: selectedDivisionRow?.position ?? null,
      playoffStatus: selectedConferenceRow?.playoffStatus ?? 'outside',
    },
    conferenceStanding,
    groupStanding,
    leaders: {
      points: sortPlayersByStat(playerSnapshots, 'pointsTotal'),
      rebounds: sortPlayersByStat(playerSnapshots, 'reboundsTotal'),
      threes: sortPlayersByStat(playerSnapshots, 'threesMadePerGame'),
    },
    nextGames,
  };
};
