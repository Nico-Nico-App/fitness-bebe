/* ======================================
   EXPORT EXCEL
====================================== */

function exportExcel() {

    const workbook =
        XLSX.utils.book_new();

    const weights =
        load("weights");

    const workouts =
        load("workouts");

    const measurements =
        load("measurements");

    const goal =
        JSON.parse(
            localStorage.getItem("goal")
        ) || {};

    /* Objectif */

    const goalSheet =
        XLSX.utils.json_to_sheet([
            {
                ObjectifKg:
                    goal.weight || "",
                DateObjectif:
                    goal.date || ""
            }
        ]);

    XLSX.utils.book_append_sheet(
        workbook,
        goalSheet,
        "Objectif"
    );

    /* Poids */

    const weightSheet =
        XLSX.utils.json_to_sheet(
            weights
        );

    XLSX.utils.book_append_sheet(
        workbook,
        weightSheet,
        "Poids"
    );

    /* Mensurations */

    const measurementSheet =
        XLSX.utils.json_to_sheet(
            measurements
        );

    XLSX.utils.book_append_sheet(
        workbook,
        measurementSheet,
        "Mensurations"
    );

    /* Séances */

    const workoutRows = [];

    workouts.forEach(day => {

        getWorkoutActivities(day).forEach(ex => {

            workoutRows.push({
                Date: day.date,
                Activité: ex.exercise,
                Type: isCardioActivity(ex) ? "Cardio" : "Musculation",
                Séries: ex.sets ?? "",
                Répétitions: ex.reps ?? "",
                DistanceKm: ex.distance ?? "",
                DuréeMin: ex.duration ?? "",
                Calories: ex.calories ?? ""
            });
        });

        if (day.walkingDistance > 0) {

            workoutRows.push({
                Date: day.date,
                Activité: "Marche",
                Type: "Marche",
                DistanceKm: day.walkingDistance,
                Calories: day.walkingCalories
            });
        }
    });

    const workoutSheet =
        XLSX.utils.json_to_sheet(
            workoutRows
        );

    XLSX.utils.book_append_sheet(
        workbook,
        workoutSheet,
        "Séances"
    );

    /* Repas */

    const mealRows =
        load("meals").map(meal => ({
            Date: meal.date,
            Repas:
                (MEAL_TYPES[meal.type] || {}).label || meal.type,
            Aliment: meal.name,
            Portions: meal.quantity ?? "",
            Calories: meal.calories
        }));

    const mealSheet =
        XLSX.utils.json_to_sheet(
            mealRows
        );

    XLSX.utils.book_append_sheet(
        workbook,
        mealSheet,
        "Repas"
    );

    /* Pas */

    const stepsSheet =
        XLSX.utils.json_to_sheet(
            load("steps").map(entry => ({
                Date: entry.date,
                Pas: entry.steps
            }))
        );

    XLSX.utils.book_append_sheet(
        workbook,
        stepsSheet,
        "Pas"
    );

    XLSX.writeFile(
        workbook,
        `fitness_tracker_${getLocalDateISO()}.xlsx`
    );
}

/* ======================================
   EXPORT PDF
====================================== */

function exportPDF() {

    const { jsPDF } =
        window.jspdf;

    const pdf =
        new jsPDF();

    const weights =
        load("weights");

    const workouts =
        load("workouts");

    const measurements =
        load("measurements");

    const goal =
        JSON.parse(
            localStorage.getItem("goal")
        ) || null;

    let y = 20;

    pdf.setFontSize(18);

    pdf.text(
        "Fitness Tracker Pro",
        20,
        y
    );

    y += 15;

    pdf.setFontSize(12);

    /* Objectif */

    pdf.text(
        "OBJECTIF",
        20,
        y
    );

    y += 8;

    if (goal) {

        pdf.text(
            `Objectif : ${goal.weight} kg`,
            20,
            y
        );

        y += 6;

        if (goal.date) {

            pdf.text(
                `Date cible : ${goal.date}`,
                20,
                y
            );

            y += 8;
        }
    }

    /* Dernière pesée */

    if (weights.length > 0) {

        const lastWeight =
            weights[
                weights.length - 1
            ];

        pdf.text(
            `Dernier poids : ${lastWeight.weight} kg`,
            20,
            y
        );

        y += 8;
    }

    /* Dernières mensurations */

    if (measurements.length > 0) {

        const last =
            measurements[
                measurements.length - 1
            ];

        pdf.text(
            "Dernieres mensurations",
            20,
            y
        );

        y += 6;

        pdf.text(
            `Taille : ${last.waist} cm`,
            20,
            y
        );

        y += 6;

        pdf.text(
            `Poitrine : ${last.chest} cm`,
            20,
            y
        );

        y += 6;

        pdf.text(
            `Hanches : ${last.hips} cm`,
            20,
            y
        );

        y += 6;

        pdf.text(
            `Bras : ${last.arms} cm`,
            20,
            y
        );

        y += 6;

        pdf.text(
            `Cuisses : ${last.thighs} cm`,
            20,
            y
        );

        y += 10;
    }

    /* Statistiques séances */

    pdf.text(
        `Nombre de séances : ${workouts.length}`,
        20,
        y
    );

    y += 8;

    const totalKm =
        workouts.reduce(
            (
                total,
                workout
            ) =>
                total +
                (
                    parseFloat(
                        workout.walkingDistance
                    ) || 0
                ),
            0
        );

    const totalCalories =
        workouts.reduce(
            (
                total,
                workout
            ) =>
                total +
                (
                    parseInt(
                        workout.walkingCalories
                    ) || 0
                ),
            0
        );

    pdf.text(
        `Distance marche : ${totalKm.toFixed(1)} km`,
        20,
        y
    );

    y += 6;

    pdf.text(
        `Calories marche : ${totalCalories} kcal`,
        20,
        y
    );

    y += 8;

    const today =
        getLocalDateISO();

    const eatenToday =
        load("meals")
            .filter(meal => meal.date === today)
            .reduce((sum, meal) => sum + meal.calories, 0);

    pdf.text(
        `Calories mangées aujourd'hui : ${eatenToday} kcal`,
        20,
        y
    );

    y += 10;

    /* Historique récent */

    pdf.text(
        "Dernières séances",
        20,
        y
    );

    y += 8;

    workouts
        .slice(-10)
        .reverse()
        .forEach(workout => {

            if (y > 270) {

                pdf.addPage();

                y = 20;
            }

            const names =
                getWorkoutActivities(workout)
                    .map(ex => ex.exercise)
                    .join(", ") || "Marche";

            pdf.text(
                `${workout.date} - ${names}`,
                20,
                y
            );

            y += 6;
        });

    pdf.save(
        `fitness_tracker_${getLocalDateISO()}.pdf`
    );
}