function normalizeWord(word) {
    return word.trim().replace(/\s+/g, " ");
}

function capitalizeWord(word) {
    return word.replace(/\b([A-Za-z])([A-Za-z'-]*)\b/g, (_, first, rest) => {
        return first.toUpperCase() + rest.toLowerCase();
    });
}

function isEnglishStudyHeading(line) {
    const match = line.match(/^##\s+([A-Za-z]+(?:[ '-][A-Za-z]+)*)\s*$/);
    return match ? match[1].trim() : "";
}

export function parseStudiedWords(markdown) {
    return [...new Set(markdown
        .split(/\r?\n/)
        .map(isEnglishStudyHeading)
        .map((word) => capitalizeWord(normalizeWord(word)))
        .filter(Boolean))];
}

export function formatRelativeDate(value) {
    const date = new Date(value);

    return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric"
    });
}

function formatWeekLabel(date) {
    return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric"
    });
}

export function getWeekBuckets() {
    const buckets = [];
    const now = new Date();
    const currentWeekStart = new Date(now);
    const dayOffset = (currentWeekStart.getDay() + 6) % 7;
    currentWeekStart.setDate(currentWeekStart.getDate() - dayOffset);
    currentWeekStart.setHours(0, 0, 0, 0);

    for (let index = 5; index >= 0; index -= 1) {
        const start = new Date(currentWeekStart);
        start.setDate(currentWeekStart.getDate() - (index * 7));
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);

        buckets.push({
            key: start.toISOString(),
            label: `${formatWeekLabel(start)} - ${formatWeekLabel(end)}`,
            start,
            end,
            count: 0
        });
    }

    return buckets;
}

function sortAnalyticsEntries(analytics) {
    return Object.values(analytics).sort((left, right) => {
        if (right.lookupCount !== left.lookupCount) {
            return right.lookupCount - left.lookupCount;
        }

        return left.word.localeCompare(right.word);
    });
}

export function buildDashboardData(markdown, analytics) {
    const studiedWords = parseStudiedWords(markdown);
    const filteredAnalytics = {};
    const nowIso = new Date().toISOString();

    for (const word of studiedWords) {
        if (analytics[word]) {
            filteredAnalytics[word] = analytics[word];
            continue;
        }

        filteredAnalytics[word] = {
            word,
            lookupCount: 0,
            createdAt: nowIso,
            lastLookupAt: nowIso
        };
    }

    const rankedEntries = sortAnalyticsEntries(filteredAnalytics);
    const learnedWords = studiedWords.length;
    const totalLookups = rankedEntries.reduce((sum, entry) => sum + entry.lookupCount, 0);
    const wordsThisWeek = Object.values(filteredAnalytics).filter((entry) => {
        const createdAt = new Date(entry.createdAt);
        const now = new Date();
        const diff = now.getTime() - createdAt.getTime();
        return diff >= 0 && diff <= 7 * 24 * 60 * 60 * 1000;
    }).length;

    const leastRanked = [...rankedEntries]
        .sort((left, right) => {
            if (left.lookupCount !== right.lookupCount) {
                return left.lookupCount - right.lookupCount;
            }

            return left.word.localeCompare(right.word);
        })
        .slice(0, 5);

    const weekBuckets = getWeekBuckets();

    for (const entry of Object.values(filteredAnalytics)) {
        const createdAt = new Date(entry.createdAt);
        const matchingBucket = weekBuckets.find((bucket) => createdAt >= bucket.start && createdAt <= bucket.end);
        if (matchingBucket) {
            matchingBucket.count += 1;
        }
    }

    return {
        learnedWords,
        wordsThisWeek,
        totalLookups,
        reviewPool: leastRanked.length,
        mostLookedUp: rankedEntries.slice(0, 5),
        leastLookedUp: leastRanked,
        entries: rankedEntries,
        weekBuckets
    };
}
