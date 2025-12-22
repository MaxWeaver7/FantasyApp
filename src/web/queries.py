from __future__ import annotations

import sqlite3
from typing import Any, Optional


def dict_rows(cur: sqlite3.Cursor) -> list[dict[str, Any]]:
    cols = [c[0] for c in cur.description] if cur.description else []
    return [dict(zip(cols, row)) for row in cur.fetchall()]


def options(conn: sqlite3.Connection) -> dict[str, Any]:
    cur = conn.cursor()
    seasons = [r[0] for r in cur.execute("SELECT DISTINCT season FROM games ORDER BY season").fetchall()]
    weeks = [r[0] for r in cur.execute("SELECT DISTINCT week FROM games ORDER BY week").fetchall()]
    teams = [r[0] for r in cur.execute("SELECT team_abbr FROM teams WHERE team_abbr IS NOT NULL ORDER BY team_abbr").fetchall()]
    return {"seasons": seasons, "weeks": weeks, "teams": teams}


def summary(conn: sqlite3.Connection) -> dict[str, Any]:
    cur = conn.cursor()
    seasons = [r[0] for r in cur.execute("SELECT DISTINCT season FROM plays ORDER BY season").fetchall()]
    games = cur.execute("SELECT COUNT(*) FROM games").fetchone()[0]
    plays = cur.execute("SELECT COUNT(*) FROM plays").fetchone()[0]
    players = cur.execute("SELECT COUNT(*) FROM players").fetchone()[0]
    pum = cur.execute("SELECT COUNT(*) FROM player_usage_metrics").fetchone()[0]
    sa = cur.execute("SELECT COUNT(*) FROM season_aggregates").fetchone()[0]
    routes_nonnull = cur.execute("SELECT COUNT(*) FROM player_usage_metrics WHERE routes_run IS NOT NULL").fetchone()[0]
    return {
        "seasons": seasons,
        "games": games,
        "plays": plays,
        "players": players,
        "player_usage_metrics": pum,
        "season_aggregates": sa,
        "routes_coverage_pct": (100.0 * routes_nonnull / pum) if pum else 0.0,
    }


def _filters(where: list[str], params: list[Any], *, season: Optional[int], week: Optional[int], team: Optional[str]) -> None:
    if season is not None:
        where.append("p.season = ?")
        params.append(season)
    if week is not None:
        where.append("p.week = ?")
        params.append(week)
    if team:
        where.append("p.posteam = ?")
        params.append(team)


def player_game_receiving(
    conn: sqlite3.Connection,
    *,
    season: Optional[int],
    week: Optional[int],
    team: Optional[str],
    limit: int,
) -> list[dict[str, Any]]:
    where = ["p.receiver_id IS NOT NULL", "TRIM(p.receiver_id) != ''"]
    params: list[Any] = []
    _filters(where, params, season=season, week=week, team=team)

    sql = f"""
      SELECT
        p.season,
        p.week,
        p.posteam AS team,
        p.receiver_id AS player_id,
        COALESCE(pl.player_name, p.receiver_id) AS player_name,
        COALESCE(pl.position, 'UNK') AS position,
        COUNT(*) AS targets,
        SUM(CASE WHEN p.complete_pass = 1 THEN 1 ELSE 0 END) AS receptions,
        ROUND(SUM(CASE WHEN p.complete_pass = 1 THEN COALESCE(p.yards_gained, 0) ELSE 0 END), 0) AS rec_yards,
        ROUND(SUM(CASE WHEN p.complete_pass = 1 THEN COALESCE(p.yards_after_catch, 0) ELSE 0 END), 0) AS yac,
        ROUND(SUM(COALESCE(p.air_yards, 0)), 0) AS air_yards,
        ROUND(SUM(COALESCE(p.epa, 0)) * 1.0 / COUNT(*), 3) AS epa_per_target
      FROM plays p
      LEFT JOIN players pl ON pl.player_id = p.receiver_id
      WHERE {" AND ".join(where)}
      GROUP BY p.season, p.week, p.posteam, p.receiver_id
      ORDER BY targets DESC
      LIMIT ?
    """
    params.append(limit)
    cur = conn.cursor()
    cur.execute(sql, params)
    return dict_rows(cur)


def player_game_rushing(
    conn: sqlite3.Connection,
    *,
    season: Optional[int],
    week: Optional[int],
    team: Optional[str],
    limit: int,
) -> list[dict[str, Any]]:
    where = ["p.rusher_id IS NOT NULL", "TRIM(p.rusher_id) != ''", "p.rush = 1"]
    params: list[Any] = []
    if season is not None:
        where.append("p.season = ?")
        params.append(season)
    if week is not None:
        where.append("p.week = ?")
        params.append(week)
    if team:
        where.append("p.posteam = ?")
        params.append(team)

    sql = f"""
      SELECT
        p.season,
        p.week,
        p.posteam AS team,
        p.rusher_id AS player_id,
        COALESCE(pl.player_name, p.rusher_id) AS player_name,
        COALESCE(pl.position, 'UNK') AS position,
        COUNT(*) AS rush_attempts,
        ROUND(SUM(COALESCE(p.yards_gained, 0)), 0) AS rush_yards,
        ROUND(SUM(COALESCE(p.epa, 0)) * 1.0 / COUNT(*), 3) AS epa_per_rush
      FROM plays p
      LEFT JOIN players pl ON pl.player_id = p.rusher_id
      WHERE {" AND ".join(where)}
      GROUP BY p.season, p.week, p.posteam, p.rusher_id
      ORDER BY rush_yards DESC
      LIMIT ?
    """
    params.append(limit)
    cur = conn.cursor()
    cur.execute(sql, params)
    return dict_rows(cur)


def season_receiving(
    conn: sqlite3.Connection,
    *,
    season: Optional[int],
    team: Optional[str],
    limit: int,
) -> list[dict[str, Any]]:
    where = ["p.receiver_id IS NOT NULL", "TRIM(p.receiver_id) != ''"]
    params: list[Any] = []
    if season is not None:
        where.append("p.season = ?")
        params.append(season)
    if team:
        where.append("p.posteam = ?")
        params.append(team)

    sql = f"""
      WITH agg AS (
        SELECT
          p.season,
          p.posteam AS team,
          p.receiver_id AS player_id,
          COUNT(*) AS targets,
          SUM(CASE WHEN p.complete_pass = 1 THEN 1 ELSE 0 END) AS receptions,
          ROUND(SUM(CASE WHEN p.complete_pass = 1 THEN COALESCE(p.yards_gained, 0) ELSE 0 END), 0) AS rec_yards,
          ROUND(SUM(COALESCE(p.air_yards, 0)), 0) AS air_yards
        FROM plays p
        WHERE {" AND ".join(where)}
        GROUP BY p.season, p.posteam, p.receiver_id
      ),
      team_den AS (
        SELECT season, team, SUM(targets) AS team_targets
        FROM agg
        GROUP BY season, team
      )
      SELECT
        a.season,
        a.team,
        a.player_id,
        COALESCE(pl.player_name, a.player_id) AS player_name,
        COALESCE(pl.position, 'UNK') AS position,
        a.targets,
        a.receptions,
        a.rec_yards,
        a.air_yards,
        ROUND(a.targets * 1.0 / NULLIF(d.team_targets, 0), 4) AS team_target_share
      FROM agg a
      JOIN team_den d ON d.season = a.season AND d.team = a.team
      LEFT JOIN players pl ON pl.player_id = a.player_id
      ORDER BY a.targets DESC
      LIMIT ?
    """
    params.append(limit)
    cur = conn.cursor()
    cur.execute(sql, params)
    return dict_rows(cur)


def season_rushing(
    conn: sqlite3.Connection,
    *,
    season: Optional[int],
    team: Optional[str],
    limit: int,
) -> list[dict[str, Any]]:
    where = ["p.rusher_id IS NOT NULL", "TRIM(p.rusher_id) != ''", "p.rush = 1"]
    params: list[Any] = []
    if season is not None:
        where.append("p.season = ?")
        params.append(season)
    if team:
        where.append("p.posteam = ?")
        params.append(team)

    sql = f"""
      WITH agg AS (
        SELECT
          p.season,
          p.posteam AS team,
          p.rusher_id AS player_id,
          COUNT(*) AS rush_attempts,
          ROUND(SUM(COALESCE(p.yards_gained, 0)), 0) AS rush_yards
        FROM plays p
        WHERE {" AND ".join(where)}
        GROUP BY p.season, p.posteam, p.rusher_id
      ),
      team_den AS (
        SELECT season, team, SUM(rush_attempts) AS team_rush_attempts
        FROM agg
        GROUP BY season, team
      )
      SELECT
        a.season,
        a.team,
        a.player_id,
        COALESCE(pl.player_name, a.player_id) AS player_name,
        COALESCE(pl.position, 'UNK') AS position,
        a.rush_attempts,
        a.rush_yards,
        ROUND(a.rush_attempts * 1.0 / NULLIF(d.team_rush_attempts, 0), 4) AS team_rush_share
      FROM agg a
      JOIN team_den d ON d.season = a.season AND d.team = a.team
      LEFT JOIN players pl ON pl.player_id = a.player_id
      ORDER BY a.rush_yards DESC
      LIMIT ?
    """
    params.append(limit)
    cur = conn.cursor()
    cur.execute(sql, params)
    return dict_rows(cur)


def team_game_summary(
    conn: sqlite3.Connection,
    *,
    season: Optional[int],
    week: Optional[int],
    team: Optional[str],
    limit: int,
) -> list[dict[str, Any]]:
    where = ["g.game_id IS NOT NULL"]
    params: list[Any] = []
    if season is not None:
        where.append("g.season = ?")
        params.append(season)
    if week is not None:
        where.append("g.week = ?")
        params.append(week)
    if team:
        where.append("(g.home_team = ? OR g.away_team = ?)")
        params.extend([team, team])

    sql = f"""
      SELECT
        g.season,
        g.week,
        g.game_id,
        g.gameday,
        g.home_team,
        g.away_team,
        SUM(CASE WHEN p.posteam = g.home_team AND p.pass = 1 THEN 1 ELSE 0 END) AS home_pass_attempts,
        SUM(CASE WHEN p.posteam = g.away_team AND p.pass = 1 THEN 1 ELSE 0 END) AS away_pass_attempts,
        SUM(CASE WHEN p.posteam = g.home_team AND p.rush = 1 THEN 1 ELSE 0 END) AS home_rush_attempts,
        SUM(CASE WHEN p.posteam = g.away_team AND p.rush = 1 THEN 1 ELSE 0 END) AS away_rush_attempts
      FROM games g
      LEFT JOIN plays p ON p.game_id = g.game_id
      WHERE {" AND ".join(where)}
      GROUP BY g.game_id
      ORDER BY g.season DESC, g.week DESC
      LIMIT ?
    """
    params.append(limit)
    cur = conn.cursor()
    cur.execute(sql, params)
    return dict_rows(cur)


