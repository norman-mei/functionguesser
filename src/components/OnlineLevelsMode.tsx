import React, { useState, useEffect } from 'react';
import Button from './ui/Button';
import Input from './ui/Input';
import { Search, Flag, Clock, User, ArrowLeft, Star } from 'lucide-react';

interface Level {
  id: string;
  name: string;
  creatorName: string | null;
  difficulty: string;
  isTimed: boolean;
  timeLimit: number | null;
  reports: number;
  createdAt: string;
  avgRating: number | null;
  ratingCount: number;
}

interface OnlineLevelsModeProps {
  onPlay: (levelId: string) => void;
  onBack: () => void;
}

export default function OnlineLevelsMode({ onPlay, onBack }: OnlineLevelsModeProps) {
  const [levels, setLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'newest' | 'popular'>('newest');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetchLevels(search, sort);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchLevels = async (searchQuery = '', sortBy = sort) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      if (sortBy) params.set('sort', sortBy);

      const res = await fetch(`/api/levels?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch levels');

      const data = await res.json();
      setLevels(data);
    } catch (err) {
      setError('Could not load levels. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    void fetchLevels(search, sort);
  };

  const handleSort = (nextSort: 'newest' | 'popular') => {
    setSort(nextSort);
    void fetchLevels(search, nextSort);
  };

  const handleReport = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to report this level?')) return;

    try {
      await fetch(`/api/levels/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'report' })
      });
      alert('Level reported. Thank you.');
    } catch (err) {
      alert('Failed to report level.');
    }
  };

  const renderStars = (avg: number | null) => {
    const val = Math.round(avg ?? 0);
    return (
      <div className="flex items-center gap-1 text-amber-400">
        {[1, 2, 3, 4, 5].map((n) => (
          <Star key={n} className={`h-3.5 w-3.5 ${n <= val ? 'fill-amber-400' : 'stroke-[var(--border)]'}`} />
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">Online Levels</h2>
          <p className="text-muted-foreground">Play levels created by the community.</p>
        </div>
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Menu
        </Button>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search levels or creators..."
              className="pl-9"
            />
          </div>
          <Button type="submit">Search</Button>
        </form>

        <div className="flex gap-2">
          <Button
            variant={sort === 'newest' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSort('newest')}
          >
            Newest
          </Button>
          <Button
            variant={sort === 'popular' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSort('popular')}
          >
            Most popular
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-40 rounded-xl border bg-card animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12 text-destructive">{error}</div>
      ) : levels.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No levels found.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {levels.map((level) => (
            <div
              key={level.id}
              onClick={() => onPlay(level.id)}
              className="group relative flex flex-col justify-between rounded-xl border bg-card p-5 shadow-sm transition-all hover:shadow-md hover:border-primary/50 cursor-pointer"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <h3 className="font-bold text-lg leading-tight truncate">{level.name}</h3>
                  <span
                    className={`shrink-0 text-[10px] px-2 py-1 rounded-full uppercase font-bold tracking-wider
                                        ${
                                          level.difficulty === 'very easy'
                                            ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                                            : level.difficulty === 'easy'
                                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                              : level.difficulty === 'medium'
                                                ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
                                                : level.difficulty === 'hard'
                                                  ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400'
                                                  : 'bg-red-500/10 text-red-600 dark:text-red-400'
                                        }`}
                  >
                    {level.difficulty}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5" />
                    <span>{level.creatorName || 'Anonymous'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {renderStars(level.avgRating)}
                    <span className="text-[11px] text-muted-foreground">({level.ratingCount})</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  {level.isTimed ? (
                    <>
                      <Clock className="h-3.5 w-3.5" />
                      <span>
                        {Math.floor((level.timeLimit || 0) / 60)}:
                        {(level.timeLimit || 0) % 60 < 10 ? '0' : ''}
                        {(level.timeLimit || 0) % 60}
                      </span>
                    </>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground">
                      Untimed
                    </span>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={(e) => handleReport(e, level.id)}
                  title="Report Level"
                >
                  <Flag className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 text-center text-xs text-muted-foreground">
        Disclaimer: Online levels are user-generated. Play at your own risk.
      </div>
    </div>
  );
}
