'use client';

import App from '../../../src/App';

export default function PlayLevelPage({ params }: { params: { id: string } }) {
    return <App mode="play" levelId={params.id} />;
}
