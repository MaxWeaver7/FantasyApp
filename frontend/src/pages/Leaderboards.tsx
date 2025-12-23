import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useFilterOptions } from "@/hooks/useApi";

type Mode = "weekly" | "season";
type Category = "receiving" | "rushing";

type Row = Record<string, any>;

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export default function Leaderboards() {
  const { data: options } = useFilterOptions();

  const [mode, setMode] = useState<Mode>("weekly");
  const [category, setCategory] = useState<Category>("receiving");
  const [season, setSeason] = useState<number>(options?.seasons?.[0] || 2024);
  const [week, setWeek] = useState<number>(options?.weeks?.[0] || 1);
  const [team, setTeam] = useState<string>("");

  const endpoint = useMemo(() => {
    const base = new URLSearchParams();
    base.set("season", String(season));
    if (team) base.set("team", team);
    base.set("limit", "50");
    if (mode === "weekly") base.set("week", String(week));

    if (category === "receiving") {
      return mode === "weekly"
        ? `/api/receiving_dashboard?${base.toString()}`
        : `/api/receiving_season?${base.toString()}`;
    }
    return mode === "weekly"
      ? `/api/rushing_dashboard?${base.toString()}`
      : `/api/rushing_season?${base.toString()}`;
  }, [mode, category, season, week, team]);

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // lightweight fetch-on-change (keeps this page isolated from react-query setup)
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErr(null);
    fetchJson<{ rows: Row[] }>(endpoint)
      .then((data) => {
        if (cancelled) return;
        setRows(data.rows || []);
      })
      .catch((e) => {
        if (cancelled) return;
        setErr(String(e?.message || e));
        setRows([]);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [endpoint]);

  const title =
    mode === "weekly"
      ? `Weekly Leaders • Week ${week} • ${season}`
      : `Season Leaders • ${season}`;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8 space-y-6">
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-start justify-between gap-4 flex-col md:flex-row">
            <div>
              <h2 className="text-xl font-semibold text-foreground">{title}</h2>
              <p className="text-sm text-muted-foreground">
                Leaderboards powered by your FantasyAppTest database (plays + derived metrics).
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 w-full md:w-auto">
              <Select value={mode} onValueChange={(v) => setMode(v as Mode)}>
                <SelectTrigger><SelectValue placeholder="Mode" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="season">Season</SelectItem>
                </SelectContent>
              </Select>

              <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
                <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="receiving">Receiving</SelectItem>
                  <SelectItem value="rushing">Rushing</SelectItem>
                </SelectContent>
              </Select>

              <Select value={String(season)} onValueChange={(v) => setSeason(Number(v))}>
                <SelectTrigger><SelectValue placeholder="Season" /></SelectTrigger>
                <SelectContent>
                  {options?.seasons?.map((s) => (
                    <SelectItem key={s} value={String(s)}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {mode === "weekly" ? (
                <Select value={String(week)} onValueChange={(v) => setWeek(Number(v))}>
                  <SelectTrigger><SelectValue placeholder="Week" /></SelectTrigger>
                  <SelectContent>
                    {options?.weeks?.map((w) => (
                      <SelectItem key={w} value={String(w)}>Week {w}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="hidden lg:block" />
              )}

              <Select value={team || "ALL"} onValueChange={(v) => setTeam(v === "ALL" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Team" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Teams</SelectItem>
                  {options?.teams?.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {loading ? "Loading..." : `${rows.length} rows`}
              {err ? ` • Error: ${err}` : ""}
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground font-medium">Player</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Team</TableHead>
                  {category === "receiving" ? (
                    <>
                      <TableHead className="text-muted-foreground font-medium text-center">TGT</TableHead>
                      <TableHead className="text-muted-foreground font-medium text-center">REC</TableHead>
                      <TableHead className="text-muted-foreground font-medium text-center">YDS</TableHead>
                      {mode === "weekly" ? (
                        <>
                          <TableHead className="text-muted-foreground font-medium text-center">AIR</TableHead>
                          <TableHead className="text-muted-foreground font-medium text-center">YAC</TableHead>
                          <TableHead className="text-muted-foreground font-medium text-center">EPA/TGT</TableHead>
                        </>
                      ) : (
                        <TableHead className="text-muted-foreground font-medium text-center">TGT%</TableHead>
                      )}
                    </>
                  ) : (
                    <>
                      <TableHead className="text-muted-foreground font-medium text-center">ATT</TableHead>
                      <TableHead className="text-muted-foreground font-medium text-center">YDS</TableHead>
                      {mode === "weekly" ? (
                        <TableHead className="text-muted-foreground font-medium text-center">EPA/R</TableHead>
                      ) : (
                        <TableHead className="text-muted-foreground font-medium text-center">ATT%</TableHead>
                      )}
                    </>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r, i) => (
                  <TableRow key={i} className="data-row border-border">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full overflow-hidden bg-secondary ring-1 ring-border shrink-0">
                          {r.photoUrl ? (
                            <img src={r.photoUrl} className="w-full h-full object-cover" loading="lazy" />
                          ) : null}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate">{r.player_name || r.player_id}</div>
                          <div className="text-xs text-muted-foreground">{r.position || ""}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{r.team}</TableCell>

                    {category === "receiving" ? (
                      <>
                        <TableCell className="text-center font-mono">{r.targets ?? r.targets}</TableCell>
                        <TableCell className="text-center font-mono">{r.receptions ?? r.receptions}</TableCell>
                        <TableCell className="text-center font-mono font-semibold">{r.rec_yards ?? r.rec_yards}</TableCell>
                        {mode === "weekly" ? (
                          <>
                            <TableCell className="text-center font-mono">{r.air_yards ?? 0}</TableCell>
                            <TableCell className="text-center font-mono">{r.yac ?? 0}</TableCell>
                            <TableCell className="text-center font-mono">{typeof r.epa_per_target === "number" ? r.epa_per_target.toFixed(2) : "—"}</TableCell>
                          </>
                        ) : (
                          <TableCell className="text-center font-mono">{typeof r.team_target_share === "number" ? `${(r.team_target_share * 100).toFixed(1)}%` : "—"}</TableCell>
                        )}
                      </>
                    ) : (
                      <>
                        <TableCell className="text-center font-mono">{r.rush_attempts ?? r.rush_attempts}</TableCell>
                        <TableCell className="text-center font-mono font-semibold">{r.rush_yards ?? r.rush_yards}</TableCell>
                        {mode === "weekly" ? (
                          <TableCell className="text-center font-mono">{typeof r.epa_per_rush === "number" ? r.epa_per_rush.toFixed(2) : "—"}</TableCell>
                        ) : (
                          <TableCell className="text-center font-mono">{typeof r.team_rush_share === "number" ? `${(r.team_rush_share * 100).toFixed(1)}%` : "—"}</TableCell>
                        )}
                      </>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </main>
    </div>
  );
}


