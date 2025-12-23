import { useState, useMemo } from "react";
import { Header } from "@/components/Header";
import { PlayerCard } from "@/components/PlayerCard";
import { SeasonSummary } from "@/components/SeasonSummary";
import { AdvancedStatsTable } from "@/components/AdvancedStatsTable";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFilterOptions, usePlayers, usePlayerDetail } from "@/hooks/useApi";
import { Player } from "@/types/player";

const Index = () => {
  const { data: options } = useFilterOptions();
  const [selectedSeason, setSelectedSeason] = useState<number>(options?.seasons[0] || 2024);
  const [selectedPosition, setSelectedPosition] = useState<string>('');
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  const { data: playersData, isLoading: playersLoading, refetch } = usePlayers(
    selectedSeason,
    selectedPosition || undefined,
    selectedTeam || undefined
  );

  const { data: playerDetail, isLoading: detailLoading } = usePlayerDetail(
    selectedPlayer?.player_id || '',
    selectedSeason
  );

  const players = useMemo(() => playersData?.players || [], [playersData]);

  // Auto-select first player when list changes
  useMemo(() => {
    if (players.length > 0 && !selectedPlayer) {
      setSelectedPlayer(players[0]);
    }
  }, [players, selectedPlayer]);

  const handleRefresh = () => {
    refetch();
  };

  const currentPlayer = playerDetail?.player || selectedPlayer;
  const gameLogs = playerDetail?.gameLogs || [];

  return (
    <div className="min-h-screen bg-background">
      <Header onRefresh={handleRefresh} isRefreshing={playersLoading} />
      
      <main className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="glass-card rounded-xl p-4 mb-6 opacity-0 animate-slide-up">
          <h3 className="font-medium text-foreground mb-3">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Season</label>
              <Select value={selectedSeason.toString()} onValueChange={(value: string) => setSelectedSeason(Number(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select season" />
                </SelectTrigger>
                <SelectContent>
                  {options?.seasons.map(season => (
                    <SelectItem key={season} value={season.toString()}>{season}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Position</label>
              <Select value={selectedPosition || "ALL"} onValueChange={(val) => setSelectedPosition(val === "ALL" ? "" : val)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Positions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Positions</SelectItem>
                  <SelectItem value="WR">WR - Wide Receiver</SelectItem>
                  <SelectItem value="RB">RB - Running Back</SelectItem>
                  <SelectItem value="TE">TE - Tight End</SelectItem>
                  <SelectItem value="QB">QB - Quarterback</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Team</label>
              <Select value={selectedTeam || "ALL"} onValueChange={(val) => setSelectedTeam(val === "ALL" ? "" : val)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Teams" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Teams</SelectItem>
                  {options?.teams.map(team => (
                    <SelectItem key={team} value={team}>{team}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Player List Sidebar */}
          <div className="lg:col-span-4 space-y-4">
            <div className="opacity-0 animate-fade-in">
              <h2 className="text-lg font-semibold text-foreground mb-1">Players</h2>
              <p className="text-sm text-muted-foreground mb-4">
                {playersLoading ? 'Loading players...' : `${players.length} players found`}
              </p>
            </div>
            
            <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
              {players.map((player, idx) => (
                <PlayerCard
                  key={player.player_id}
                  player={player}
                  isSelected={selectedPlayer?.player_id === player.player_id}
                  onClick={() => setSelectedPlayer(player)}
                  delay={100 + idx * 50}
                />
              ))}
              
              {!playersLoading && players.length === 0 && (
                <div className="glass-card rounded-xl p-8 text-center">
                  <p className="text-muted-foreground">No players found for the selected filters.</p>
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-8 space-y-6">
            {currentPlayer ? (
              <>
                <SeasonSummary player={currentPlayer} />
                
                {gameLogs.length > 0 ? (
                  <AdvancedStatsTable gameLogs={gameLogs} position={currentPlayer.position || 'RB'} />
                ) : (
                  <div className="glass-card rounded-xl p-8 text-center opacity-0 animate-slide-up" style={{ animationDelay: '400ms' }}>
                    <p className="text-muted-foreground">
                      {detailLoading ? 'Loading game logs...' : 'No game logs available for this player and season.'}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="glass-card rounded-xl p-12 text-center opacity-0 animate-fade-in">
                <p className="text-muted-foreground">Select a player to view detailed metrics</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-12 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Data sourced from nflfastR • Built for Fantasy Analytics</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;

