/* =====================================
   INITIALISATION
===================================== */

document.addEventListener("DOMContentLoaded", () => {

    initializeStorage();
    initializeTabs();
    initializeTheme();
    initializeDates();
    initializeProfile();
    initializeSteps();
    initializeMeasurementSelector();
    initializeAnalyticsControls();
    initializeHistoryButtons();
    initializeWalkingCalculator();
    initializeExerciseType();

    refreshDashboard();
});

/* =====================================
   RAFRAICHISSEMENT GLOBAL
===================================== */

function refreshDashboard() {

    displayGoal();
    renderWeights();
    renderMeasurements();
    renderHistory();
    renderMeals();
    renderProfile();
    renderSteps();
    updateBMI();
    refreshCharts();
}

function refreshAllDisplays() {
    refreshDashboard();
}

function saveBodyMetrics() {
    const value = id =>
        document.getElementById(id).value.trim();

    const weightDate = value("weightDate");
    const weightRaw = value("weightValue");
    const heightRaw = value("heightValue");
    const measurementDate = value("measurementDate");
    const measurementIds = ["waist", "chest", "hips", "arms", "thighs"];
    const measurementLabels = {
        waist: "tour de taille",
        chest: "tour de poitrine",
        hips: "tour de hanches",
        arms: "tour de bras",
        thighs: "tour de cuisses"
    };
    const measurementRaw = measurementIds.map(value);
    const sexRaw = value("profileSex");
    const birthYearRaw = value("profileBirthYear");

    const hasWeightData =
        Boolean(weightRaw || heightRaw || weightEditIndex !== null);
    const hasMeasurementData =
        measurementRaw.some(Boolean) || measurementEditIndex !== null;
    const hasProfileData =
        Boolean(sexRaw || birthYearRaw);

    if (!hasWeightData && !hasMeasurementData && !hasProfileData) {
        alert("Renseignez au moins une donnée avant d’enregistrer.");
        return;
    }

    const errors = [];
    let nextWeights = null;
    let nextMeasurements = null;
    let nextProfile = null;
    const savedLabels = [];

    if (hasWeightData) {
        const weights = load("weights").map(entry => ({ ...entry }));

        if (weightRaw) {
            const weight = Number(weightRaw);
            const height = heightRaw ? Number(heightRaw) : null;

            if (!weightDate) errors.push("Choisissez la date de pesée.");
            if (!Number.isFinite(weight) || weight <= 0) {
                errors.push("Saisissez un poids supérieur à zéro.");
            }
            if (heightRaw && (!Number.isFinite(height) || height <= 0)) {
                errors.push("Saisissez une taille supérieure à zéro.");
            }

            if (weightEditIndex !== null &&
                (!Number.isInteger(weightEditIndex) ||
                    weightEditIndex < 0 ||
                    weightEditIndex >= weights.length)) {
                errors.push("La pesée à modifier n’a pas été retrouvée.");
            }

            if (!errors.length) {
                const entry = {
                    date: weightDate,
                    weight,
                    height: heightRaw ? height : getCurrentHeight() || null
                };

                if (weightEditIndex === null) {
                    weights.push(entry);
                } else {
                    weights[weightEditIndex] = entry;
                }

                weights.sort((a, b) => new Date(a.date) - new Date(b.date));
                nextWeights = weights;
                savedLabels.push(heightRaw ? "poids et taille" : "poids");
            }
        } else if (heightRaw) {
            const height = Number(heightRaw);
            const targetIndex =
                weightEditIndex !== null
                    ? weightEditIndex
                    : weights.length - 1;

            if (!Number.isFinite(height) || height <= 0) {
                errors.push("Saisissez une taille supérieure à zéro.");
            } else if (
                !Number.isInteger(targetIndex) ||
                targetIndex < 0 ||
                targetIndex >= weights.length
            ) {
                errors.push("Ajoutez d’abord une pesée pour enregistrer la taille.");
            } else {
                weights[targetIndex].height = height;
                nextWeights = weights;
                savedLabels.push("taille");
            }
        } else {
            errors.push("Saisissez un poids pour modifier la pesée.");
        }
    }

    if (hasMeasurementData) {
        const groupErrorCount = errors.length;
        const values = {};
        const hasMeasurementValue = measurementRaw.some(Boolean);

        if (!measurementDate) {
            errors.push("Choisissez la date des mensurations.");
        }
        if (!hasMeasurementValue) {
            errors.push("Renseignez au moins une mensuration.");
        }
        if (measurementEditIndex !== null) {
            const measurements = load("measurements");
            if (
                !Number.isInteger(measurementEditIndex) ||
                measurementEditIndex < 0 ||
                measurementEditIndex >= measurements.length
            ) {
                errors.push("Les mensurations à modifier n’ont pas été retrouvées.");
            }
        }

        measurementIds.forEach((id, index) => {
            const raw = measurementRaw[index];
            const number = raw ? Number(raw) : 0;

            if (raw && (!Number.isFinite(number) || number <= 0)) {
                errors.push(`Saisissez une valeur valide pour le ${measurementLabels[id]}.`);
            }

            values[id] = number;
        });

        if (errors.length === groupErrorCount) {
            const measurements =
                load("measurements").map(entry => ({ ...entry }));
            const entry = { date: measurementDate, ...values };

            if (measurementEditIndex === null) {
                measurements.push(entry);
            } else {
                measurements[measurementEditIndex] = entry;
            }

            measurements.sort((a, b) => new Date(a.date) - new Date(b.date));
            nextMeasurements = measurements;
            savedLabels.push("mensurations");
        }
    }

    if (hasProfileData) {
        const groupErrorCount = errors.length;
        const existingProfile = getProfile() || {};
        const sex = sexRaw || existingProfile.sex || "";
        const birthYear = birthYearRaw
            ? Number(birthYearRaw)
            : Number(existingProfile.birthYear);
        const currentYear = new Date().getFullYear();

        if (!["female", "male"].includes(sex)) {
            errors.push("Choisissez le sexe dans le profil.");
        }
        if (
            !Number.isInteger(birthYear) ||
            birthYear < currentYear - 100 ||
            birthYear > currentYear - 10
        ) {
            errors.push("Saisissez une année de naissance valide dans le profil.");
        }

        if (errors.length === groupErrorCount) {
            nextProfile = { sex, birthYear };
            savedLabels.push("profil");
        }
    }

    if (errors.length > 0) {
        alert(`Vérifiez les données avant l’enregistrement :\n• ${[...new Set(errors)].join("\n• ")}`);
        return;
    }

    if (nextWeights) {
        save("weights", nextWeights);
        clearWeightForm();
        if (heightRaw) {
            document.getElementById("heightValue").value = "";
        }
    }

    if (nextMeasurements) {
        save("measurements", nextMeasurements);
        clearMeasurementForm();
    }

    if (nextProfile) {
        localStorage.setItem("profile", JSON.stringify(nextProfile));
    }

    refreshDashboard();
    alert(`Données enregistrées : ${savedLabels.join(", ")} ✅`);
}

/* =====================================
   ONGLETS
===================================== */

function initializeTabs() {

    const buttons =
        document.querySelectorAll(".tab-btn");

    const tabs =
        document.querySelectorAll(".tab-content");

    buttons.forEach(button => {

        button.addEventListener("click", () => {

            buttons.forEach(btn => btn.classList.remove("active"));
            tabs.forEach(tab => tab.classList.remove("active"));

            button.classList.add("active");

            const target =
                document.getElementById(button.dataset.tab);

            if (target) {
                target.classList.add("active");
            }

            if (button.dataset.tab === "graphs") {

                setTimeout(refreshCharts, 100);
            }
        });
    });
}

/* Affiche un onglet par programmation (ex. depuis un bouton Modifier) */
function showTab(tabId) {

    const button =
        document.querySelector(`.tab-btn[data-tab="${tabId}"]`);

    if (button) {
        button.click();
    }
}

/* =====================================
   MODE SOMBRE
===================================== */

function initializeTheme() {

    const btn =
        document.getElementById("darkModeBtn");

    if (!btn) return;

    if (localStorage.getItem("theme") === "dark") {

        document.body.classList.add("dark");

        btn.textContent = "☀️ Mode clair";
    }

    btn.addEventListener("click", () => {

        document.body.classList.toggle("dark");

        const darkMode =
            document.body.classList.contains("dark");

        localStorage.setItem(
            "theme",
            darkMode ? "dark" : "light"
        );

        btn.textContent =
            darkMode
                ? "☀️ Mode clair"
                : "🌙 Mode sombre";
    });
}

/* =====================================
   DATES PAR DEFAUT
===================================== */

function initializeDates() {

    const today =
        getLocalDateISO();

    [
        "weightDate",
        "measurementDate",
        "workoutDate",
        "mealDate",
        "stepsDate"
    ].forEach(id => {

        const field =
            document.getElementById(id);

        if (field && !field.value) {
            field.value = today;
        }
    });
}

/* =====================================
   SELECTEUR MENSURATIONS
===================================== */

function initializeMeasurementSelector() {

    const selector =
        document.getElementById("measurementSelector");

    if (!selector) return;

    selector.addEventListener(
        "change",
        updateMeasurementsChart
    );
}

/* =====================================
   HISTORIQUE AFFICHER PLUS
===================================== */

function initializeHistoryButtons() {

    const button =
        document.getElementById("toggleWeightHistory");

    const history =
        document.getElementById("weightHistory");

    if (!button || !history) return;

    button.addEventListener("click", () => {

        history.classList.toggle("expanded");

        renderWeights();
    });
}

/* ======================================
   CALCULATEUR MARCHE
====================================== */

function initializeWalkingCalculator() {

    const distanceField =
        document.getElementById("walkingDistance");

    const caloriesField =
        document.getElementById("walkingCalories");

    const walkingType =
        document.getElementById("walkingType");

    if (!distanceField || !caloriesField) return;

    const update = () => {

        caloriesField.textContent =
            computeWalkingCalories() + " kcal";

        updateSessionSummary();
    };

    distanceField.addEventListener("input", update);

    if (walkingType) {
        walkingType.addEventListener("change", update);
    }

    update();
}

/* =====================================
   CALCUL IMC
===================================== */

function updateBMI() {

    const bmiField =
        document.getElementById("currentBMI");

    if (!bmiField) return;

    const bmi = calculateBMI();

    if (bmi === null) {

        bmiField.textContent = "-";

        return;
    }

    let label;

    if (bmi < 18.5) {
        label = "Insuffisance";
    } else if (bmi < 25) {
        label = "Normal";
    } else if (bmi < 30) {
        label = "Surpoids";
    } else {
        label = "Obésité";
    }

    bmiField.textContent =
        `${bmi.toFixed(1)} (${label})`;
}

/* =====================================
   TYPE D'ACTIVITÉ (MUSCU / CARDIO)
===================================== */

function initializeExerciseType() {

    const exercise =
        document.getElementById("exercise");

    const strengthFields =
        document.getElementById("strengthFields");

    const cardioFields =
        document.getElementById("cardioFields");

    if (!exercise || !strengthFields || !cardioFields) return;

    function updateFields() {

        const cardio =
            CARDIO_EXERCISES.includes(exercise.value);

        strengthFields.style.display =
            cardio ? "none" : "grid";

        cardioFields.style.display =
            cardio ? "grid" : "none";
    }

    exercise.addEventListener("change", updateFields);

    updateFields();
}
