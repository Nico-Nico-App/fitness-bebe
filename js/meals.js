/* ======================================
   BASE D'ALIMENTS (valeurs moyennes)
====================================== */

const FOOD_DATABASE = [

    {
        group: "Déjeuner (matin)",
        items: [
            { name: "Croissant", portion: "1 pièce", kcal: 230 },
            { name: "Pain au chocolat", portion: "1 pièce", kcal: 270 },
            { name: "Tartine beurre + confiture", portion: "1 tartine", kcal: 150 },
            { name: "Céréales avec lait", portion: "1 bol", kcal: 250 },
            { name: "Flocons d'avoine", portion: "50 g", kcal: 190 },
            { name: "Yaourt nature", portion: "1 pot", kcal: 60 },
            { name: "Fromage blanc", portion: "100 g", kcal: 75 },
            { name: "Œuf dur", portion: "1 œuf", kcal: 80 },
            { name: "Omelette", portion: "2 œufs", kcal: 190 }
        ]
    },

    {
        group: "Féculents",
        items: [
            { name: "Pâtes cuites", portion: "200 g", kcal: 300 },
            { name: "Riz cuit", portion: "200 g", kcal: 260 },
            { name: "Quinoa cuit", portion: "200 g", kcal: 240 },
            { name: "Pommes de terre", portion: "200 g", kcal: 170 },
            { name: "Pain", portion: "1 tranche", kcal: 80 },
            { name: "Baguette", portion: "1/4 de baguette", kcal: 160 }
        ]
    },

    {
        group: "Viandes, poissons, protéines",
        items: [
            { name: "Poulet grillé", portion: "150 g", kcal: 240 },
            { name: "Steak haché 5 %", portion: "125 g", kcal: 180 },
            { name: "Saumon", portion: "150 g", kcal: 310 },
            { name: "Thon au naturel", portion: "100 g", kcal: 110 },
            { name: "Jambon blanc", portion: "1 tranche", kcal: 45 },
            { name: "Tofu", portion: "100 g", kcal: 120 }
        ]
    },

    {
        group: "Fruits et légumes",
        items: [
            { name: "Pomme", portion: "1 fruit", kcal: 80 },
            { name: "Banane", portion: "1 fruit", kcal: 105 },
            { name: "Orange", portion: "1 fruit", kcal: 60 },
            { name: "Légumes cuits", portion: "200 g", kcal: 80 },
            { name: "Salade verte + vinaigrette", portion: "1 assiette", kcal: 90 },
            { name: "Amandes / noix", portion: "30 g", kcal: 180 }
        ]
    },

    {
        group: "Plats courants",
        items: [
            { name: "Pâtes bolognaise", portion: "1 assiette", kcal: 550 },
            { name: "Lasagnes", portion: "1 part (300 g)", kcal: 450 },
            { name: "Pizza margherita", portion: "1 pizza", kcal: 800 },
            { name: "Burger", portion: "1 burger", kcal: 550 },
            { name: "Frites", portion: "1 portion", kcal: 400 },
            { name: "Sandwich jambon-beurre", portion: "1 sandwich", kcal: 400 },
            { name: "Croque-monsieur", portion: "1 pièce", kcal: 350 },
            { name: "Quiche", portion: "1 part", kcal: 350 },
            { name: "Salade composée", portion: "1 repas", kcal: 450 },
            { name: "Sushis", portion: "6 pièces", kcal: 250 },
            { name: "Kebab", portion: "1 sandwich", kcal: 700 },
            { name: "Soupe de légumes", portion: "1 bol", kcal: 100 }
        ]
    },

    {
        group: "Snacks et douceurs",
        items: [
            { name: "Chocolat", portion: "1 carré (10 g)", kcal: 55 },
            { name: "Barre chocolatée", portion: "1 barre", kcal: 230 },
            { name: "Biscuits", portion: "2 biscuits", kcal: 100 },
            { name: "Glace", portion: "1 boule", kcal: 120 },
            { name: "Chips", portion: "30 g", kcal: 160 },
            { name: "Fromage", portion: "30 g", kcal: 110 }
        ]
    },

    {
        group: "Boissons et matières grasses",
        items: [
            { name: "Soda", portion: "33 cl", kcal: 140 },
            { name: "Jus d'orange", portion: "1 verre", kcal: 90 },
            { name: "Bière", portion: "25 cl", kcal: 100 },
            { name: "Vin", portion: "12,5 cl", kcal: 85 },
            { name: "Beurre", portion: "10 g", kcal: 75 },
            { name: "Huile d'olive", portion: "1 c. à soupe", kcal: 100 }
        ]
    }
];

const MEAL_TYPES = {
    breakfast: { label: "Déjeuner",  icon: "🥐" },
    lunch:     { label: "Dîner",     icon: "🍽️" },
    dinner:    { label: "Souper",    icon: "🌙" },
    snack:     { label: "Collation", icon: "🍎" }
};

/* ======================================
   OUTILS
====================================== */

let mealEditIndex = null;

function getFoodById(id) {

    if (!id) return null;

    const [group, item] =
        String(id).split("-").map(Number);

    return (
        FOOD_DATABASE[group] &&
        FOOD_DATABASE[group].items[item]
    ) || null;
}

function getSelectedFood() {

    const select =
        document.getElementById("mealFood");

    return select ? getFoodById(select.value) : null;
}

/* Calories des activités + marche pour une date */
function getActivityCalories(date) {

    return load("workouts")
        .filter(day => day.date === date)
        .reduce((total, day) => {

            const activities =
                getWorkoutActivities(day).reduce(
                    (sum, ex) => sum + (ex.calories || 0),
                    0
                );

            return total + activities + (day.walkingCalories || 0);

        }, 0);
}

function setMealEditMode(editing) {

    const button =
        document.getElementById("addMealBtn");

    const cancel =
        document.getElementById("cancelMealEditBtn");

    if (button) {

        button.textContent =
            editing
                ? "💾 Enregistrer la modification"
                : "➕ Ajouter ce repas";
    }

    if (cancel) {

        cancel.style.display =
            editing ? "inline-block" : "none";
    }
}

/* ======================================
   LISTE D'ALIMENTS
====================================== */

function populateFoodSelect() {

    const select =
        document.getElementById("mealFood");

    if (!select) return;

    select.innerHTML =
        `<option value="">— Aliment ou plat courant (facultatif) —</option>`;

    FOOD_DATABASE.forEach((group, g) => {

        const optgroup =
            document.createElement("optgroup");

        optgroup.label = group.group;

        group.items.forEach((food, i) => {

            const option =
                document.createElement("option");

            option.value = `${g}-${i}`;

            option.textContent =
                `${food.name} (${food.portion}) – ${food.kcal} kcal`;

            optgroup.appendChild(option);
        });

        select.appendChild(optgroup);
    });
}

/* Pré-remplit le champ calories selon l'aliment et la quantité */
function updateCaloriesFromFood() {

    const food = getSelectedFood();

    if (!food) return;

    const quantity =
        parseFloat(
            document.getElementById("mealQuantity").value
        ) || 1;

    document.getElementById("mealCalories").value =
        Math.round(food.kcal * quantity);
}

/* ======================================
   AJOUT / MODIFICATION / SUPPRESSION
====================================== */

function addMeal() {

    const date =
        document.getElementById("mealDate").value;

    const type =
        document.getElementById("mealType").value;

    const calories =
        parseFloat(
            document.getElementById("mealCalories").value
        ) || 0;

    if (!date) {

        alert("Veuillez sélectionner une date.");
        return;
    }

    if (calories <= 0) {

        alert("Indiquez les calories ou choisissez un aliment.");
        return;
    }

    const food = getSelectedFood();

    const quantity =
        parseFloat(
            document.getElementById("mealQuantity").value
        ) || 1;

    const description =
        document.getElementById("mealName").value.trim();

    const meal = {
        date,
        type,
        name:
            description ||
            (food ? food.name : "Repas libre"),
        foodId:
            food
                ? document.getElementById("mealFood").value
                : null,
        quantity:
            food ? quantity : null,
        calories:
            Math.round(calories)
    };

    const meals = load("meals");

    if (mealEditIndex === null) {

        meals.push(meal);

    } else {

        meals[mealEditIndex] = meal;
    }

    meals.sort(
        (a, b) =>
            new Date(a.date) -
            new Date(b.date)
    );

    save("meals", meals);

    clearMealForm();

    renderMeals();
}

function editMeal(index) {

    const meal =
        load("meals")[index];

    if (!meal) return;

    if (typeof showTab === "function") {
        showTab("daily");
    }

    document.getElementById("mealDate").value = meal.date;
    document.getElementById("mealType").value = meal.type;
    document.getElementById("mealFood").value = meal.foodId || "";
    document.getElementById("mealQuantity").value = meal.quantity || 1;
    document.getElementById("mealCalories").value = meal.calories;

    const food = getFoodById(meal.foodId);

    document.getElementById("mealName").value =
        food && meal.name === food.name
            ? ""
            : meal.name;

    mealEditIndex = index;

    setMealEditMode(true);

    renderMeals();

    document.getElementById("mealDate").scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}

function cancelMealEdit() {

    clearMealForm();
}

function deleteMeal(index) {

    if (!confirm("Supprimer cette entrée ?")) return;

    const meals = load("meals");

    meals.splice(index, 1);

    save("meals", meals);

    if (mealEditIndex !== null) {
        clearMealForm();
    }

    renderMeals();
}

function clearMealForm() {

    [
        "mealFood",
        "mealName",
        "mealCalories"
    ].forEach(id => {

        const field =
            document.getElementById(id);

        if (field) field.value = "";
    });

    const quantity =
        document.getElementById("mealQuantity");

    if (quantity) quantity.value = "1";

    mealEditIndex = null;

    setMealEditMode(false);
}

/* ======================================
   AFFICHAGE
====================================== */

function mealEntryHtml(meal, index) {

    const type =
        MEAL_TYPES[meal.type] || MEAL_TYPES.snack;

    const quantity =
        meal.quantity && meal.quantity !== 1
            ? ` × ${meal.quantity}`
            : "";

    return `
        <div class="meal-row">

            <span>
                ${type.icon}
                ${escapeHtml(meal.name)}${quantity}
            </span>

            <span>
                <strong>${meal.calories} kcal</strong>

                <button
                    type="button"
                    class="btn-edit btn-small"
                    onclick="editMeal(${index})">
                    Modifier
                </button>

                <button
                    type="button"
                    class="btn-delete btn-small"
                    onclick="deleteMeal(${index})">
                    Supprimer
                </button>
            </span>

        </div>
    `;
}

/* Repas de la date sélectionnée dans le formulaire */
function renderTodayMeals() {

    const container =
        document.getElementById("mealTodayList");

    const dateField =
        document.getElementById("mealDate");

    if (!container || !dateField) return;

    const entries =
        load("meals")
            .map((meal, index) => ({ meal, index }))
            .filter(({ meal }) => meal.date === dateField.value);

    if (entries.length === 0) {

        container.innerHTML = `
            <p class="empty-session">
                Aucun repas enregistré ce jour-là
            </p>
        `;

        return;
    }

    container.innerHTML =
        entries
            .map(({ meal, index }) => mealEntryHtml(meal, index))
            .join("");
}

/* Historique complet, regroupé par jour */
function renderMealHistory() {

    const container =
        document.getElementById("mealHistory");

    if (!container) return;

    const meals = load("meals");

    if (meals.length === 0) {

        container.innerHTML =
            "<p>Aucun repas enregistré.</p>";

        return;
    }

    const days = {};

    meals.forEach((meal, index) => {

        if (!days[meal.date]) days[meal.date] = [];

        days[meal.date].push({ meal, index });
    });

    container.innerHTML =
        Object.keys(days)
            .sort()
            .reverse()
            .map(date => {

                const total =
                    days[date].reduce(
                        (sum, { meal }) => sum + meal.calories,
                        0
                    );

                return `
                    <div class="history-item">

                        <strong>📅 ${escapeHtml(date)}</strong>
                        — 🔥 ${total} kcal

                        <br><br>

                        ${
                            days[date]
                                .map(({ meal, index }) =>
                                    mealEntryHtml(meal, index)
                                )
                                .join("")
                        }

                    </div>
                `;
            })
            .join("");
}

/* Résumé du jour sélectionné */
function updateMealSummary() {

    const dateField =
        document.getElementById("mealDate");

    if (!dateField) return;

    const date = dateField.value;

    const eaten =
        load("meals")
            .filter(meal => meal.date === date)
            .reduce((sum, meal) => sum + meal.calories, 0);

    const bmrInfo =
        getBmrInfo(date);

    const bmr =
        bmrInfo.bmr || 0;

    const activity =
        getActivityCalories(date);

    const burned =
        bmr + activity;

    const balance =
        eaten - burned;

    const set = (id, text) => {

        const element =
            document.getElementById(id);

        if (element) element.textContent = text;
    };

    set("mealEatenTotal", eaten + " kcal");

    set(
        "mealBmrTotal",
        bmrInfo.bmr !== null ? bmr + " kcal" : "—"
    );

    set("mealActivityBurned", activity + " kcal");
    set("mealBurnedTotal", burned + " kcal");

    set(
        "mealBalance",
        (balance > 0 ? "+" : "") + balance + " kcal"
    );

    set(
        "mealBmrHint",
        bmrInfo.bmr === null
            ? `Métabolisme de base non inclus : il manque ${bmrInfo.missing.join(", ")} (carte « Profil »).`
            : ""
    );
}

function renderMeals() {

    renderTodayMeals();
    renderMealHistory();
    updateMealSummary();
}

/* ======================================
   INITIALISATION
====================================== */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        populateFoodSelect();

        /* Type de repas proposé selon l'heure */

        const typeSelect =
            document.getElementById("mealType");

        if (typeSelect) {

            const hour = new Date().getHours();

            typeSelect.value =
                hour < 10 ? "breakfast"
                : hour < 15 ? "lunch"
                : hour < 18 ? "snack"
                : "dinner";
        }

        const food =
            document.getElementById("mealFood");

        const quantity =
            document.getElementById("mealQuantity");

        const date =
            document.getElementById("mealDate");

        if (food) {
            food.addEventListener("change", updateCaloriesFromFood);
        }

        if (quantity) {
            quantity.addEventListener("input", updateCaloriesFromFood);
        }

        if (date) {
            date.addEventListener("change", renderMeals);
        }
    }
);
