const NOTEBOOK_KEY = "wordNotebook";
const DEFAULT_NOTEBOOK = `# Word Notebook

`;
const DASHBOARD_EMPTY_STATE = "Start looking up words to unlock your study analytics.";

const elements = {
    heroStat: document.getElementById("heroStat"),
    heroCaption: document.getElementById("heroCaption"),
    summary: document.getElementById("dashboardSummary"),
    insights: document.getElementById("dashboardInsights"),
    weeklyProgress: document.getElementById("weeklyProgress"),
    frequentWords: document.getElementById("frequentWords"),
    rareWords: document.getElementById("rareWords"),
    activityFeed: document.getElementById("activityFeed")
};

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

function parseStudiedWords(markdown) {
    return [...new Set(markdown
        .split(/\r?\n/)
        .map(isEnglishStudyHeading)
        .map((word) => capitalizeWord(normalizeWord(word)))
        .filter(Boolean))];
}

function formatWeekLabel(date) {
    return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric"
    });
}

function formatRelativeDate(value) {
    const date = new Date(value);
    return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric"
    });
}

function getWeekBuckets() {
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

function renderMetricCard(label, value, note) {
    return `
        <article class="metric-card">
          <span class="metric-label">${label}</span>
          <strong class="metric-value">${value}</strong>
          <span class="metric-note">${note}</span>
        </article>
    `;
}

function renderWordList(entries, emptyMessage) {
    if (entries.length === 0) {
        return `<p class="list-empty">${emptyMessage}</p>`;
    }

    return `
        <ul class="word-ranking">
          ${entries.map((entry) => `
            <li>
              <span>${entry.word}</span>
              <strong>${entry.lookupCount} ${entry.lookupCount === 1 ? "lookup" : "lookups"}</strong>
            </li>
          `).join("")}
        </ul>
    `;
}

function renderWeeklyProgress(analytics) {
    const buckets = getWeekBuckets();

    for (const entry of Object.values(analytics)) {
        const createdAt = new Date(entry.createdAt);
        const matchingBucket = buckets.find((bucket) => createdAt >= bucket.start && createdAt <= bucket.end);
        if (matchingBucket) {
            matchingBucket.count += 1;
        }
    }

    const maxCount = Math.max(...buckets.map((bucket) => bucket.count), 1);

    return `
        <div class="weekly-bars">
          ${buckets.map((bucket) => `
            <div class="weekly-bar-card">
              <div class="weekly-bar-track">
                <div class="weekly-bar-fill" style="height: ${Math.max((bucket.count / maxCount) * 100, bucket.count > 0 ? 12 : 0)}%"></div>
              </div>
              <strong>${bucket.count}</strong>
              <span>${bucket.label}</span>
            </div>
          `).join("")}
        </div>
    `;
}

function renderActivityFeed(entries) {
    if (entries.length === 0) {
        return `<p class="list-empty">${DASHBOARD_EMPTY_STATE}</p>`;
    }

    const latest = [...entries]
        .sort((left, right) => new Date(right.lastLookupAt).getTime() - new Date(left.lastLookupAt).getTime())
        .slice(0, 6);

    return `
        <ul class="activity-feed">
          ${latest.map((entry) => `
            <li>
              <div>
                <strong>${entry.word}</strong>
                <span>Last checked ${formatRelativeDate(entry.lastLookupAt)}</span>
              </div>
              <b>${entry.lookupCount}</b>
            </li>
          `).join("")}
        </ul>
    `;
}

function buildDashboardData(markdown, analytics) {
    const studiedWords = parseStudiedWords(markdown);
    const filteredAnalytics = {};

    for (const word of studiedWords) {
        if (analytics[word]) {
            filteredAnalytics[word] = analytics[word];
            continue;
        }

        filteredAnalytics[word] = {
            word,
            lookupCount: 0,
            createdAt: new Date().toISOString(),
            lastLookupAt: new Date().toISOString()
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

    return {
        learnedWords,
        wordsThisWeek,
        totalLookups,
        mostLookedUp: rankedEntries.slice(0, 5),
        leastLookedUp: leastRanked,
        entries: rankedEntries,
        analytics: filteredAnalytics
    };
}

async function getWordAnalytics() {
    const response = await browser.runtime.sendMessage({
        type: "get-word-analytics"
    });

    return response?.analytics || {};
}

async function getNotebookContent() {
    const stored = await browser.storage.local.get(NOTEBOOK_KEY);
    return stored[NOTEBOOK_KEY] || DEFAULT_NOTEBOOK;
}

async function renderAnalyticsPage() {
    const [markdown, analytics] = await Promise.all([
        getNotebookContent(),
        getWordAnalytics()
    ]);

    const dashboard = buildDashboardData(markdown, analytics);

    elements.heroStat.textContent = String(dashboard.totalLookups);
    elements.heroCaption.textContent = dashboard.totalLookups === 1
        ? "lookup recorded across your study notebook"
        : "lookups recorded across your study notebook";

    elements.summary.innerHTML = [
        renderMetricCard("Words learned", dashboard.learnedWords, "Unique words saved in your notebook"),
        renderMetricCard("New words this week", dashboard.wordsThisWeek, "Vocabulary added in the last 7 days"),
        renderMetricCard("Average revisits", dashboard.learnedWords ? (dashboard.totalLookups / dashboard.learnedWords).toFixed(1) : "0.0", "Lookup depth per saved word"),
        renderMetricCard("Review pool", dashboard.leastLookedUp.length, "Low-activity words ready for review")
    ].join("");

    const topWord = dashboard.mostLookedUp[0];
    elements.insights.innerHTML = topWord
        ? `
            <div class="insight-pill accent">Most looked up: <strong>${topWord.word}</strong></div>
            <div class="insight-pill">Top count: <strong>${topWord.lookupCount}</strong></div>
            <div class="insight-pill">Least active set: <strong>${dashboard.leastLookedUp.map((entry) => entry.word).join(", ") || "None yet"}</strong></div>
          `
        : `<p class="dashboard-empty">${DASHBOARD_EMPTY_STATE}</p>`;

    elements.weeklyProgress.innerHTML = renderWeeklyProgress(dashboard.analytics);
    elements.frequentWords.innerHTML = renderWordList(dashboard.mostLookedUp, "Your most looked-up words will appear here.");
    elements.rareWords.innerHTML = renderWordList(dashboard.leastLookedUp, "Your least looked-up words will appear here.");
    elements.activityFeed.innerHTML = renderActivityFeed(dashboard.entries);
}

document.addEventListener("DOMContentLoaded", async () => {
    await renderAnalyticsPage();
});

browser.storage.onChanged.addListener(async (changes, areaName) => {
    if (areaName !== "local") return;

    if (NOTEBOOK_KEY in changes || "wordAnalytics" in changes) {
        await renderAnalyticsPage();
    }
});
