import React, { useState, useEffect, useCallback } from 'react';
import Button from './ui/Button';
import Input from './ui/Input';
import Modal from './ui/Modal';
import { Search, Clock, Trash2, Edit, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface Level {
    id: string;
    name: string;
    creatorName: string | null;
    difficulty: string;
    isTimed: boolean;
    timeLimit: number | null;
    visibility: 'PUBLIC' | 'UNLISTED' | 'DRAFT' | 'PRIVATE';
    reports: number;
}

interface ScribbleSummary {
    id: string;
    createdAt: string;
    _count: { attempts: number };
}

interface YourLevelsModeProps {
    onPlay: (levelId: string) => void;
    onBack: () => void;
}

export default function YourLevelsMode({ onPlay, onBack }: YourLevelsModeProps) {
    const { user } = useAuth();
    const [levels, setLevels] = useState<Level[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [editingLevel, setEditingLevel] = useState<Level | null>(null);
    const [editName, setEditName] = useState('');
    const [editVisibility, setEditVisibility] = useState<Level['visibility']>('PUBLIC');
    const [scribbles, setScribbles] = useState<ScribbleSummary[]>([]);
    const [scribbleLoading, setScribbleLoading] = useState(false);

    const fetchLevels = useCallback(async (searchQuery = '') => {
        if (!user) return;
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (searchQuery) params.set('search', searchQuery);
            params.set('creatorId', user.id);

            const res = await fetch(`/api/levels?${params.toString()}`);
            if (!res.ok) throw new Error('Failed to fetch levels');

            const data = await res.json();
            setLevels(data);
        } catch (err) {
            setError('Could not load your levels.');
        } finally {
            setLoading(false);
        }
    }, [user]);

    const fetchScribbles = useCallback(async () => {
        if (!user) return;
        setScribbleLoading(true);
        try {
            const res = await fetch(`/api/scribbles?creatorId=${user.id}&limit=50`);
            if (!res.ok) throw new Error('Failed to fetch scribbles');
            const data = await res.json();
            setScribbles(data);
        } catch (err) {
            // best effort; leave scribbles empty on error
        } finally {
            setScribbleLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            fetchLevels();
            fetchScribbles();
        }
    }, [fetchLevels, fetchScribbles, user]);

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this level? This cannot be undone.')) return;

        try {
            const res = await fetch(`/api/levels/${id}`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error('Failed to delete');

            setLevels(levels.filter(l => l.id !== id));
        } catch (err) {
            alert('Failed to delete level.');
        }
    };

    const handleEditClick = (e: React.MouseEvent, level: Level) => {
        e.stopPropagation();
        setEditingLevel(level);
        setEditName(level.name);
        setEditVisibility(level.visibility);
    };

    const handleSaveEdit = async () => {
        if (!editingLevel) return;

        try {
            const res = await fetch(`/api/levels/${editingLevel.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: editName,
                    visibility: editVisibility
                }),
            });

            if (!res.ok) throw new Error('Failed to update');

            const updated = await res.json();
            setLevels(levels.map(l => l.id === updated.id ? { ...l, ...updated } : l));
            setEditingLevel(null);
        } catch (err) {
            alert('Failed to update level.');
        }
    };

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
                <p className="text-muted-foreground">You must be logged in to view your levels.</p>
                <Button onClick={onBack}>Go Back</Button>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-8">
            <div className="flex justify-between items-center">
                <div className="space-y-1">
                    <h2 className="text-3xl font-bold tracking-tight">Your Levels</h2>
                    <p className="text-muted-foreground">Manage and edit the levels you&apos;ve created.</p>
                </div>
                <Button variant="ghost" onClick={onBack} className="gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Menu
                </Button>
            </div>

            <div className="flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="text"
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            fetchLevels(e.target.value);
                        }}
                        placeholder="Search your levels..."
                        className="pl-9"
                    />
                </div>
            </div>

            {loading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-40 rounded-xl border bg-card animate-pulse" />
                    ))}
                </div>
            ) : error ? (
                <div className="text-center py-12 text-destructive">{error}</div>
            ) : levels.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                    You haven&apos;t created any levels yet.
                    <br />
                    <Button variant="link" onClick={() => window.location.href = '/create'}>Create one now!</Button>
                </div>
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
                                    <span className={`shrink-0 text-[10px] px-2 py-1 rounded-full uppercase font-bold tracking-wider
                                        ${level.visibility === 'PUBLIC' ? 'bg-green-500/10 text-green-600' :
                                            level.visibility === 'UNLISTED' ? 'bg-yellow-500/10 text-yellow-600' :
                                                'bg-slate-500/10 text-slate-600'}`}
                                    >
                                        {level.visibility}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${level.difficulty === 'very easy' ? 'border-green-200 text-green-700' :
                                            level.difficulty === 'easy' ? 'border-emerald-200 text-emerald-700' :
                                                level.difficulty === 'medium' ? 'border-yellow-200 text-yellow-700' :
                                                    'border-red-200 text-red-700'
                                        }`}>
                                        {level.difficulty}
                                    </span>
                                    {level.isTimed && (
                                        <span className="flex items-center gap-1 text-xs">
                                            <Clock className="h-3 w-3" />
                                            {Math.floor((level.timeLimit || 0) / 60)}:{(level.timeLimit || 0) % 60 < 10 ? '0' : ''}{(level.timeLimit || 0) % 60}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="mt-4 flex items-center justify-end gap-2 pt-4 border-t">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => handleEditClick(e, level)}
                                    className="h-8 px-2 text-muted-foreground hover:text-primary"
                                >
                                    <Edit className="h-4 w-4 mr-1" />
                                    Edit
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => handleDelete(e, level.id)}
                                    className="h-8 px-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                >
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Delete
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="mt-10 space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold">Your Scribbles</h3>
                    <Button variant="outline" size="sm" onClick={() => window.location.href = '/scribble'}>
                        Open Scribble Hub
                    </Button>
                </div>
                {scribbleLoading ? (
                    <p className="text-sm text-muted-foreground">Loading your scribbles…</p>
                ) : scribbles.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No scribbles yet. Create one from the Scribble tab.</p>
                ) : (
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                        {scribbles.map((scribble) => (
                            <div key={scribble.id} className="rounded-lg border bg-card p-4 shadow-sm">
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span>Scribble #{scribble.id.slice(-4)}</span>
                                    <span>{new Date(scribble.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div className="mt-2 text-sm">Attempts: {scribble._count?.attempts ?? 0}</div>
                                <Button
                                    className="mt-3 w-full"
                                    variant="secondary"
                                    onClick={() => (window.location.href = '/scribble')}
                                >
                                    Go to Scribble
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <Modal
                isOpen={!!editingLevel}
                onClose={() => setEditingLevel(null)}
                title="Edit Level"
            >
                <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Level Name</label>
                        <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="My Awesome Level"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Visibility</label>
                        <div className="grid grid-cols-3 gap-2">
                            {(['PUBLIC', 'UNLISTED', 'DRAFT'] as const).map((v) => (
                                <button
                                    key={v}
                                    type="button"
                                    onClick={() => setEditVisibility(v)}
                                    className={`flex flex-col items-center justify-center gap-2 rounded-lg border p-3 text-sm transition-all ${editVisibility === v
                                            ? 'border-primary bg-primary/5 text-primary'
                                            : 'hover:bg-accent hover:text-accent-foreground'
                                        }`}
                                >
                                    {v === 'PUBLIC' && <Eye className="h-4 w-4" />}
                                    {v === 'UNLISTED' && <EyeOff className="h-4 w-4" />}
                                    {v === 'DRAFT' && <Edit className="h-4 w-4" />}
                                    <span className="font-medium capitalize">{v.toLowerCase()}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="ghost" onClick={() => setEditingLevel(null)}>Cancel</Button>
                        <Button onClick={handleSaveEdit}>Save Changes</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
