/* ======================================
   VARIABLES
====================================== */

let weightEditIndex = null;

/* ======================================
   AJOUT / MODIFICATION PESÉE
====================================== */

function addWeight() {

    const date =
        document.getElementById("weightDate").value;

    const weight =
        parseFloat(
            document.getElementById("weightValue").value
        );

    const height =
        parseFloat(
            document.getElementById("heightValue").value
        ) || getCurrentHeight() || null;

    if (!date) {

        alert("Veuillez sélectionner une date.");
        return;
    }

    if (isNaN(weight) || weight <= 0) {

        alert("Veuillez saisir un poids valide.");
        return;
    }

    let weights =
        load("weights");

    const weightEntry = {

        date,
        weight,
        height
    };

    if (weightEditIndex === null) {

        weights.push(weightEntry);

    } else {

        weights[weightEditIndex] =
            weightEntry;

        weightEditIndex = null;
    }

    weights.sort(
        (a, b) =>
            new Date(a.date) -
            new Date(b.date)
    );

    save(
        "weights",
        weights
    );

    clearWeightForm();

    if (
        typeof refreshDashboard ===
        "function"
    ) {

        refreshDashboard();
    }

    alert(
        "Pesée enregistrée ✅"
    );
}

/* ======================================
   MODIFICATION
====================================== */

function editWeight(index) {

    const weights =
        load("weights");

    const entry =
        weights[index];

    document.getElementById(
        "weightDate"
    ).value =
        entry.date;

    document.getElementById(
        "weightValue"
    ).value =
        entry.weight;

    document.getElementById(
        "heightValue"
    ).value =
        entry.height || "";

    weightEditIndex =
        index;

    if (typeof showTab === "function") {
        showTab("dashboard");
    }

    document.getElementById("weightDate").scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}

/* ======================================
   SUPPRESSION
====================================== */

function deleteWeight(index) {

    if (
        !confirm(
            "Supprimer cette pesée ?"
        )
    ) {
        return;
    }

    let weights =
        load("weights");

    weights.splice(
        index,
        1
    );

    save(
        "weights",
        weights
    );

    if (
        typeof refreshDashboard ===
        "function"
    ) {

        refreshDashboard();
    }
}

/* ======================================
   RESET FORMULAIRE
====================================== */

function clearWeightForm() {

    document.getElementById(
        "weightValue"
    ).value = "";

    const dateField =
        document.getElementById(
            "weightDate"
        );

    if (dateField) {

        dateField.value =
            getLocalDateISO();
    }

    weightEditIndex = null;
}

/* ======================================
   HISTORIQUE POIDS
====================================== */

function renderWeights() {

    const container =
        document.getElementById("weightHistory");

    if (!container) {
        return;
    }

    const button =
        document.getElementById("toggleWeightHistory");

    const weights =
        load("weights");

    if (weights.length === 0) {

        container.innerHTML =
            "<p>Aucune pesée enregistrée.</p>";

        if (button) button.style.display = "none";

        return;
    }

    const expanded =
        container.classList.contains("expanded");

    const entries =
        weights
            .map((weight, index) => ({ weight, index }))
            .reverse();

    const visible =
        expanded ? entries : entries.slice(0, 5);

    container.innerHTML = "";

    visible.forEach(({ weight, index }) => {

        const div =
            document.createElement("div");

        div.className = "history-item";

        div.innerHTML = `

            <strong>${escapeHtml(weight.date)}</strong>

            <br>

            ⚖️ ${escapeHtml(weight.weight)} kg

            ${
                weight.height
                    ? `<br>📏 ${escapeHtml(weight.height)} cm`
                    : ""
            }

            <br><br>

            <button
                class="btn-edit"
                onclick="editWeight(${index})">
                Modifier
            </button>

            <button
                class="btn-delete"
                onclick="deleteWeight(${index})">
                Supprimer
            </button>
        `;

        container.appendChild(div);
    });

    if (button) {

        button.style.display =
            weights.length > 5 ? "block" : "none";

        button.textContent =
            expanded ? "Afficher moins" : "Afficher plus";
    }
}

/* ======================================
   DERNIER POIDS
====================================== */

function getCurrentWeight() {

    const weights =
        load("weights");

    if (
        weights.length === 0
    ) {
        return null;
    }

    return weights[
        weights.length - 1
    ].weight;
}

/* ======================================
   DERNIÈRE TAILLE
====================================== */

function getCurrentHeight() {

    const weights =
        load("weights");

    if (
        weights.length === 0
    ) {
        return null;
    }

    return weights[
        weights.length - 1
    ].height;
}

/* ======================================
   IMC
====================================== */

function calculateBMI() {

    const weight =
        getCurrentWeight();

    const height =
        getCurrentHeight();

    if (
        !weight ||
        !height
    ) {
        return null;
    }

    return (
        weight /
        Math.pow(
            height / 100,
            2
        )
    );
}

/* ======================================
   STATISTIQUES
====================================== */

function getWeightStats() {

    const weights =
        load("weights");

    if (
        weights.length === 0
    ) {

        return null;
    }

    const values =
        weights.map(
            w => w.weight
        );

    return {

        min:
            Math.min(
                ...values
            ),

        max:
            Math.max(
                ...values
            ),

        average:
            (
                values.reduce(
                    (
                        total,
                        value
                    ) =>
                        total +
                        value,
                    0
                ) /
                values.length
            ).toFixed(1),

        current:
            values[
                values.length - 1
            ]
    };
}

/* ======================================
   INITIALISATION
====================================== */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        renderWeights();
    }
);
