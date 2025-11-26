import React, { useState, useEffect, useMemo } from 'react';
import Button from './ui/Button';
import { ArrowLeft, Plus, PenTool, Trophy } from 'lucide-react';
import CreateScribble from './CreateScribble';
import PlayScribble from './PlayScribble';
import { useAuth } from '@/context/AuthContext';

interface ScribbleModeProps {
    onBack: () => void;
}

interface ScribbleSummary {
    id: string;
    creatorName: string | null;
    creatorId: string | null;
    createdAt: string;
    points: string;
    _count: {
        attempts: number;
    };
}

export default function ScribbleMode({ onBack }: ScribbleModeProps) {
    const { user } = useAuth();
    const [view, setView] = useState<'list' | 'create' | 'play' | 'edit'>('list');
    const [selectedScribbleId, setSelectedScribbleId] = useState<string | null>(null);
    const [editingScribble, setEditingScribble] = useState<ScribbleSummary | null>(null);
    const [scribbles, setScribbles] = useState<ScribbleSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [reportingId, setReportingId] = useState<string | null>(null);
    const [reportMessage, setReportMessage] = useState<string | null>(null);

    const parsedEditingPoints = useMemo(() => {
        if (!editingScribble) return [];
        try {
            return JSON.parse(editingScribble.points) as Array<{ x: number; y: number }>;
        } catch {
            return [];
        }
    }, [editingScribble]);

    const fetchScribbles = React.useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/scribbles');
            if (res.ok) {
                const data = await res.json();
                setScribbles(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (view === 'list') {
            fetchScribbles();
        }
    }, [fetchScribbles, view]);

    const canEditScribble = (scribble: ScribbleSummary) => {
        if (!user?.id || scribble.creatorId !== user.id) return false;
        const created = new Date(scribble.createdAt).getTime();
        return Date.now() - created <= 15 * 60 * 1000;
    };

    const handleDelete = async (scribble: ScribbleSummary) => {
        if (!user?.id || scribble.creatorId !== user.id) return;
        const confirmDelete = window.confirm('Delete this scribble? This cannot be undone.');
        if (!confirmDelete) return;
        try {
            const res = await fetch(`/api/scribbles/${scribble.id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id })
            });
            if (res.ok) {
                setScribbles((prev) => prev.filter((s) => s.id !== scribble.id));
            } else {
                alert('Failed to delete scribble.');
            }
        } catch (e) {
            alert('Failed to delete scribble.');
        }
    };

    const handleReport = async (scribbleId: string) => {
        setReportingId(scribbleId);
        setReportMessage(null);
        try {
            const res = await fetch(`/api/scribbles/${scribbleId}/report`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user?.id,
                    userName: user?.username || 'Guest'
                })
            });
            if (!res.ok) throw new Error('Failed to report');
            setReportMessage('Report received. Thanks for keeping Scribble clean.');
        } catch {
            setReportMessage('Could not send report right now. Please try again soon.');
        } finally {
            setReportingId(null);
        }
    };

    if (view === 'create') {
        return <CreateScribble onBack={() => setView('list')} />;
    }

    if (view === 'edit' && editingScribble) {
        return (
            <CreateScribble
                onBack={() => {
                    setView('list');
                    setEditingScribble(null);
                }}
                scribbleId={editingScribble.id}
                initialPoints={parsedEditingPoints}
                createdAt={editingScribble.createdAt}
                onSaved={() => {
                    setView('list');
                    setEditingScribble(null);
                    fetchScribbles();
                }}
            />
        );
    }

    if (view === 'play' && selectedScribbleId) {
        return (
            <PlayScribble
                scribbleId={selectedScribbleId}
                onBack={() => {
                    setSelectedScribbleId(null);
                    setView('list');
                }}
            />
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-8">
            <div className="flex justify-between items-center">
                <div className="space-y-1">
                    <h2 className="text-3xl font-bold tracking-tight">Scribble Mode</h2>
                    <p className="text-muted-foreground">Draw curves or match others&apos; scribbles!</p>
                    <p className="text-xs text-destructive">No inappropriate scribbles. Reports may remove offending drawings.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="ghost" onClick={onBack} className="gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Menu
                    </Button>
                    <Button onClick={() => setView('create')} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Create New
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-32 rounded-xl border bg-card animate-pulse" />
                    ))}
                </div>
            ) : scribbles.length === 0 ? (
                <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed">
                    <PenTool className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold">No scribbles yet</h3>
                    <p className="text-muted-foreground mb-4">Be the first to create one!</p>
                    <Button onClick={() => setView('create')}>Create Scribble</Button>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {scribbles.map((scribble) => (
                        <div
                            key={scribble.id}
                            onClick={() => {
                                setSelectedScribbleId(scribble.id);
                                setView('play');
                            }}
                            className="group cursor-pointer rounded-xl border bg-card p-5 shadow-sm transition-all hover:shadow-md hover:border-primary/50"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2 rounded-full bg-primary/10 text-primary">
                                    <PenTool className="h-5 w-5" />
                                </div>
                                <span className="text-xs text-muted-foreground">
                                    {new Date(scribble.createdAt).toLocaleDateString()}
                                </span>
                            </div>

                            <h3 className="font-bold text-lg mb-1">Scribble #{scribble.id.slice(-4)}</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                by {scribble.creatorName || 'Anonymous'}
                            </p>

                            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground bg-secondary/50 p-2 rounded-md w-fit">
                                <Trophy className="h-3.5 w-3.5" />
                                {scribble._count.attempts} attempts
                            </div>

                            {user?.id === scribble.creatorId && (
                                <div className="mt-3 flex gap-2">
                                    {canEditScribble(scribble) && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setEditingScribble(scribble);
                                                setView('edit');
                                            }}
                                        >
                                            Edit (15 min window)
                                        </Button>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-destructive hover:text-destructive"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            void handleDelete(scribble);
                                        }}
                                    >
                                        Delete
                                    </Button>
                                </div>
                            )}
                            <div className="mt-2 flex justify-end">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        void handleReport(scribble.id);
                                    }}
                                    disabled={reportingId === scribble.id}
                                    className="text-destructive hover:text-destructive"
                                >
                                    {reportingId === scribble.id ? 'Reporting...' : 'Report'}
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {reportMessage && (
                <div className="rounded-lg border bg-muted/50 p-3 text-xs text-muted-foreground">
                    {reportMessage}
                </div>
            )}
        </div>
    );
}
