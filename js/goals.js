/* ======================================
   ENREGISTRER OBJECTIF
====================================== */

function saveGoal() {

    const weight =
        parseFloat(
            document.getElementById("goalWeight").value
        );

    const date =
        document.getElementById("goalDate").value;

    if (isNaN(weight) || weight <= 0) {

        alert("Veuillez saisir un objectif valide.");
        return;
    }

    const goal = {
        weight,
        date
    };

    localStorage.setItem(
        "goal",
        JSON.stringify(goal)
    );

    displayGoal();
}

/* ======================================
   AFFICHER OBJECTIF
====================================== */

function displayGoal() {

    const goalInfo =
        document.getElementById("goalInfo");

    const headerGoal =
        document.getElementById("headerGoal");

    const progressBar =
        document.getElementById(
            "goalProgressBar"
        );

    const headerProgressBar =
        document.getElementById(
            "headerProgressBar"
        );

    const progressText =
        document.getElementById(
            "goalProgressText"
        );

    const goal =
        JSON.parse(
            localStorage.getItem("goal")
        );

    if (!goal) {

        if (goalInfo) {
            goalInfo.innerHTML =
                "Aucun objectif défini.";
        }

        if (headerGoal) {
            headerGoal.textContent =
                "🎯 Aucun objectif défini";
        }

        if (progressBar) {
            progressBar.style.width = "0%";
        }

        if (headerProgressBar) {
            headerProgressBar.style.width = "0%";
        }

        if (progressText) {
            progressText.textContent = "";
        }

        return;
    }

    const weights =
        JSON.parse(
            localStorage.getItem("weights")
        ) || [];

    let currentWeight = null;
    let progress = 0;

    if (weights.length > 0) {

        currentWeight =
            weights[weights.length - 1].weight;

        const startWeight =
            weights[0].weight;

        if (startWeight !== goal.weight) {

            progress =
                (
                    (startWeight - currentWeight) /
                    (startWeight - goal.weight)
                ) * 100;

        } else if (currentWeight === goal.weight) {

            progress = 100;
        }

        progress =
            Math.max(
                0,
                Math.min(100, progress)
            );
    }

    let html = `
        <strong>Objectif :</strong>
        ${goal.weight} kg
    `;

    if (goal.date) {

        html += `
            <br>
            <strong>Date cible :</strong>
            ${escapeHtml(goal.date)}
        `;
    }

    if (currentWeight !== null) {

        const remaining =
            Math.abs(
                currentWeight - goal.weight
            );

        const direction =
            currentWeight > goal.weight
                ? "à perdre"
                : "à prendre";

        html += `
            <br><br>

            <strong>Poids actuel :</strong>
            ${currentWeight.toFixed(1)} kg

            <br>

            <strong>Reste :</strong>
            ${remaining.toFixed(1)} kg
            ${direction}

            <br>

            <strong>Progression :</strong>
            ${progress.toFixed(0)} %
        `;

        if (progress >= 100) {

            html += `
                <br><br>
                ✅ Objectif atteint !
            `;
        }
    }

    if (goalInfo) {
        goalInfo.innerHTML = html;
    }

    let color = "#ef4444";

    if (progress >= 25) color = "#f59e0b";
    if (progress >= 50) color = "#3b82f6";
    if (progress >= 75) color = "#22c55e";

    if (progressBar) {

        progressBar.style.width =
            progress + "%";

        progressBar.style.background =
            color;
    }

    if (headerProgressBar) {

        headerProgressBar.style.width =
            progress + "%";

        headerProgressBar.style.background =
            color;
    }

    if (progressText) {

        progressText.textContent =
            `Progression : ${progress.toFixed(0)} %`;
    }

    if (headerGoal) {

        if (currentWeight !== null) {

            headerGoal.textContent =
                `🎯 ${currentWeight.toFixed(1)} kg → ${goal.weight} kg | ${progress.toFixed(0)} %`;

        } else {

            headerGoal.textContent =
                `🎯 Objectif : ${goal.weight} kg`;
        }
    }
}

/* ======================================
   SUPPRIMER OBJECTIF
====================================== */

function deleteGoal() {

    if (
        !confirm(
            "Supprimer l'objectif ?"
        )
    ) {
        return;
    }

    localStorage.removeItem("goal");

    displayGoal();
}

/* ======================================
   RÉCUPÉRER OBJECTIF
====================================== */

function getGoal() {

    return JSON.parse(
        localStorage.getItem("goal")
    );
}

/* ======================================
   POIDS RESTANT
====================================== */

function getRemainingWeight() {

    const goal = getGoal();

    if (!goal) {
        return null;
    }

    const weights =
        JSON.parse(
            localStorage.getItem("weights")
        ) || [];

    if (weights.length === 0) {
        return null;
    }

    const currentWeight =
        weights[weights.length - 1].weight;

    return Math.abs(
        currentWeight - goal.weight
    ).toFixed(1);
}

/* ======================================
   POURCENTAGE OBJECTIF
====================================== */

function getGoalProgress() {

    const goal = getGoal();

    if (!goal) {
        return 0;
    }

    const weights =
        JSON.parse(
            localStorage.getItem("weights")
        ) || [];

    if (weights.length < 2) {
        return 0;
    }

    const startWeight =
        weights[0].weight;

    const currentWeight =
        weights[weights.length - 1].weight;

    if (startWeight === goal.weight) {
        return 100;
    }

    let progress =
        (
            (startWeight - currentWeight) /
            (startWeight - goal.weight)
        ) * 100;

    progress =
        Math.max(
            0,
            Math.min(100, progress)
        );

    return progress;
}