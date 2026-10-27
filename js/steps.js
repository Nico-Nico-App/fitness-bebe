/* ======================================
   PAS DE LA JOURNÉE
   (suivi uniquement, sans effet sur les calories)
====================================== */

function formatSteps(value) {

    return Number(value).toLocaleString("fr-FR");
}

function getStepsEntry(date) {

    return load("steps").find(entry => entry.date === date) || null;
}

function saveSteps() {

    const date =
        document.getElementById("stepsDate").value;

    const steps =
        parseInt(
            document.getElementById("stepsValue").value
        );

    if (!date) {

        alert("Veuillez sélectionner une date.");
        return;
    }

    if (isNaN(steps) || steps < 0) {

        alert("Veuillez saisir un nombre de pas valide.");
        return;
    }

    const entries = load("steps");

    const existing =
        entries.find(entry => entry.date === date);

    if (existing) {
        existing.steps = steps;
    } else {
        entries.push({ date, steps });
    }

    entries.sort(
        (a, b) =>
            new Date(a.date) -
            new Date(b.date)
    );

    save("steps", entries);

    renderSteps();

    alert("Pas enregistrés ✅");
}

function deleteSteps(date) {

    if (!confirm("Supprimer les pas de ce jour ?")) return;

    save(
        "steps",
        load("steps").filter(entry => entry.date !== date)
    );

    fillStepsInput();
}

function editSteps(date) {

    if (typeof showTab === "function") {
        showTab("daily");
    }

    document.getElementById("stepsDate").value = date;

    fillStepsInput();

    document.getElementById("stepsDate").scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}

/* Remplit le champ avec la valeur enregistrée pour la date choisie */
function fillStepsInput() {

    const date =
        document.getElementById("stepsDate").value;

    const entry = getStepsEntry(date);

    document.getElementById("stepsValue").value =
        entry ? entry.steps : "";

    renderSteps();
}

function renderSteps() {

    const dateField =
        document.getElementById("stepsDate");

    const info =
        document.getElementById("stepsInfo");

    if (info && dateField) {

        const entry = getStepsEntry(dateField.value);

        info.textContent =
            entry
                ? `👟 ${formatSteps(entry.steps)} pas enregistrés pour cette date`
                : "Aucun pas enregistré pour cette date";
    }

    const container =
        document.getElementById("stepsHistory");

    if (!container) return;

    const entries =
        load("steps").slice().reverse();

    if (entries.length === 0) {

        container.innerHTML =
            "<p>Aucun pas enregistré.</p>";

        return;
    }

    container.innerHTML =
        entries
            .map(entry => `
                <div class="meal-row">

                    <span>
                            📅 ${escapeHtml(entry.date)} —
                        👟 <strong>${formatSteps(entry.steps)}</strong> pas
                    </span>

                    <span>
                        <button
                            type="button"
                            class="btn-edit btn-small"
                            data-action="edit"
                            data-date="${escapeHtml(entry.date)}">
                            Modifier
                        </button>

                        <button
                            type="button"
                            class="btn-delete btn-small"
                            data-action="delete"
                            data-date="${escapeHtml(entry.date)}">
                            Supprimer
                        </button>
                    </span>

                </div>
            `)
            .join("");
}

function initializeSteps() {

    const dateField =
        document.getElementById("stepsDate");

    if (dateField) {
        dateField.addEventListener("change", fillStepsInput);
    }

    const history =
        document.getElementById("stepsHistory");

    if (history) {
        history.addEventListener("click", event => {
            const button = event.target.closest("button[data-action][data-date]");

            if (!button || !history.contains(button)) return;

            if (button.dataset.action === "edit") {
                editSteps(button.dataset.date);
            } else if (button.dataset.action === "delete") {
                deleteSteps(button.dataset.date);
            }
        });
    }

    fillStepsInput();
}
