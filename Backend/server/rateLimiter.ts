const hits = new Map<string, number[]>();

export const isRateLimited = (
    key: string,
    maxHits: number,
    windowMs: number
): boolean => {
    const now = Date.now();
    const timestamps = (hits.get(key) ?? []).filter(
        (t) => now - t < windowMs
    );

    timestamps.push(now);
    hits.set(key, timestamps);

    return timestamps.length > maxHits;
};

setInterval(() => {
    const now = Date.now();
    for (const [key, timestamps] of hits.entries()) {
        const recent = timestamps.filter((t) => now - t < 60_000);
        if (recent.length === 0) {
            hits.delete(key);
        } else {
            hits.set(key, recent);
        }
    }
}, 60_000);