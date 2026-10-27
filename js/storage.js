// =====================================
// storage.js
// Gestion du LocalStorage
// =====================================

function getLocalDateISO(date = new Date()) {

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function escapeHtml(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

/**
 * Sauvegarder une donnée
 */
function save(key, data) {

    try {

        localStorage.setItem(
            key,
            JSON.stringify(data)
        );

    } catch (error) {

        console.error(
            "Erreur sauvegarde :",
            error
        );

        alert(
            "Impossible de sauvegarder les données."
        );
    }
}

/**
 * Charger une donnée
 */
function load(key) {

    try {

        const data =
            localStorage.getItem(key);

        if (!data) {
            return [];
        }

        return JSON.parse(data);

    } catch (error) {

        console.error(
            "Erreur chargement :",
            error
        );

        return [];
    }
}

/**
 * Supprimer une clé
 */
function remove(key) {

    localStorage.removeItem(key);
}

/**
 * Vérifier si une clé existe
 */
function exists(key) {

    return localStorage.getItem(key) !== null;
}

/**
 * Retourner toutes les données
 */
function getAllData() {

    return {

        weights:
            load("weights"),

        workouts:
            load("workouts"),

        measurements:
            load("measurements"),

        meals:
            load("meals"),

        steps:
            load("steps"),

        profile:
            JSON.parse(
                localStorage.getItem("profile")
            ) || null,

        goal:
            JSON.parse(
                localStorage.getItem("goal")
            ) || null,

        customExercises:
            load("customExercises"),

        photos:
            load("photos")
    };
}

function requireRecord(value, label) {

    if (!value || typeof value !== "object" || Array.isArray(value)) {
        throw new Error(`${label} doit être un objet.`);
    }

    return value;
}

function requireArray(value, label, maxItems = 10000) {

    if (!Array.isArray(value) || value.length > maxItems) {
        throw new Error(`${label} doit être une liste valide.`);
    }

    return value;
}

function requireDate(value, label) {

    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        throw new Error(`${label} doit être une date au format AAAA-MM-JJ.`);
    }

    const [year, month, day] = value.split("-").map(Number);
    const parsed = new Date(Date.UTC(year, month - 1, day));

    if (
        parsed.getUTCFullYear() !== year ||
        parsed.getUTCMonth() !== month - 1 ||
        parsed.getUTCDate() !== day
    ) {
        throw new Error(`${label} n'est pas une date valide.`);
    }

    return value;
}

function requireNumber(value, label, min = 0, max = 1000000, integer = false) {

    if (
        typeof value !== "number" ||
        !Number.isFinite(value) ||
        value < min ||
        value > max ||
        (integer && !Number.isInteger(value))
    ) {
        throw new Error(`${label} contient une valeur numérique invalide.`);
    }

    return value;
}

function optionalNumber(record, key, label, min = 0, max = 1000000, integer = false) {

    if (!Object.prototype.hasOwnProperty.call(record, key)) {
        return undefined;
    }

    return requireNumber(record[key], label, min, max, integer);
}

function normalizeBackupData(data) {

    requireRecord(data, "La sauvegarde");

    const weights = requireArray(data.weights, "Les pesées").map((entry, index) => {
        requireRecord(entry, `La pesée ${index + 1}`);

        const normalized = {
            date: requireDate(entry.date, `La date de la pesée ${index + 1}`),
            weight: requireNumber(entry.weight, `Le poids ${index + 1}`, 0.1, 1000)
        };

        if (entry.height !== undefined && entry.height !== null) {
            normalized.height = requireNumber(entry.height, `La taille ${index + 1}`, 1, 300);
        } else {
            normalized.height = null;
        }

        return normalized;
    });

    const workouts = requireArray(data.workouts, "Les séances").map((day, dayIndex) => {
        requireRecord(day, `La séance ${dayIndex + 1}`);

        const sourceActivities =
            Array.isArray(day.exercises) ? day.exercises
            : Array.isArray(day.activities) ? day.activities
            : [];

        const exercises = requireArray(
            sourceActivities,
            `Les activités de la séance ${dayIndex + 1}`,
            1000
        ).map((activity, activityIndex) => {
            requireRecord(activity, `L'activité ${activityIndex + 1}`);

            if (
                typeof activity.exercise !== "string" ||
                !activity.exercise.trim() ||
                activity.exercise.length > 100
            ) {
                throw new Error(`Le nom de l'activité ${activityIndex + 1} est invalide.`);
            }

            if (
                activity.type !== undefined &&
                activity.type !== "cardio" &&
                activity.type !== "strength"
            ) {
                throw new Error(`Le type de l'activité ${activityIndex + 1} est invalide.`);
            }

            const normalized = {
                exercise: activity.exercise,
                ...(activity.type ? { type: activity.type } : {})
            };

            ["sets", "reps", "duration", "distance", "calories"].forEach(key => {
                const value = optionalNumber(
                    activity,
                    key,
                    `${key} de l'activité ${activityIndex + 1}`,
                    0,
                    100000,
                    key === "sets" || key === "reps"
                );

                if (value !== undefined) normalized[key] = value;
            });

            if (activity.durationEstimated !== undefined) {
                if (typeof activity.durationEstimated !== "boolean") {
                    throw new Error(`La durée estimée de l'activité ${activityIndex + 1} est invalide.`);
                }

                normalized.durationEstimated = activity.durationEstimated;
            }

            return normalized;
        });

        const normalized = {
            date: requireDate(day.date, `La date de la séance ${dayIndex + 1}`),
            exercises,
            walkingDistance: optionalNumber(day, "walkingDistance", "La distance de marche") ?? 0,
            walkingCalories: optionalNumber(day, "walkingCalories", "Les calories de marche") ?? 0,
            activitiesCalories: optionalNumber(day, "activitiesCalories", "Les calories des activités") ?? 0,
            totalCalories: optionalNumber(day, "totalCalories", "Le total calorique") ?? 0
        };

        return normalized;
    });

    const measurements = requireArray(data.measurements, "Les mensurations").map((entry, index) => {
        requireRecord(entry, `La mensuration ${index + 1}`);

        const normalized = {
            date: requireDate(entry.date, `La date de la mensuration ${index + 1}`)
        };

        ["waist", "chest", "hips", "arms", "thighs"].forEach(key => {
            normalized[key] =
                optionalNumber(entry, key, `${key} de la mensuration ${index + 1}`, 0, 1000) ?? 0;
        });

        return normalized;
    });

    const validMealTypes = ["breakfast", "lunch", "dinner", "snack"];
    const meals = requireArray(data.meals, "Les repas").map((meal, index) => {
        requireRecord(meal, `Le repas ${index + 1}`);

        if (
            typeof meal.name !== "string" ||
            !meal.name.trim() ||
            meal.name.length > 200 ||
            !validMealTypes.includes(meal.type)
        ) {
            throw new Error(`Le repas ${index + 1} contient des informations invalides.`);
        }

        if (
            meal.foodId !== undefined &&
            meal.foodId !== null &&
            (typeof meal.foodId !== "string" || !/^\d{1,3}-\d{1,3}$/.test(meal.foodId))
        ) {
            throw new Error(`L'aliment du repas ${index + 1} est invalide.`);
        }

        let quantity = null;

        if (meal.quantity !== undefined && meal.quantity !== null) {
            quantity = requireNumber(meal.quantity, `La quantité du repas ${index + 1}`, 0.01, 10000);
        }

        return {
            date: requireDate(meal.date, `La date du repas ${index + 1}`),
            type: meal.type,
            name: meal.name,
            foodId: meal.foodId || null,
            quantity,
            calories: requireNumber(meal.calories, `Les calories du repas ${index + 1}`, 0, 100000)
        };
    });

    const steps = requireArray(data.steps, "Les pas").map((entry, index) => {
        requireRecord(entry, `L'entrée de pas ${index + 1}`);

        return {
            date: requireDate(entry.date, `La date des pas ${index + 1}`),
            steps: requireNumber(entry.steps, `Le nombre de pas ${index + 1}`, 0, 1000000, true)
        };
    });

    let profile = null;

    if (data.profile !== undefined && data.profile !== null) {
        requireRecord(data.profile, "Le profil");

        const currentYear = new Date().getFullYear();

        if (
            !["female", "male"].includes(data.profile.sex) ||
            !Number.isInteger(data.profile.birthYear) ||
            data.profile.birthYear < currentYear - 100 ||
            data.profile.birthYear > currentYear - 10
        ) {
            throw new Error("Le profil contient des informations invalides.");
        }

        profile = {
            sex: data.profile.sex,
            birthYear: data.profile.birthYear
        };
    }

    let goal = null;

    if (data.goal !== undefined && data.goal !== null) {
        requireRecord(data.goal, "L'objectif");

        goal = {
            weight: requireNumber(data.goal.weight, "Le poids cible", 0.1, 1000),
            date: data.goal.date ? requireDate(data.goal.date, "La date cible") : ""
        };
    }

    const customExercises = requireArray(data.customExercises || [], "Les exercices personnalisés");
    const photos = requireArray(data.photos || [], "Les photos");

    const normalized = {
        weights,
        workouts,
        measurements,
        meals,
        steps,
        profile,
        goal,
        customExercises,
        photos
    };

    if (JSON.stringify(normalized).length > 10000000) {
        throw new Error("La sauvegarde est trop volumineuse.");
    }

    return normalized;
}

/**
 * Sauvegarder toutes les données
 */
function setAllData(data) {

    const normalized = normalizeBackupData(data);

    [
        "weights",
        "workouts",
        "measurements",
        "meals",
        "steps",
        "customExercises",
        "photos"
    ].forEach(key => save(key, normalized[key]));

    if (normalized.profile) {
        localStorage.setItem("profile", JSON.stringify(normalized.profile));
    } else {
        localStorage.removeItem("profile");
    }

    if (normalized.goal) {
        localStorage.setItem("goal", JSON.stringify(normalized.goal));
    } else {
        localStorage.removeItem("goal");
    }
}

/**
 * Export JSON complet
 */
function exportBackup() {

    const data =
        getAllData();

    const json =
        JSON.stringify(
            data,
            null,
            2
        );

    const blob =
        new Blob(
            [json],
            {
                type:
                "application/json"
            }
        );

    const url =
        URL.createObjectURL(blob);

    const a =
        document.createElement("a");

    a.href = url;

    a.download =
        "fitness-tracker-backup.json";

    a.click();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Import JSON complet
 */
function importBackup(file) {

    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
        alert("Le fichier de sauvegarde dépasse la limite de 10 Mo.");
        return;
    }

    if (!confirm("L'import remplacera les données enregistrées dans ce navigateur. Continuer ?")) {
        return;
    }

    const reader =
        new FileReader();

    reader.onload = function (event) {

        try {

            const data =
                JSON.parse(
                    event.target.result
                );

            setAllData(data);

            alert(
                "Import terminé."
            );

            location.reload();

        } catch (error) {

            console.error(error);

            alert(
                error.message || "Fichier de sauvegarde invalide."
            );
        }
    };

    reader.onerror = function () {
        alert("Impossible de lire le fichier de sauvegarde.");
    };

    reader.readAsText(file);
}

/**
 * Réinitialisation totale
 */
function resetApplication() {

    const confirmReset =
        confirm(
            "Voulez-vous supprimer toutes les données ?"
        );

    if (!confirmReset) {
        return;
    }

    localStorage.clear();

    alert(
        "Toutes les données ont été supprimées."
    );

    location.reload();
}

/**
 * Taille occupée dans le navigateur
 */
function getStorageSize() {

    let total = 0;

    for (let key in localStorage) {

        if (
            localStorage.hasOwnProperty(key)
        ) {

            total +=
                (
                    localStorage[key]
                        .length +
                    key.length
                ) * 2;
        }
    }

    return (
        (total / 1024).toFixed(2)
        + " KB"
    );
}

/**
 * Informations de stockage
 */
function storageInfo() {

    console.log(
        "Poids :",
        load("weights").length
    );

    console.log(
        "Séances :",
        load("workouts").length
    );

    console.log(
        "Mensurations :",
        load("measurements").length
    );

    console.log(
        "Taille stockage :",
        getStorageSize()
    );
}

/**
 * Initialisation application
 */
function initializeStorage() {

    if (!exists("weights")) {
        save("weights", []);
    }

    if (!exists("workouts")) {
        save("workouts", []);
    }

    if (!exists("measurements")) {
        save("measurements", []);
    }

    if (!exists("meals")) {
        save("meals", []);
    }

    if (!exists("steps")) {
        save("steps", []);
    }

    if (!exists("customExercises")) {
        save("customExercises", []);
    }

    if (!exists("photos")) {
        save("photos", []);
    }

    removeLegacyLoadField();
}

/**
 * Supprime l'ancienne notion de charge des séances déjà enregistrées
 */
function removeLegacyLoadField() {

    const workouts = load("workouts");

    let changed = false;

    workouts.forEach(day => {

        [day.exercises, day.activities].forEach(list => {

            if (!Array.isArray(list)) return;

            list.forEach(activity => {

                if ("load" in activity) {

                    delete activity.load;

                    changed = true;
                }
            });
        });
    });

    if (changed) {
        save("workouts", workouts);
    }
}