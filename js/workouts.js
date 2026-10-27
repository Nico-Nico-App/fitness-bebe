/* ======================================
   VARIABLES
====================================== */

let currentWorkoutExercises = [];

const CARDIO_EXERCISES = [
    "Course",
    "Vélo",
    "Natation",
    "Tapis"
];

/* Coefficients d'intensité (MET) : calories = MET × poids × durée (h) */
const ACTIVITY_MET = {
    "Course": 10,
    "Vélo": 8,
    "Natation": 11,
    "Tapis": 9
};

const STRENGTH_MET = 5;

/* Durée estimée par série si aucune durée n'est saisie (effort + repos) */
const MINUTES_PER_SET = 3;

/* ======================================
   OUTILS
====================================== */

function isCardioActivity(activity) {

    if (activity.type) {
        return activity.type === "cardio";
    }

    return activity.distance !== undefined;
}

/* Liste des activités d'une séance (compatible anciennes données) */
function getWorkoutActivities(day) {

    if (Array.isArray(day.exercises)) {
        return day.exercises;
    }

    if (Array.isArray(day.activities)) {
        return day.activities;
    }

    return [];
}

function getBodyWeight() {

    const weights = load("weights");

    if (weights.length > 0) {
        return weights[weights.length - 1].weight;
    }

    return 80;
}

function getWalkingCoefficient() {

    const select =
        document.getElementById("walkingType");

    return parseFloat(select && select.value) || 0.75;
}

/* Estimation des calories d'une activité (cardio ou musculation) */
function estimateActivityCalories(activity) {

    const met =
        ACTIVITY_MET[activity.exercise] ||
        (isCardioActivity(activity) ? 8 : STRENGTH_MET);

    return Math.round(
        met *
        getBodyWeight() *
        ((activity.duration || 0) / 60)
    );
}

function computeWalkingCalories() {

    const field =
        document.getElementById("walkingDistance");

    const distance =
        parseFloat(field && field.value) || 0;

    return Math.round(
        getBodyWeight() *
        distance *
        getWalkingCoefficient()
    );
}

/* ======================================
   BROUILLON DE SÉANCE
   (conservé si on quitte ou recharge la page)
====================================== */

function saveWorkoutDraft() {

    try {

        const walking =
            document.getElementById("walkingDistance");

        localStorage.setItem(
            "workoutDraft",
            JSON.stringify({
                exercises: currentWorkoutExercises,
                walkingDistance: walking ? walking.value : ""
            })
        );

    } catch (error) {

        console.error(error);
    }
}

function restoreWorkoutDraft() {

    try {

        const draft =
            JSON.parse(localStorage.getItem("workoutDraft"));

        if (!draft) return;

        if (Array.isArray(draft.exercises)) {
            currentWorkoutExercises = draft.exercises;
        }

        const walking =
            document.getElementById("walkingDistance");

        if (walking && draft.walkingDistance) {
            walking.value = draft.walkingDistance;
        }

    } catch (error) {

        console.error(error);
    }
}

/* ======================================
   AJOUTER UNE ACTIVITÉ À LA SÉANCE
====================================== */

function queueExercise() {

    const exercise =
        document.getElementById("exercise").value;

    if (!exercise) return;

    const activity = {
        exercise,
        type: CARDIO_EXERCISES.includes(exercise)
            ? "cardio"
            : "strength"
    };

    if (activity.type === "strength") {

        activity.sets =
            parseInt(document.getElementById("sets").value) || 0;

        activity.reps =
            parseInt(document.getElementById("reps").value) || 0;

        if (activity.sets <= 0 || activity.reps <= 0) {

            alert("Indiquez le nombre de séries et de répétitions.");
            return;
        }

        const enteredDuration =
            parseInt(document.getElementById("strengthDuration").value) || 0;

        activity.durationEstimated = enteredDuration <= 0;

        activity.duration =
            enteredDuration > 0
                ? enteredDuration
                : activity.sets * MINUTES_PER_SET;

    } else {

        activity.distance =
            parseFloat(document.getElementById("distance").value) || 0;

        activity.duration =
            parseInt(document.getElementById("duration").value) || 0;

        if (activity.duration <= 0) {

            alert("Indiquez la durée de l'activité.");
            return;
        }
    }

    currentWorkoutExercises.push(activity);

    renderExerciseQueue();

    clearExerciseFields();
}

/* ======================================
   AFFICHER LA FILE D'ATTENTE
====================================== */

function renderExerciseQueue() {

    const container =
        document.getElementById("exerciseQueue");

    if (!container) return;

    if (currentWorkoutExercises.length === 0) {

        container.innerHTML = `
            <p class="empty-session">
                Aucune activité ajoutée
            </p>
        `;

        updateSessionSummary();

        return;
    }

    container.innerHTML =
        currentWorkoutExercises
            .map((activity, index) => {

                const duration =
                    `${activity.duration} min${
                        activity.durationEstimated
                            ? " (estimée)"
                            : ""
                    }`;

                const details =
                    (isCardioActivity(activity)
                        ? `${activity.distance} km<br>${duration}`
                        : `${activity.sets} séries × ${activity.reps} reps<br>${duration}`)
                    + `<br>🔥 ~${estimateActivityCalories(activity)} kcal`;

                return `
                    <div class="exercise-row">

                        <strong>
                            ${isCardioActivity(activity) ? "🚴" : "🏋️"}
                        ${escapeHtml(activity.exercise)}
                        </strong>

                        <br>

                        ${details}

                        <br><br>

                        <button
                            type="button"
                            onclick="removeExercise(${index})">
                            🗑️ Supprimer
                        </button>

                    </div>
                `;
            })
            .join("");

    updateSessionSummary();
}

/* ======================================
   RETIRER UNE ACTIVITÉ
====================================== */

function removeExercise(index) {

    currentWorkoutExercises.splice(index, 1);

    renderExerciseQueue();
}

/* ======================================
   VIDER LES CHAMPS D'ACTIVITÉ
====================================== */

function clearExerciseFields() {

    [
        "sets",
        "reps",
        "strengthDuration",
        "distance",
        "duration"
    ].forEach(id => {

        const field =
            document.getElementById(id);

        if (field) {
            field.value = "";
        }
    });
}

/* ======================================
   RÉSUMÉ DE LA SÉANCE EN COURS
====================================== */

function updateSessionSummary() {

    saveWorkoutDraft();

    const count =
        document.getElementById("activityCount");

    const distance =
        document.getElementById("totalDistance");

    const calories =
        document.getElementById("summaryCalories");

    const totalCalories =
        document.getElementById("totalCalories");

    const activitiesCaloriesField =
        document.getElementById("activitiesCalories");

    if (count) {
        count.textContent =
            currentWorkoutExercises.length;
    }

    if (distance) {

        const total =
            currentWorkoutExercises
                .filter(isCardioActivity)
                .reduce(
                    (sum, ex) => sum + (ex.distance || 0),
                    0
                );

        distance.textContent =
            total.toFixed(1) + " km";
    }

    if (calories) {
        calories.textContent =
            computeWalkingCalories() + " kcal";
    }

    const activitiesCalories =
        currentWorkoutExercises.reduce(
            (sum, ex) => sum + estimateActivityCalories(ex),
            0
        );

    if (activitiesCaloriesField) {
        activitiesCaloriesField.textContent =
            activitiesCalories + " kcal";
    }

    if (totalCalories) {
        totalCalories.textContent =
            (activitiesCalories + computeWalkingCalories()) + " kcal";
    }
}

/* ======================================
   ENREGISTRER LA SÉANCE COMPLÈTE
====================================== */

function saveWorkoutDay() {

    const date =
        document.getElementById("workoutDate").value;

    if (!date) {

        alert("Veuillez sélectionner une date.");
        return;
    }

    const walkingDistance =
        parseFloat(
            document.getElementById("walkingDistance").value
        ) || 0;

    if (walkingDistance < 0) {
        alert("La distance de marche ne peut pas être négative.");
        return;
    }

    if (currentWorkoutExercises.length === 0 && walkingDistance <= 0) {

        alert("Ajoutez une activité ou indiquez une distance de marche.");
        return;
    }

    const walkingCalories =
        computeWalkingCalories();

    const activities =
        currentWorkoutExercises.map(ex => ({
            ...ex,
            calories: estimateActivityCalories(ex)
        }));

    const activitiesCalories =
        activities.reduce(
            (total, ex) => total + ex.calories,
            0
        );

    const workouts =
        load("workouts");

    workouts.push({
        date,
        exercises: activities,
        walkingDistance,
        walkingCalories,
        activitiesCalories,
        totalCalories: activitiesCalories + walkingCalories
    });

    workouts.sort(
        (a, b) =>
            new Date(a.date) -
            new Date(b.date)
    );

    save("workouts", workouts);

    currentWorkoutExercises = [];

    clearWorkoutDayForm();

    renderExerciseQueue();

    refreshAllDisplays();

    alert("Séance enregistrée ✅");
}

/* ======================================
   RESET
====================================== */

function clearWorkoutDayForm() {

    document.getElementById("workoutDate").value =
        getLocalDateISO();

    document.getElementById("walkingDistance").value = "";

    const calories =
        document.getElementById("walkingCalories");

    if (calories) {
        calories.textContent = "0 kcal";
    }

    clearExerciseFields();
}

/* ======================================
   HISTORIQUE
====================================== */

function renderHistory() {

    const history =
        document.getElementById("history");

    if (!history) return;

    const workouts =
        load("workouts");

    if (workouts.length === 0) {

        history.innerHTML =
            "<p>Aucune séance enregistrée.</p>";

        return;
    }

    history.innerHTML =
        workouts
            .slice()
            .reverse()
            .map(day => {

                const activitiesHtml =
                    getWorkoutActivities(day)
                        .map(ex => {

                            if (!isCardioActivity(ex)) {

                                return `
                                    🏋️ ${escapeHtml(ex.exercise)}
                                    <br>
                                    ${ex.sets}×${ex.reps}
                                    ${ex.duration ? `- ${ex.duration} min` : ""}
                                    ${ex.calories ? `- 🔥 ${ex.calories} kcal` : ""}
                                    <br><br>
                                `;
                            }

                            return `
                                🚴 ${escapeHtml(ex.exercise)}
                                <br>
                                ${ex.distance} km - ${ex.duration} min
                                ${ex.calories ? `- 🔥 ${ex.calories} kcal` : ""}
                                <br><br>
                            `;
                        })
                        .join("");

                const walkingHtml =
                    day.walkingDistance > 0
                        ? `
                            🚶 Marche : ${day.walkingDistance} km
                            <br>
                            🔥 ${day.walkingCalories} kcal
                        `
                        : "";

                return `
                    <div class="history-item">

                    <strong>📅 ${escapeHtml(day.date)}</strong>

                        <br><br>

                        ${activitiesHtml}

                        ${walkingHtml}

                        ${
                            day.totalCalories
                                ? `<br><br><strong>🔥 Total estimé : ${day.totalCalories} kcal</strong>`
                                : ""
                        }

                    </div>
                `;
            })
            .join("");
}

/* ======================================
   INITIALISATION
====================================== */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const button =
            document.getElementById("addExerciseBtn");

        if (button) {
            button.addEventListener("click", queueExercise);
        }

        restoreWorkoutDraft();

        renderExerciseQueue();
    }
);
