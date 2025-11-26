import React, { useState, useEffect } from 'react';
import MathInput from './MathInput';
import { generatePuzzle, determineDifficulty } from '../core/puzzles';
import { Difficulty } from '../core/types';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';
import Button from './ui/Button';
import Input from './ui/Input';
import Modal from './ui/Modal';
import { Copy, Globe, Link as LinkIcon, Dice5, ArrowLeft } from 'lucide-react';

interface CreateLevelModeProps {
    onBack: () => void;
    onTest: (levelData: any) => void;
}

export default function CreateLevelMode({ onBack, onTest }: CreateLevelModeProps) {
    const { user, loading } = useAuth();
    const [name, setName] = useState('');
    const [functionTex, setFunctionTex] = useState('');
    const [difficulty, setDifficulty] = useState<Difficulty>('medium');
    const [isTimed, setIsTimed] = useState(false);
    const [timeLimit, setTimeLimit] = useState<number>(180); // Default 3 mins
    const [zoomLimit, setZoomLimit] = useState<number | ''>('');
    const [hintsEnabled, setHintsEnabled] = useState(true);
    const [accuracyEnabled, setAccuracyEnabled] = useState(true);

    const [publishing, setPublishing] = useState(false);
    const [showPublishModal, setShowPublishModal] = useState(false);
    const [publishResult, setPublishResult] = useState<{ success: boolean; message: string; link?: string } | null>(null);

    // Load draft from local storage on mount
    useEffect(() => {
        const saved = localStorage.getItem('functionguesser_level_draft');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                setName(data.name || '');
                setFunctionTex(data.functionTex || '');
                setDifficulty(data.difficulty || 'medium');
                setIsTimed(data.isTimed || false);
                setTimeLimit(data.timeLimit || 180);
                setZoomLimit(data.zoomLimit || '');
                setAccuracyEnabled(data.accuracyEnabled ?? true);
                setHintsEnabled(data.hintsEnabled ?? true);
            } catch (e) {
                console.error("Failed to load draft", e);
            }
        }
    }, []);

    // Save draft to local storage on change
    useEffect(() => {
        const data = { name, functionTex, difficulty, isTimed, timeLimit, zoomLimit, accuracyEnabled, hintsEnabled };
        localStorage.setItem('functionguesser_level_draft', JSON.stringify(data));
    }, [name, functionTex, difficulty, isTimed, timeLimit, zoomLimit, accuracyEnabled, hintsEnabled]);


    const computeAutoDifficulty = (tex: string): Difficulty => {
        const lower = tex.toLowerCase();
        let complexity = 0;
        const addIf = (regex: RegExp, amount: number) => {
            if (regex.test(lower)) complexity += amount;
        };
        addIf(/sin|cos|tan/, 2.5);
        addIf(/exp|e\^/, 3);
        addIf(/ln|log/, 3.5);
        addIf(/\|.*\|/, 1.5);
        addIf(/int_|\int/, 5);
        addIf(/!/, 4);
        const powerCount = (tex.match(/\^/g) || []).length;
        complexity += powerCount * 0.5;
        const digitRuns = (tex.match(/\d+/g) || []).length;
        complexity += digitRuns * 0.2;
        complexity += Math.min(tex.length, 80) * 0.05;
        return determineDifficulty(complexity, tex.length);
    };

    const handleRandomize = () => {
        const puzzle = generatePuzzle(undefined, { maxLength: 15 }); // Simplified options
        setFunctionTex(puzzle.functionTex);
    };

    const handleSave = async (visibility: 'DRAFT' | 'UNLISTED' | 'PUBLIC') => {
        if (!name || !functionTex) {
            alert('Please fill in Name and Function.');
            return;
        }

        setPublishing(true);
        setPublishResult(null);

        try {
            const res = await fetch('/api/levels', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    functionTex,
                    difficulty,
                    isTimed,
                    timeLimit: isTimed ? timeLimit : null,
                    zoomLimit: zoomLimit ? Number(zoomLimit) : null,
                    accuracyEnabled,
                    hintsEnabled,
                    visibility,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to save level');
            }

            if (visibility === 'DRAFT') {
                setPublishResult({ success: true, message: 'Draft saved successfully!' });
            } else if (visibility === 'UNLISTED') {
                setPublishResult({
                    success: true,
                    message: 'Level published as Unlisted!',
                    link: `${window.location.origin}/play/${data.id}`
                });
            } else {
                setPublishResult({ success: true, message: 'Level published to Online Levels!' });
            }

            // Clear draft storage on successful publish (but maybe keep for drafts?)
            if (visibility !== 'DRAFT') {
                localStorage.removeItem('functionguesser_level_draft');
                setShowPublishModal(false);
            }

        } catch (err: any) {
            setPublishResult({ success: false, message: err.message });
        } finally {
            setPublishing(false);
        }
    };

    useEffect(() => {
        const auto = computeAutoDifficulty(functionTex || '');
        setDifficulty(auto);
        if (auto !== 'very easy' && auto !== 'easy') {
            setHintsEnabled(false);
        }
    }, [functionTex]);

    if (loading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;

    if (!user) {
        return (
            <div className="max-w-md mx-auto mt-20 p-8 bg-card rounded-xl border shadow-sm text-center space-y-6">
                <h2 className="text-2xl font-bold tracking-tight">Account Required</h2>
                <p className="text-muted-foreground">You must be logged in to create and publish levels.</p>
                <div className="flex justify-center gap-4">
                    <Button variant="outline" onClick={onBack}>
                        Back
                    </Button>
                    <Link href="/account">
                        <Button>Login / Sign Up</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto p-6 space-y-8 pb-20">
            <div className="flex justify-between items-center">
                <div className="space-y-1">
                    <h2 className="text-3xl font-bold tracking-tight">Create Level</h2>
                    <p className="text-muted-foreground">Design your own math puzzle.</p>
                </div>
                <Button variant="ghost" onClick={onBack} className="gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Menu
                </Button>
            </div>

            {publishResult && (
                <div className={`p-4 rounded-xl border ${publishResult.success ? 'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400' : 'bg-destructive/10 border-destructive/20 text-destructive'}`}>
                    <p className="font-semibold">{publishResult.message}</p>
                    {publishResult.link && (
                        <div className="mt-3 flex items-center gap-2 bg-background p-2 rounded-md border shadow-sm">
                            <code className="text-sm flex-1 truncate px-2">{publishResult.link}</code>
                            <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => navigator.clipboard.writeText(publishResult.link!)}
                                className="h-8 gap-2"
                            >
                                <Copy className="h-3 w-3" />
                                Copy
                            </Button>
                        </div>
                    )}
                </div>
            )}

            <div className="grid gap-6 p-6 rounded-xl border bg-card shadow-sm">
                <div className="space-y-2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Level Name</label>
                    <Input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="My Awesome Level"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Function (LaTeX)</label>
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <MathInput
                                value={functionTex}
                                onChange={setFunctionTex}
                                placeholder="e.g. \sin(x) + x^2"
                            />
                        </div>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handleRandomize}
                            title="Randomize based on difficulty"
                        >
                            <Dice5 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Difficulty (auto)</label>
                        <div className="flex h-10 items-center rounded-md border border-input bg-muted px-3 text-sm text-muted-foreground">
                            {difficulty}
                        </div>
                        <p className="text-[0.8rem] text-muted-foreground">Auto-detected from the function.</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Zoom Limit (Optional)</label>
                        <Input
                            type="number"
                            value={zoomLimit}
                            onChange={(e) => setZoomLimit(e.target.value === '' ? '' : Number(e.target.value))}
                            placeholder="e.g. 10"
                        />
                        <p className="text-[0.8rem] text-muted-foreground">Max absolute value for x/y axes.</p>
                    </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={accuracyEnabled}
                            onChange={(e) => setAccuracyEnabled(e.target.checked)}
                            className="h-4 w-4 rounded border-primary text-primary focus:ring-primary"
                        />
                        <span className="font-medium">Enable Accuracy Function</span>
                    </label>
                    <p className="text-xs text-muted-foreground">Turn off to hide accuracy scoring on this level.</p>
                </div>

                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={isTimed}
                            onChange={(e) => setIsTimed(e.target.checked)}
                            className="h-4 w-4 rounded border-primary text-primary focus:ring-primary"
                        />
                        <span className="font-medium">Timed Mode</span>
                    </label>

                    {isTimed && (
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Time Limit:</span>
                            <select
                                value={timeLimit}
                                onChange={(e) => setTimeLimit(Number(e.target.value))}
                                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            >
                                <option value={60}>1 min</option>
                                <option value={180}>3 mins</option>
                                <option value={300}>5 mins</option>
                                <option value={600}>10 mins</option>
                            </select>
                        </div>
                    )}
                </div>

                {(difficulty === 'very easy' || difficulty === 'easy') && (
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={hintsEnabled}
                                onChange={(e) => setHintsEnabled(e.target.checked)}
                                className="h-4 w-4 rounded border-primary text-primary focus:ring-primary"
                            />
                            <span className="font-medium">Enable Hints</span>
                        </label>
                        <p className="text-xs text-muted-foreground">3 character reveals max (very easy/easy only).</p>
                    </div>
                )}

                <div className="flex gap-3 pt-4">
                    <Button
                        variant="outline"
                        onClick={() => onTest({ name, functionTex, difficulty, isTimed, timeLimit, zoomLimit, accuracyEnabled, hintsEnabled })}
                        className="flex-1"
                    >
                        Test Level
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={() => handleSave('DRAFT')}
                        disabled={publishing}
                        className="flex-1"
                    >
                        {publishing ? 'Saving...' : 'Save Draft'}
                    </Button>
                    <Button
                        onClick={() => setShowPublishModal(true)}
                        disabled={publishing}
                        className="flex-1"
                    >
                        Publish
                    </Button>
                </div>
            </div>

            <Modal
                title="Publish Level"
                isOpen={showPublishModal}
                onClose={() => setShowPublishModal(false)}
            >
                <div className="space-y-4 pt-2">
                    <p className="text-muted-foreground">Choose how you want to share your level.</p>

                    <div className="grid gap-3">
                        <button
                            onClick={() => handleSave('UNLISTED')}
                            className="flex items-center gap-4 p-4 rounded-xl border bg-card hover:bg-accent hover:text-accent-foreground text-left transition-all group"
                        >
                            <div className="p-2 rounded-full bg-primary/10 text-primary group-hover:bg-primary/20">
                                <LinkIcon className="h-5 w-5" />
                            </div>
                            <div>
                                <div className="font-semibold">Unlisted</div>
                                <div className="text-xs text-muted-foreground">Only people with the link can play.</div>
                            </div>
                        </button>

                        <button
                            onClick={() => handleSave('PUBLIC')}
                            className="flex items-center gap-4 p-4 rounded-xl border bg-card hover:bg-accent hover:text-accent-foreground text-left transition-all group"
                        >
                            <div className="p-2 rounded-full bg-primary/10 text-primary group-hover:bg-primary/20">
                                <Globe className="h-5 w-5" />
                            </div>
                            <div>
                                <div className="font-semibold">Online (Public)</div>
                                <div className="text-xs text-muted-foreground">Visible to everyone in the Online Levels tab.</div>
                            </div>
                        </button>
                    </div>

                    <Button
                        variant="ghost"
                        onClick={() => setShowPublishModal(false)}
                        className="w-full"
                    >
                        Cancel
                    </Button>
                </div>
            </Modal>
        </div>
    );
}
