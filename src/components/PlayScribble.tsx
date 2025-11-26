import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import Button from './ui/Button';
import { ArrowLeft, Trophy, Flag } from 'lucide-react';
import GraphingCalculator from './GraphingCalculator';
import ControlPanel from './ControlPanel';
import { HelperExpression, Puzzle } from '../core/types';
import * as math from 'mathjs';

interface PlayScribbleProps {
    scribbleId: string;
    onBack: () => void;
}

interface Scribble {
    id: string;
    points: string;
    creatorName: string;
}

export default function PlayScribble({ scribbleId, onBack }: PlayScribbleProps) {
    const { user } = useAuth();
    const [scribble, setScribble] = useState<Scribble | null>(null);
    const [points, setPoints] = useState<{ x: number; y: number }[]>([]);
    const [loading, setLoading] = useState(true);

    const [finalGuess, setFinalGuess] = useState('');
    const [helperExpressions, setHelperExpressions] = useState<HelperExpression[]>([]);
    const [accuracy, setAccuracy] = useState<number | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [showSolution, setShowSolution] = useState(true);
    const [reporting, setReporting] = useState(false);
    const [reportMessage, setReportMessage] = useState<string | null>(null);

    useEffect(() => {
        const fetchScribble = async () => {
            try {
                const res = await fetch(`/api/scribbles/${scribbleId}`);
                if (res.ok) {
                    const data = await res.json();
                    setScribble(data);
                    setPoints(JSON.parse(data.points));
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchScribble();
    }, [scribbleId]);

    const calculateAccuracy = useCallback(() => {
        if (!finalGuess || points.length === 0) return 0;

        try {
            // Parse the user's function
            // We need to handle implicit y= or f(x)=
            let exprStr = finalGuess;
            if (exprStr.includes('=')) {
                exprStr = exprStr.split('=')[1];
            }

            const compiled = math.compile(exprStr);

            let totalError = 0;
            let validPoints = 0;

            points.forEach(p => {
                try {
                    const y = compiled.evaluate({ x: p.x });
                    if (typeof y === 'number' && !isNaN(y) && isFinite(y)) {
                        const diff = Math.abs(y - p.y);
                        // Simple distance metric, maybe square it?
                        totalError += Math.min(diff, 5); // Cap error per point
                        validPoints++;
                    }
                } catch (e) {
                    // Ignore evaluation errors
                }
            });

            if (validPoints === 0) return 0;

            const avgError = totalError / validPoints;
            // Map error to 0-100 score. 
            // 0 error -> 100%
            // 1 error -> ~80%
            // 5 error -> 0%
            const score = Math.max(0, 100 - (avgError * 20));
            return score;

        } catch (e) {
            return 0;
        }
    }, [finalGuess, points]);

    const handleSubmit = async () => {
        const score = calculateAccuracy();
        setAccuracy(score);
        setSubmitting(true);

        try {
            await fetch(`/api/scribbles/${scribbleId}/attempt`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user?.id,
                    userName: user?.username || 'Guest',
                    functionTex: finalGuess,
                    accuracy: score
                })
            });
        } catch (e) {
            console.error(e);
        } finally {
            setSubmitting(false);
        }
    };

    const handleReport = async () => {
        setReporting(true);
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
            if (!res.ok) throw new Error('Failed');
            setReportMessage('Report received. Thanks for keeping Scribble clean.');
        } catch (e) {
            setReportMessage('Could not send report right now.');
        } finally {
            setReporting(false);
        }
    };

    // Mock puzzle object for ControlPanel
    const mockPuzzle: Puzzle = {
        id: 0,
        functionTex: '\\\\text{Scribble target is shown as points.}',
        difficulty: 'medium',
        allowedComponents: []
    };

    if (loading) return <div className="p-8 text-center">Loading...</div>;
    if (!scribble) return <div className="p-8 text-center">Scribble not found</div>;

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] lg:flex-row">
            <div className="flex-1 relative min-h-[400px]">
                <GraphingCalculator
                    targetLatex=""
                    helperExpressions={helperExpressions}
                    finalGuess={finalGuess}
                    showGrid={true}
                    showAxes={true}
                    boldGuessLine={true}
                    points={points}
                />
            </div>

            <div className="w-full lg:w-[400px] bg-card border-l p-4 flex flex-col gap-4 overflow-y-auto">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-bold">Scribble Challenge</h2>
                        <p className="text-sm text-muted-foreground">Created by {scribble.creatorName}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleReport} disabled={reporting} className="shrink-0">
                        <Flag className="h-4 w-4 mr-2 text-destructive" />
                        {reporting ? 'Reporting...' : 'Report'}
                    </Button>
                </div>

                <div className="p-4 bg-muted/50 rounded-xl border">
                    <h3 className="font-semibold mb-2">Goal</h3>
                    <p className="text-sm">Find a function that matches the drawn points as closely as possible.</p>
                </div>

                {accuracy !== null && (
                    <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl text-center">
                        <div className="text-sm font-medium uppercase tracking-wider text-primary">Accuracy</div>
                        <div className="text-3xl font-bold text-primary">{accuracy.toFixed(1)}%</div>
                    </div>
                )}
                {reportMessage && (
                    <div className="rounded-lg border border-[var(--border)] bg-muted/40 p-3 text-xs text-muted-foreground">
                        {reportMessage}
                    </div>
                )}

                <ControlPanel
                    puzzle={mockPuzzle}
                    helperExpressions={helperExpressions}
                    finalGuess={finalGuess}
                    isCorrect={accuracy !== null && accuracy > 90} // Arbitrary threshold for "Correct" visual
                    accuracyScores={[]}
                    onHelperChange={(id, val) => {
                        setHelperExpressions(prev => prev.map(h => h.id === id ? { ...h, expression: val } : h));
                    }}
                    onHelperColorChange={(id, color) => {
                        setHelperExpressions(prev => prev.map(h => h.id === id ? { ...h, color } : h));
                    }}
                    onToggleHelper={(id) => {
                        setHelperExpressions(prev => prev.map(h => h.id === id ? { ...h, visible: !h.visible } : h));
                    }}
                    onRemoveHelper={(id) => {
                        setHelperExpressions(prev => prev.filter(h => h.id !== id));
                    }}
                    onAddHelper={() => {
                        const newId = Math.max(0, ...helperExpressions.map(h => h.id)) + 1;
                        setHelperExpressions([...helperExpressions, { id: newId, expression: '', color: '#000000', visible: true }]);
                    }}
                    onFinalGuessChange={setFinalGuess}
                    onNewPuzzle={() => { }}
                    onResetPuzzle={() => {
                        setFinalGuess('');
                        setHelperExpressions([]);
                        setAccuracy(null);
                    }}
                    onOpenRules={() => { }}
                    showMathPreview={true}
                    showSolution={showSolution}
                    onShowSolution={() => setShowSolution(true)}
                    autoAdvanceSeconds={null}
                    disableNewPuzzle={true}
                    hideSolutionActions
                    solutionNote="Scribble solutions are the drawn points you see on the graph. Please keep submissions appropriate."
                />

                <Button onClick={handleSubmit} disabled={submitting || !finalGuess} className="w-full">
                    {submitting ? 'Submitting...' : 'Check Accuracy'}
                </Button>
            </div>
        </div>
    );
}
