/* ======================================
   VARIABLES
====================================== */

let measurementEditIndex = null;

/* ======================================
   AJOUT / MODIFICATION
====================================== */

function addMeasurement() {

    const date =
        document.getElementById("measurementDate").value;

    const waist =
        parseFloat(
            document.getElementById("waist").value
        ) || 0;

    const chest =
        parseFloat(
            document.getElementById("chest").value
        ) || 0;

    const hips =
        parseFloat(
            document.getElementById("hips").value
        ) || 0;

    const arms =
        parseFloat(
            document.getElementById("arms").value
        ) || 0;

    const thighs =
        parseFloat(
            document.getElementById("thighs").value
        ) || 0;

    if (!date) {

        alert(
            "Veuillez sélectionner une date."
        );

        return;
    }

    let measurements =
        load("measurements");

    const measurement = {

        date,
        waist,
        chest,
        hips,
        arms,
        thighs
    };

    if (measurementEditIndex === null) {

        measurements.push(
            measurement
        );

    } else {

        measurements[
            measurementEditIndex
        ] = measurement;

        measurementEditIndex =
            null;
    }

    measurements.sort(
        (a, b) =>
            new Date(a.date) -
            new Date(b.date)
    );

    save(
        "measurements",
        measurements
    );

    clearMeasurementForm();

    renderMeasurements();

    if (
        typeof updateMeasurementsChart ===
        "function"
    ) {

        updateMeasurementsChart();
    }

    alert(
        "Mensurations enregistrées ✅"
    );
}

/* ======================================
   MODIFICATION
====================================== */

function editMeasurement(index) {

    const measurements =
        load("measurements");

    const measurement =
        measurements[index];

    document.getElementById(
        "measurementDate"
    ).value =
        measurement.date;

    document.getElementById(
        "waist"
    ).value =
        measurement.waist || "";

    document.getElementById(
        "chest"
    ).value =
        measurement.chest || "";

    document.getElementById(
        "hips"
    ).value =
        measurement.hips || "";

    document.getElementById(
        "arms"
    ).value =
        measurement.arms || "";

    document.getElementById(
        "thighs"
    ).value =
        measurement.thighs || "";

    measurementEditIndex =
        index;

    if (typeof showTab === "function") {
        showTab("dashboard");
    }

    document.getElementById("measurementDate").scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}

/* ======================================
   SUPPRESSION
====================================== */

function deleteMeasurement(index) {

    if (
        !confirm(
            "Supprimer cette mensuration ?"
        )
    ) {
        return;
    }

    let measurements =
        load("measurements");

    measurements.splice(
        index,
        1
    );

    save(
        "measurements",
        measurements
    );

    renderMeasurements();

    if (
        typeof updateMeasurementsChart ===
        "function"
    ) {

        updateMeasurementsChart();
    }
}

/* ======================================
   RESET FORMULAIRE
====================================== */

function clearMeasurementForm() {

    [
        "waist",
        "chest",
        "hips",
        "arms",
        "thighs"
    ].forEach(id => {

        const field =
            document.getElementById(id);

        if (field) {
            field.value = "";
        }
    });

    const dateField =
        document.getElementById(
            "measurementDate"
        );

    if (dateField) {

        dateField.value =
            getLocalDateISO();
    }

    measurementEditIndex =
        null;
}

/* ======================================
   HISTORIQUE
====================================== */

function renderMeasurements() {

    const container =
        document.getElementById(
            "measurementHistory"
        );

    if (!container) {
        return;
    }

    container.innerHTML = "";

    const measurements =
        load("measurements");

    if (
        measurements.length === 0
    ) {

        container.innerHTML =
            "<p>Aucune mensuration enregistrée.</p>";

        return;
    }

    measurements
        .slice()
        .reverse()
        .forEach(measurement => {

            const originalIndex =
                measurements.indexOf(
                    measurement
                );

            const div =
                document.createElement(
                    "div"
                );

            div.className =
                "history-item";

            div.innerHTML = `

                <strong>
                    ${escapeHtml(measurement.date)}
                </strong>

                <br><br>

                📏 Taille :
                ${escapeHtml(measurement.waist)} cm

                <br>

                🫁 Poitrine :
                ${escapeHtml(measurement.chest)} cm

                <br>

                ⭕ Hanches :
                ${escapeHtml(measurement.hips)} cm

                <br>

                💪 Bras :
                ${escapeHtml(measurement.arms)} cm

                <br>

                🦵 Cuisses :
                ${escapeHtml(measurement.thighs)} cm

                <br><br>

                <button
                    class="btn-edit"
                    onclick="editMeasurement(${originalIndex})">

                    Modifier

                </button>

                <button
                    class="btn-delete"
                    onclick="deleteMeasurement(${originalIndex})">

                    Supprimer

                </button>

            `;

            container.appendChild(
                div
            );
        });
}

/* ======================================
   DONNÉES
====================================== */

function getMeasurements() {

    return load(
        "measurements"
    );
}

function getLatestMeasurements() {

    const measurements =
        load("measurements");

    if (
        measurements.length === 0
    ) {
        return null;
    }

    return measurements[
        measurements.length - 1
    ];
}

/* ======================================
   STATISTIQUES
====================================== */

function getMeasurementCount() {

    return load(
        "measurements"
    ).length;
}

/* ======================================
   INITIALISATION
====================================== */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        renderMeasurements();
    }
);