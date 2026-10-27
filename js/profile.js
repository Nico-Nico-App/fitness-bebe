/* ======================================
   PROFIL + MÉTABOLISME DE BASE
   (formule de Mifflin-St Jeor)
====================================== */

function getProfile() {

    try {

        return JSON.parse(
            localStorage.getItem("profile")
        ) || null;

    } catch (error) {

        return null;
    }
}

/* Dernière taille renseignée dans le suivi du poids */
function getKnownHeight() {

    const weights = load("weights");

    for (let i = weights.length - 1; i >= 0; i--) {

        if (weights[i].height) {
            return weights[i].height;
        }
    }

    return null;
}

/* Poids connu à une date donnée (dernière pesée jusqu'à cette date) */
function getWeightForDate(date) {

    const weights = load("weights");

    if (weights.length === 0) {
        return null;
    }

    let chosen = null;

    weights.forEach(entry => {

        if (entry.date <= date) {
            chosen = entry;
        }
    });

    return (chosen || weights[0]).weight;
}

/* Calcule le métabolisme de base pour une date, ou indique ce qui manque */
function getBmrInfo(date) {

    const profile = getProfile();

    const missing = [];

    if (!profile || !profile.sex) {
        missing.push("le sexe");
    }

    if (!profile || !profile.birthYear) {
        missing.push("l'année de naissance");
    }

    const weight = getWeightForDate(date);

    if (!weight) {
        missing.push("le poids");
    }

    const height = getKnownHeight();

    if (!height) {
        missing.push("la taille");
    }

    if (missing.length > 0) {
        return { bmr: null, missing };
    }

    const age =
        Number(date.slice(0, 4)) - profile.birthYear;

    const base =
        10 * weight +
        6.25 * height -
        5 * age;

    const bmr =
        Math.round(
            base + (profile.sex === "male" ? 5 : -161)
        );

    return { bmr, weight, height, age, missing: [] };
}

/* ======================================
   ENREGISTREMENT
====================================== */

function saveProfile() {

    const sex =
        document.getElementById("profileSex").value;

    const birthYear =
        parseInt(
            document.getElementById("profileBirthYear").value
        );

    const currentYear =
        new Date().getFullYear();

    if (!sex) {

        alert("Veuillez choisir un sexe.");
        return;
    }

    if (
        isNaN(birthYear) ||
        birthYear < currentYear - 100 ||
        birthYear > currentYear - 10
    ) {

        alert("Veuillez saisir une année de naissance valide.");
        return;
    }

    localStorage.setItem(
        "profile",
        JSON.stringify({ sex, birthYear })
    );

    renderProfile();

    if (typeof renderMeals === "function") {
        renderMeals();
    }

    alert("Profil enregistré ✅");
}

/* ======================================
   AFFICHAGE
====================================== */

function renderProfile() {

    const info =
        document.getElementById("profileInfo");

    if (!info) return;

    const today =
        getLocalDateISO();

    const result = getBmrInfo(today);

    if (result.bmr === null) {

        info.textContent = "";

        return;
    }

    info.textContent = `Métabolisme de base : ${result.bmr} kcal / jour`;
}

function initializeProfile() {

    const profile = getProfile();

    if (profile) {

        document.getElementById("profileSex").value =
            profile.sex || "";

        document.getElementById("profileBirthYear").value =
            profile.birthYear || "";
    }

    renderProfile();
}
