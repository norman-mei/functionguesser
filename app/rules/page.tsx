import React from 'react';
import Link from 'next/link';

export default function RulesPage() {
    return (
        <div className="max-w-3xl mx-auto p-6 space-y-8 pb-20">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Rules & Privacy</h1>
                <Link href="/" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text)]">
                    Back to Home
                </Link>
            </div>

            <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-[var(--accent)]">Community Rules</h2>
                <div className="bg-[var(--panel)] p-6 rounded-2xl border border-[var(--border)] space-y-4">
                    <p>To ensure a fun and safe environment for everyone, please adhere to the following rules when creating and publishing levels:</p>
                    <ul className="list-disc list-inside space-y-2 text-[var(--text-secondary)]">
                        <li><strong>No Offensive Content:</strong> Do not use hate speech, vulgar language, or inappropriate names for your levels or functions.</li>
                        <li><strong>No Spam:</strong> Do not create multiple identical or meaningless levels.</li>
                        <li><strong>Respect Copyright:</strong> Do not post content that violates intellectual property rights.</li>
                        <li><strong>Fair Play:</strong> Do not exploit bugs or cheat in competitive modes.</li>
                        <li><strong>No Leaderboard Manipulation:</strong> Any cheating, botting, or collusion to inflate scores results in a permanent leaderboard ban.</li>
                    </ul>
                    <p className="text-sm text-red-400">Violation of these rules may result in your levels being removed, losing posting privileges, and a permanent ban from the leaderboard.</p>
                </div>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-[var(--accent)]">Privacy Policy</h2>
                <div className="bg-[var(--panel)] p-6 rounded-2xl border border-[var(--border)] space-y-4">
                    <p>We value your privacy. Here is how we handle your data:</p>
                    <ul className="list-disc list-inside space-y-2 text-[var(--text-secondary)]">
                        <li><strong>Account Information:</strong> We store your username, email (if provided), and password hash securely.</li>
                        <li><strong>Level Data:</strong> When you publish a level, its content (name, function, settings) and your username are made public.</li>
                        <li><strong>Game History:</strong> We track your solved puzzles and times to provide statistics and leaderboards.</li>
                        <li><strong>Cookies:</strong> We use local storage and cookies to maintain your session and settings.</li>
                    </ul>
                    <p>We do not sell your personal data to third parties.</p>
                </div>
            </section>

            <div className="text-center text-sm text-[var(--text-secondary)] pt-8">
                <p>Function Guesser &copy; {new Date().getFullYear()}</p>
            </div>
        </div>
    );
}
