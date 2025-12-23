import { PlayerGameLog } from "@/types/player";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface AdvancedStatsTableProps {
  gameLogs: PlayerGameLog[];
  position: string;
}

export function AdvancedStatsTable({ gameLogs, position }: AdvancedStatsTableProps) {
  const isReceiver = ['WR', 'TE'].includes(position);

  const getStatHighlight = (value: number, thresholds: { high: number; low: number }) => {
    if (value >= thresholds.high) return 'text-primary font-semibold';
    if (value <= thresholds.low) return 'text-destructive';
    return '';
  };

  const fmt = (v: number | null | undefined, digits = 2) => {
    if (v === null || v === undefined || Number.isNaN(v)) return '—';
    return v.toFixed(digits);
  };

  return (
    <div className="glass-card rounded-xl overflow-hidden opacity-0 animate-slide-up" style={{ animationDelay: '300ms' }}>
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-foreground">Game-by-Game {isReceiver ? 'Receiving' : 'Rushing'} Stats</h3>
        <p className="text-sm text-muted-foreground">Season {gameLogs[0]?.season || 'N/A'}</p>
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground font-medium">Week</TableHead>
              <TableHead className="text-muted-foreground font-medium">OPP</TableHead>
              {isReceiver ? (
                <>
                  <TableHead className="text-muted-foreground font-medium text-center">TGT</TableHead>
                  <TableHead className="text-muted-foreground font-medium text-center">REC</TableHead>
                  <TableHead className="text-muted-foreground font-medium text-center">YDS</TableHead>
                  <TableHead className="text-muted-foreground font-medium text-center bg-primary/10">AIR YDS</TableHead>
                  <TableHead className="text-muted-foreground font-medium text-center bg-primary/10">YAC</TableHead>
                  <TableHead className="text-muted-foreground font-medium text-center">TD</TableHead>
                  <TableHead className="text-muted-foreground font-medium text-center">EPA/TGT</TableHead>
                </>
              ) : (
                <>
                  <TableHead className="text-muted-foreground font-medium text-center">ATT</TableHead>
                  <TableHead className="text-muted-foreground font-medium text-center">YDS</TableHead>
                  <TableHead className="text-muted-foreground font-medium text-center">TD</TableHead>
                  <TableHead className="text-muted-foreground font-medium text-center">YPC</TableHead>
                  <TableHead className="text-muted-foreground font-medium text-center">EPA/RUSH</TableHead>
                  <TableHead className="text-muted-foreground font-medium text-center bg-primary/10">REC</TableHead>
                  <TableHead className="text-muted-foreground font-medium text-center bg-primary/10">REC YDS</TableHead>
                </>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {gameLogs.map((game, idx) => {
              const opponent = game.location === 'away' ? `@ ${game.opponent}` : `vs ${game.opponent}`;
              const ypc = isReceiver 
                ? (game.receptions > 0 ? (game.rec_yards / game.receptions) : 0)
                : (game.rush_attempts > 0 ? (game.rush_yards / game.rush_attempts) : 0);

              return (
                <TableRow 
                  key={idx} 
                  className="data-row border-border"
                >
                  <TableCell className="font-mono text-sm">
                    {game.week}
                  </TableCell>
                  <TableCell className="font-medium">
                    {opponent}
                  </TableCell>
                  {isReceiver ? (
                    <>
                      <TableCell className="text-center font-mono">{game.targets}</TableCell>
                      <TableCell className="text-center font-mono">{game.receptions}</TableCell>
                      <TableCell className={cn("text-center font-mono font-semibold", getStatHighlight(game.rec_yards, { high: 80, low: 30 }))}>
                        {game.rec_yards}
                      </TableCell>
                      <TableCell className="text-center font-mono bg-primary/5">{game.air_yards}</TableCell>
                      <TableCell className={cn("text-center font-mono bg-primary/5", getStatHighlight(game.yac, { high: 20, low: 5 }))}>
                        {game.yac}
                      </TableCell>
                      <TableCell className="text-center font-mono">{game.rec_tds}</TableCell>
                      <TableCell className={cn("text-center font-mono", getStatHighlight(game.epa_per_target ?? 0, { high: 0.3, low: -0.1 }))}>
                        {fmt(game.epa_per_target)}
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell className="text-center font-mono">{game.rush_attempts}</TableCell>
                      <TableCell className={cn("text-center font-mono font-semibold", getStatHighlight(game.rush_yards, { high: 80, low: 30 }))}>
                        {game.rush_yards}
                      </TableCell>
                      <TableCell className="text-center font-mono">{game.rush_tds}</TableCell>
                      <TableCell className={cn("text-center font-mono", getStatHighlight(ypc, { high: 5, low: 3 }))}>
                        {ypc.toFixed(1)}
                      </TableCell>
                      <TableCell className={cn("text-center font-mono", getStatHighlight(game.epa_per_rush ?? 0, { high: 0.2, low: -0.1 }))}>
                        {fmt(game.epa_per_rush)}
                      </TableCell>
                      <TableCell className="text-center font-mono bg-primary/5">{game.receptions}</TableCell>
                      <TableCell className="text-center font-mono bg-primary/5">{game.rec_yards}</TableCell>
                    </>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

