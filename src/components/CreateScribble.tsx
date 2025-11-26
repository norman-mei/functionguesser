import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Button from './ui/Button';
import { ArrowLeft, Save, Trash2, Undo } from 'lucide-react';
import GraphingCalculator from './GraphingCalculator';

interface CreateScribbleProps {
    onBack: () => void;
    scribbleId?: string;
    initialPoints?: { x: number; y: number }[];
    createdAt?: string;
    onSaved?: () => void;
}

export default function CreateScribble({ onBack, scribbleId, initialPoints, createdAt, onSaved }: CreateScribbleProps) {
    const { user } = useAuth();
    const [points, setPoints] = useState<{ x: number; y: number }[]>(initialPoints ?? []);
    const [isDrawing, setIsDrawing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [history, setHistory] = useState<{ x: number; y: number }[][]>([]);
    const [redoStack, setRedoStack] = useState<{ x: number; y: number }[][]>([]);
    const graphRef = useRef<HTMLDivElement>(null);
    const editing = !!scribbleId;
    const editWindowMs = 15 * 60 * 1000;
    const canEdit =
        !editing ||
        !createdAt ||
        Date.now() - new Date(createdAt).getTime() <= editWindowMs;

    // We need to map screen coordinates to graph coordinates
    // Default bounds are -10 to 10 for both x and y
    const bounds = { left: -10, right: 10, bottom: -10, top: 10 };

    const getGraphCoordinates = (clientX: number, clientY: number) => {
        if (!graphRef.current) return null;
        const rect = graphRef.current.getBoundingClientRect();
        const xPercent = (clientX - rect.left) / rect.width;
        const yPercent = 1 - (clientY - rect.top) / rect.height; // Invert Y

        const x = bounds.left + xPercent * (bounds.right - bounds.left);
        const y = bounds.bottom + yPercent * (bounds.top - bounds.bottom);
        return { x, y };
    };

    useEffect(() => {
        if (initialPoints) {
            setPoints(initialPoints);
        }
    }, [initialPoints]);

    const handlePointerDown = (e: React.PointerEvent) => {
        setIsDrawing(true);
        const coords = getGraphCoordinates(e.clientX, e.clientY);
        if (coords) {
            setHistory((prev) => [...prev, points]);
            setRedoStack([]);
            setPoints([coords]);
        }
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDrawing) return;
        const coords = getGraphCoordinates(e.clientX, e.clientY);
        if (coords) {
            setPoints((prev) => [...prev, coords]);
        }
    };

    const handlePointerUp = () => {
        setIsDrawing(false);
        // Simplify points? Maybe later.
    };

    const handleUndo = () => {
        if (history.length === 0) return;
        const last = history[history.length - 1];
        setRedoStack((prev) => [...prev, points]);
        setPoints(last);
        setHistory((prev) => prev.slice(0, -1));
    };

    const handleRedo = () => {
        if (redoStack.length === 0) return;
        const next = redoStack[redoStack.length - 1];
        setHistory((prev) => [...prev, points]);
        setPoints(next);
        setRedoStack((prev) => prev.slice(0, -1));
    };

    const handleSave = async () => {
        if (points.length < 2) return;
        if (!canEdit) {
            alert('Edit window closed (15 minutes after publish).');
            return;
        }
        setSaving(true);
        try {
            const url = editing ? `/api/scribbles/${scribbleId}` : '/api/scribbles';
            const res = await fetch(url, {
                method: editing ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    points,
                    creatorId: user?.id,
                    creatorName: user?.username || 'Anonymous',
                    userId: user?.id,
                }),
            });

            if (res.ok) {
                alert(editing ? 'Scribble updated!' : 'Scribble saved!');
                onSaved?.();
                onBack();
            } else {
                alert('Failed to save scribble.');
            }
        } catch (e) {
            console.error(e);
            alert('Error saving scribble.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-64px)]">
            <div className="flex items-center justify-between p-4 border-b bg-card">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={onBack} size="sm">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                    <div>
                        <h2 className="text-lg font-bold">{editing ? 'Edit Scribble' : 'Create Scribble'}</h2>
                        {editing && (
                            <p className="text-[10px] text-muted-foreground">
                                Edits allowed for 15 minutes after publish.
                            </p>
                        )}
                    </div>
                </div>
                <p className="text-xs text-destructive">Keep it clean—no inappropriate scribbles.</p>
                <div className="flex gap-2">
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={handleUndo} disabled={history.length === 0}>
                            <Undo className="h-4 w-4 mr-2" />
                            Undo
                        </Button>
                        <Button variant="ghost" size="sm" onClick={handleRedo} disabled={redoStack.length === 0}>
                            <Undo className="h-4 w-4 mr-2 rotate-180" />
                            Redo
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => { setPoints([]); setHistory([]); setRedoStack([]); }} disabled={points.length === 0}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Clear
                        </Button>
                    </div>
                    <Button onClick={handleSave} disabled={points.length < 2 || saving || !canEdit} size="sm">
                        <Save className="h-4 w-4 mr-2" />
                        {saving ? 'Saving...' : editing ? 'Update Scribble' : 'Save Scribble'}
                    </Button>
                </div>
            </div>

            <div className="flex-1 relative touch-none" ref={graphRef}>
                <div className="absolute inset-0 pointer-events-none">
                    <GraphingCalculator
                        targetLatex=""
                        helperExpressions={[]}
                        finalGuess=""
                        showGrid={true}
                        showAxes={true}
                        boldGuessLine={false}
                        points={points}
                    />
                </div>

                {/* Transparent overlay for capturing input */}
                <div
                    className="absolute inset-0 cursor-crosshair z-10"
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                />

                {points.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="bg-background/80 p-4 rounded-xl border shadow-sm text-center backdrop-blur-sm">
                            <p className="font-medium">Draw a function!</p>
                            <p className="text-sm text-muted-foreground">Click and drag to draw a curve.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
