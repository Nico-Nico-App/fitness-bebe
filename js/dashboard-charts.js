/* ======================================
   TABLEAU DE BORD ANALYTIQUE
====================================== */

let analyticsWeightChart = null;
let analyticsActivityChart = null;
let analyticsStepsChart = null;
let analyticsCaloriesChart = null;
let analyticsMeasurementsChart = null;

const ANALYTICS_COLORS = {
    primary: "#6d5ce8",
    secondary: "#13a89e",
    tertiary: "#e3a33b",
    pink: "#d66bb2",
    blue: "#4f83d1"
};

function getAnalyticsTheme() {

    const isDark = document.body.classList.contains("dark");

    return {
        text: isDark ? "#e5e7eb" : "#475569",
        muted: isDark ? "#94a3b8" : "#64748b",
        grid: isDark ? "rgba(148,163,184,.16)" : "rgba(100,116,139,.14)",
        tooltipBg: isDark ? "#111827" : "#ffffff",
        tooltipBorder: isDark ? "#334155" : "#e2e8f0"
    };
}

function getAnalyticsRange() {

    const select = document.getElementById("analyticsRange");

    return select ? select.value : "90";
}

function getAnalyticsRangeLabel(range = getAnalyticsRange()) {

    const labels = {
        "30": "les 30 derniers jours",
        "90": "les 90 derniers jours",
        "365": "les 12 derniers mois",
        all: "toute la période enregistrée"
    };

    return labels[range] || labels["90"];
}

function localDateFromISO(value) {

    const [year, month, day] = value.split("-").map(Number);

    return new Date(year, month - 1, day);
}

function formatAnalyticsDate(value, options = {}) {

    if (!value) return "—";

    const date = localDateFromISO(value);

    if (Number.isNaN(date.getTime())) return "—";

    return new Intl.DateTimeFormat("fr-CH", {
        day: "numeric",
        month: "short",
        ...options
    }).format(date);
}

function formatAnalyticsNumber(value, maximumFractionDigits = 0) {

    return Number(value).toLocaleString("fr-CH", {
        maximumFractionDigits
    });
}

function getAnalyticsData(key) {

    const value = load(key);

    return Array.isArray(value) ? value : [];
}

function getAnalyticsBounds(range = getAnalyticsRange()) {

    const end = getLocalDateISO();
    let start = end;

    if (range !== "all") {

        const days = Number(range) || 90;
        const startDate = localDateFromISO(end);
        startDate.setDate(startDate.getDate() - days + 1);
        start = getLocalDateISO(startDate);

    } else {

        const dates = [
            ...getAnalyticsData("weights"),
            ...getAnalyticsData("workouts"),
            ...getAnalyticsData("measurements"),
            ...getAnalyticsData("meals"),
            ...getAnalyticsData("steps")
        ]
            .map(entry => entry && entry.date)
            .filter(date => typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date) && date <= end)
            .sort();

        if (dates.length > 0) {
            start = dates[0];
        }
    }

    return { start, end };
}

function filterAnalyticsPeriod(entries, bounds) {

    return entries
        .filter(entry =>
            entry &&
            typeof entry.date === "string" &&
            entry.date >= bounds.start &&
            entry.date <= bounds.end
        )
        .slice()
        .sort((a, b) => a.date.localeCompare(b.date));
}

function setChartEmptyState(canvasId, message) {

    const canvas = document.getElementById(canvasId);
    const empty = document.getElementById(`${canvasId}Empty`);

    if (canvas) canvas.hidden = true;

    if (empty) {
        empty.textContent = message;
        empty.hidden = false;
    }
}

function setChartReady(canvasId) {

    const canvas = document.getElementById(canvasId);
    const empty = document.getElementById(`${canvasId}Empty`);

    if (canvas) canvas.hidden = false;
    if (empty) empty.hidden = true;

    return canvas;
}

function destroyAnalyticsChart(chart) {

    if (chart) chart.destroy();
}

function makeAnalyticsOptions(unit, options = {}) {

    const theme = getAnalyticsTheme();
    const isLine = Boolean(options.line);
    const showLegend = Boolean(options.showLegend);

    return {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
            duration: 450
        },
        interaction: {
            mode: "index",
            intersect: false
        },
        plugins: {
            legend: {
                display: showLegend,
                position: "bottom",
                labels: {
                    color: theme.text,
                    usePointStyle: true,
                    pointStyle: "circle",
                    boxWidth: 8,
                    padding: 18
                }
            },
            tooltip: {
                backgroundColor: theme.tooltipBg,
                borderColor: theme.tooltipBorder,
                borderWidth: 1,
                titleColor: theme.text,
                bodyColor: theme.text,
                padding: 12,
                displayColors: true,
                callbacks: {
                    label(context) {
                        if (!context || !context.parsed) return "";

                        const value = context.parsed.y;

                        if (value === null || value === undefined) return "";

                        const formatted = formatAnalyticsNumber(value, isLine ? 1 : 0);
                        const label = context.dataset.label || "";

                        return `${label}: ${formatted} ${unit}`;
                    }
                }
            }
        },
        scales: {
            x: {
                ticks: {
                    color: theme.muted,
                    maxRotation: 0,
                    autoSkip: true,
                    maxTicksLimit: 8,
                    padding: 8
                },
                grid: {
                    display: false
                },
                border: {
                    display: false
                }
            },
            y: {
                beginAtZero: options.beginAtZero !== undefined
                    ? options.beginAtZero
                    : !isLine,
                grace: isLine ? "8%" : 0,
                ticks: {
                    color: theme.muted,
                    precision: options.precision,
                    padding: 8,
                    callback(value) {
                        return `${formatAnalyticsNumber(value)} ${unit}`;
                    }
                },
                grid: {
                    color: theme.grid,
                    drawTicks: false
                },
                border: {
                    display: false
                }
            }
        }
    };
}

function getWeekStartISO(dateValue) {

    const date = localDateFromISO(dateValue);
    const daysSinceMonday = (date.getDay() + 6) % 7;

    date.setDate(date.getDate() - daysSinceMonday);

    return getLocalDateISO(date);
}

function getWeeklyLabels(bounds) {

    const firstWeek = localDateFromISO(getWeekStartISO(bounds.start));
    const lastWeek = localDateFromISO(getWeekStartISO(bounds.end));
    const weeks = [];

    for (
        const date = new Date(firstWeek);
        date <= lastWeek;
        date.setDate(date.getDate() + 7)
    ) {
        const weekStart = new Date(date);
        weeks.push(getLocalDateISO(weekStart));
    }

    return weeks;
}

function getDailyStepTotals(entries) {

    const byDate = new Map();

    entries.forEach(entry => {
        byDate.set(entry.date, Number(entry.steps) || 0);
    });

    return byDate;
}

function getDailyMealTotals(entries) {

    const byDate = new Map();

    entries.forEach(entry => {
        byDate.set(
            entry.date,
            (byDate.get(entry.date) || 0) + (Number(entry.calories) || 0)
        );
    });

    return byDate;
}

function averageValuesByWeek(dailyValues, weeks) {

    const totals = new Map();
    const counts = new Map();

    dailyValues.forEach((value, date) => {
        const week = getWeekStartISO(date);

        totals.set(week, (totals.get(week) || 0) + value);
        counts.set(week, (counts.get(week) || 0) + 1);
    });

    return weeks.map(week =>
        counts.has(week) ? totals.get(week) / counts.get(week) : null
    );
}

function updateAnalyticsSummary(bounds) {

    const allWeights = filterAnalyticsPeriod(getAnalyticsData("weights"), {
        start: "0000-01-01",
        end: bounds.end
    });
    const periodWeights = filterAnalyticsPeriod(getAnalyticsData("weights"), bounds);
    const workouts = filterAnalyticsPeriod(getAnalyticsData("workouts"), bounds);
    const steps = filterAnalyticsPeriod(getAnalyticsData("steps"), bounds);

    const latestWeight = allWeights[allWeights.length - 1];
    const set = (id, value) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    };

    if (latestWeight) {
        set("metricCurrentWeight", `${formatAnalyticsNumber(latestWeight.weight, 1)} kg`);
        set("metricCurrentWeightMeta", `Dernière pesée · ${formatAnalyticsDate(latestWeight.date)}`);
    } else {
        set("metricCurrentWeight", "—");
        set("metricCurrentWeightMeta", "Aucune pesée enregistrée");
    }

    if (periodWeights.length >= 2) {
        const change =
            Number(periodWeights[periodWeights.length - 1].weight) -
            Number(periodWeights[0].weight);
        const prefix = change > 0 ? "+" : change < 0 ? "−" : "";

        set("metricWeightChange", `${prefix}${formatAnalyticsNumber(Math.abs(change), 1)} kg`);
        set(
            "metricWeightChangeMeta",
            `${formatAnalyticsDate(periodWeights[0].date)} → ${formatAnalyticsDate(periodWeights[periodWeights.length - 1].date)}`
        );
    } else {
        set("metricWeightChange", "—");
        set("metricWeightChangeMeta", "Ajoutez deux pesées sur cette période");
    }

    const goal = typeof getGoal === "function" ? getGoal() : null;

    if (goal) {
        const progress = typeof getGoalProgress === "function"
            ? getGoalProgress()
            : 0;
        const remaining = typeof getRemainingWeight === "function"
            ? getRemainingWeight()
            : null;

        set("metricGoalProgress", `${Math.round(progress)} %`);
        set(
            "metricGoalProgressMeta",
            remaining === null
                ? `Objectif : ${formatAnalyticsNumber(goal.weight, 1)} kg`
                : `Depuis la première pesée · ${remaining} kg restants`
        );
    } else {
        set("metricGoalProgress", "—");
        set("metricGoalProgressMeta", "Aucun objectif défini");
    }

    set("metricWorkoutCount", formatAnalyticsNumber(workouts.length));
    set("metricWorkoutCountMeta", getAnalyticsRangeLabel());

    if (steps.length > 0) {
        const average =
            steps.reduce((total, entry) => total + (Number(entry.steps) || 0), 0) /
            steps.length;

        set("metricStepsAverage", formatAnalyticsNumber(average));
        set(
            "metricStepsAverageMeta",
            `Moyenne sur ${steps.length} jour${steps.length > 1 ? "s" : ""} renseigné${steps.length > 1 ? "s" : ""}`
        );
    } else {
        set("metricStepsAverage", "—");
        set("metricStepsAverageMeta", "Aucune journée renseignée");
    }

    const note = document.getElementById("analyticsPeriodNote");

    if (note) {
        note.textContent =
            `Période : ${formatAnalyticsDate(bounds.start)} – ${formatAnalyticsDate(bounds.end)}. ` +
            "Le poids actuel et l’objectif utilisent tout l’historique; les moyennes de pas et d’apports " +
            "utilisent uniquement les jours renseignés.";
    }
}

function updateWeightChart(bounds) {

    destroyAnalyticsChart(analyticsWeightChart);
    analyticsWeightChart = null;

    const weights = filterAnalyticsPeriod(getAnalyticsData("weights"), bounds);

    if (weights.length === 0) {
        setChartEmptyState("weightChart", "Ajoutez des pesées pour afficher votre évolution.");
        return;
    }

    const canvas = setChartReady("weightChart");
    if (!canvas) return;

    const colors = getAnalyticsTheme();
    const goal = typeof getGoal === "function" ? getGoal() : null;
    const datasets = [
        {
            label: "Poids",
            data: weights.map(entry => Number(entry.weight)),
            borderColor: ANALYTICS_COLORS.primary,
            backgroundColor: "rgba(109,92,232,.10)",
            fill: true,
            tension: 0.28,
            borderWidth: 3,
            pointRadius: weights.length < 18 ? 3 : 1,
            pointHoverRadius: 6,
            pointBackgroundColor: ANALYTICS_COLORS.primary
        }
    ];

    if (goal && Number.isFinite(Number(goal.weight))) {
        datasets.push({
            label: `Objectif · ${formatAnalyticsNumber(goal.weight, 1)} kg`,
            data: weights.map(() => Number(goal.weight)),
            borderColor: ANALYTICS_COLORS.secondary,
            backgroundColor: ANALYTICS_COLORS.secondary,
            borderDash: [7, 6],
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 0,
            fill: false,
            tension: 0
        });
    }

    const options = makeAnalyticsOptions("kg", {
        line: true,
        showLegend: datasets.length > 1,
        beginAtZero: false
    });

    options.plugins.tooltip.callbacks.title = items =>
        items && items.length ? formatAnalyticsDate(weights[items[0].dataIndex].date, { year: "numeric" }) : "";

    analyticsWeightChart = new Chart(canvas.getContext("2d"), {
        type: "line",
        data: {
            labels: weights.map(entry => formatAnalyticsDate(entry.date)),
            datasets
        },
        options
    });
}

function updateActivityChart(bounds) {

    destroyAnalyticsChart(analyticsActivityChart);
    analyticsActivityChart = null;

    const workouts = filterAnalyticsPeriod(getAnalyticsData("workouts"), bounds);

    if (workouts.length === 0) {
        setChartEmptyState("activityChart", "Aucune séance enregistrée sur cette période.");
        return;
    }

    const weeks = getWeeklyLabels(bounds);
    const counts = new Map(weeks.map(week => [week, 0]));

    workouts.forEach(workout => {
        const week = getWeekStartISO(workout.date);
        counts.set(week, (counts.get(week) || 0) + 1);
    });

    const canvas = setChartReady("activityChart");
    if (!canvas) return;

    analyticsActivityChart = new Chart(canvas.getContext("2d"), {
        type: "bar",
        data: {
            labels: weeks.map(formatAnalyticsDate),
            datasets: [{
                label: "Séances",
                data: weeks.map(week => counts.get(week) || 0),
                backgroundColor: ANALYTICS_COLORS.primary,
                borderRadius: 7,
                maxBarThickness: 32
            }]
        },
        options: makeAnalyticsOptions("séances", {
            beginAtZero: true,
            precision: 0
        })
    });
}

function updateStepsChart(bounds) {

    destroyAnalyticsChart(analyticsStepsChart);
    analyticsStepsChart = null;

    const steps = filterAnalyticsPeriod(getAnalyticsData("steps"), bounds);

    if (steps.length === 0) {
        setChartEmptyState("stepsChart", "Enregistrez vos pas pour suivre la tendance hebdomadaire.");
        return;
    }

    const weeks = getWeeklyLabels(bounds);
    const averages = averageValuesByWeek(getDailyStepTotals(steps), weeks);
    const canvas = setChartReady("stepsChart");

    if (!canvas) return;

    analyticsStepsChart = new Chart(canvas.getContext("2d"), {
        type: "bar",
        data: {
            labels: weeks.map(formatAnalyticsDate),
            datasets: [{
                label: "Moyenne par jour renseigné",
                data: averages,
                backgroundColor: ANALYTICS_COLORS.secondary,
                borderRadius: 7,
                maxBarThickness: 32
            }]
        },
        options: makeAnalyticsOptions("pas/jour", {
            beginAtZero: true,
            precision: 0
        })
    });
}

function updateCaloriesChart(bounds) {

    destroyAnalyticsChart(analyticsCaloriesChart);
    analyticsCaloriesChart = null;

    const meals = filterAnalyticsPeriod(getAnalyticsData("meals"), bounds);

    if (meals.length === 0) {
        setChartEmptyState("caloriesChart", "Enregistrez vos repas pour afficher les apports saisis.");
        return;
    }

    const weeks = getWeeklyLabels(bounds);
    const averages = averageValuesByWeek(getDailyMealTotals(meals), weeks);
    const canvas = setChartReady("caloriesChart");

    if (!canvas) return;

    analyticsCaloriesChart = new Chart(canvas.getContext("2d"), {
        type: "bar",
        data: {
            labels: weeks.map(formatAnalyticsDate),
            datasets: [{
                label: "Moyenne par jour saisi",
                data: averages,
                backgroundColor: ANALYTICS_COLORS.tertiary,
                borderRadius: 7,
                maxBarThickness: 32
            }]
        },
        options: makeAnalyticsOptions("kcal/jour", {
            beginAtZero: true,
            precision: 0
        })
    });
}

function updateMeasurementsChart(bounds = getAnalyticsBounds()) {

    destroyAnalyticsChart(analyticsMeasurementsChart);
    analyticsMeasurementsChart = null;

    const measurements = filterAnalyticsPeriod(
        getAnalyticsData("measurements"),
        bounds
    );

    if (measurements.length === 0) {
        setChartEmptyState("measurementsChart", "Ajoutez des mensurations pour comparer leur évolution.");
        return;
    }

    const selector = document.getElementById("measurementSelector");
    const selected = selector ? selector.value : "waist";
    const configs = {
        waist: { label: "Tour de taille", key: "waist", color: ANALYTICS_COLORS.primary },
        chest: { label: "Poitrine", key: "chest", color: ANALYTICS_COLORS.blue },
        hips: { label: "Hanches", key: "hips", color: ANALYTICS_COLORS.secondary },
        arms: { label: "Bras", key: "arms", color: ANALYTICS_COLORS.pink },
        thighs: { label: "Cuisses", key: "thighs", color: ANALYTICS_COLORS.tertiary }
    };

    const selectedConfigs = selected === "all"
        ? Object.values(configs)
        : configs[selected] ? [configs[selected]] : [configs.waist];

    const datasets = selectedConfigs.map(config => ({
        label: config.label,
        data: measurements.map(entry => {
            const value = Number(entry[config.key]);
            return Number.isFinite(value) && value > 0 ? value : null;
        }),
        borderColor: config.color,
        backgroundColor: config.color,
        tension: 0.28,
        borderWidth: 2.5,
        pointRadius: measurements.length < 18 ? 3 : 1,
        pointHoverRadius: 6,
        fill: false,
        spanGaps: false
    }));

    if (!datasets.some(dataset => dataset.data.some(value => value !== null))) {
        setChartEmptyState("measurementsChart", "Aucune valeur de mensuration sur cette période.");
        return;
    }

    const canvas = setChartReady("measurementsChart");
    if (!canvas) return;

    const options = makeAnalyticsOptions("cm", {
        line: true,
        showLegend: datasets.length > 1,
        beginAtZero: false
    });

    options.plugins.tooltip.callbacks.title = items =>
        items && items.length
            ? formatAnalyticsDate(measurements[items[0].dataIndex].date, { year: "numeric" })
            : "";

    analyticsMeasurementsChart = new Chart(canvas.getContext("2d"), {
        type: "line",
        data: {
            labels: measurements.map(entry => formatAnalyticsDate(entry.date)),
            datasets
        },
        options
    });
}

function refreshCharts() {

    const bounds = getAnalyticsBounds();

    updateAnalyticsSummary(bounds);
    updateWeightChart(bounds);
    updateActivityChart(bounds);
    updateStepsChart(bounds);
    updateCaloriesChart(bounds);
    updateMeasurementsChart(bounds);
}

function initializeAnalyticsControls() {

    const range = document.getElementById("analyticsRange");

    if (range) {
        range.addEventListener("change", refreshCharts);
    }
}

const analyticsThemeObserver = new MutationObserver(() => {
    refreshCharts();
});

analyticsThemeObserver.observe(document.body, {
    attributes: true,
    attributeFilter: ["class"]
});
