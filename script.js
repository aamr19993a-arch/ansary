// ===== State Management =====
let count = parseInt(localStorage.getItem("count")) || 0; // Global Tasbeeh total (if needed)
// Tasbeeh State
let currentTasbeehDhikr = "free";
let tasbeehData = JSON.parse(localStorage.getItem("tasbeehData")) || {};
let customTasbeehText = localStorage.getItem("customTasbeehText") || "";
let customTasbeehTarget = parseInt(localStorage.getItem("customTasbeehTarget")) || 0;

// Predefined targets for each dhikr type
const tasbeehTargets = {
    "free": 0,
    "subhan_allah": 33,
    "alhamdulillah": 33,
    "allahu_akbar": 34,
    "astaghfirullah": 100,
    "la_ilaha_illa_allah": 100,
    "subhan_allah_wa_bihamdihi": 100,
    "la_hawla": 0,
    "salat_ala_nabi": 10,
    "custom": 0
};
let lang = localStorage.getItem("lang") || "ar";
let theme = localStorage.getItem("theme") || "light";
let favorites = JSON.parse(localStorage.getItem("fav")) || [];

// Adhkar State
let currentCategory = "morning";
let currentIndex = 0;
let currentCounter = 0; // Current dhikr repetition progress
let repeatTarget = 1;

// ===== Data Loading =====
const adhkar = {};
if (typeof azkarData !== 'undefined') {
    azkarData.forEach(cat => {
        adhkar[cat.category] = cat.items;
    });
}

const texts = {
    ar: { app: "أنصاري", tasbeeh: "تسبيح", reset: "إعادة", reminder: "📿 حان وقت الأذكار" },
    en: { app: "Ansari", tasbeeh: "Tasbeeh", reset: "Reset", reminder: "📿 Time for Dhikr" }
};

// ===== View Navigation =====
function showView(viewId) {
    // Hide all views
    document.querySelectorAll('.view-section').forEach(el => {
        el.classList.add('hidden');
        el.classList.remove('fade-in');
    });

    // Show target view
    const view = document.getElementById(`view-${viewId}`);
    if (view) {
        view.classList.remove('hidden');
        // Trigger reflow for animation
        void view.offsetWidth;
        view.classList.add('fade-in');
    }

    // Update Bottom Nav
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    const navItem = document.getElementById(`nav-${viewId}`);
    if (navItem) navItem.classList.add('active');

    // Special logic for Favorites view
    if (viewId === 'favorites') renderFavorites();


}

function openAdhkar(category) {
    if (!adhkar[category]) return;

    currentCategory = category;
    currentIndex = 0;
    currentCounter = 0;
    repeatTarget = adhkar[currentCategory][currentIndex].count || 1;

    showView('adhkar');
    renderDhikr();
}

// ===== Adhkar Logic =====
function renderDhikr() {
    const list = adhkar[currentCategory];
    if (!list || !list[currentIndex]) return;

    const item = list[currentIndex];

    document.getElementById("adhkarTitle").innerText = getCategoryTitle(currentCategory);
    document.getElementById("dhikrText").innerText = item[lang] || item.ar;

    // Update progress button
    const btn = document.getElementById("dhikr-progress-btn");
    btn.innerText = `${currentCounter} / ${repeatTarget}`;

    // Update Favorite Icon State
    const favBtn = document.getElementById("fav-btn");
    const isFav = favorites.includes(item.ar); // Check by Arabic text as ID
    favBtn.style.color = isFav ? "var(--primary-color)" : "var(--text-secondary)";
}

function getCategoryTitle(cat) {
    const map = {
        morning: "أذكار الصباح",
        evening: "أذكار المساء",
        sleep: "أذكار النوم",
        post_prayer: "أذكار بعد الصلاة"
    };
    return map[cat] || "الأذكار";
}

function nextDhikr() {
    const list = adhkar[currentCategory];
    if (!list) return;

    currentIndex++;
    if (currentIndex >= list.length) {
        // End of list
        currentIndex = 0; // Loop back or maybe show a "Done" screen?
        // For now, loop back
        alert("تم الانتهاء من الأذكار لهذه المجموعة");
        showView('home');
        return;
    }

    // Reset for next item
    currentCounter = 0;
    repeatTarget = list[currentIndex].count || 1;
    renderDhikr();
}

function prevDhikr() {
    if (currentIndex > 0) {
        currentIndex--;
        currentCounter = 0;
        repeatTarget = adhkar[currentCategory][currentIndex].count || 1;
        renderDhikr();
    }
}

function incrementDhikr() {
    if (currentCounter < repeatTarget) {
        currentCounter++;

        // Visual feedback
        const btn = document.getElementById("dhikr-progress-btn");
        btn.style.transform = "scale(0.95)";
        setTimeout(() => btn.style.transform = "scale(1)", 100);

        if (currentCounter >= repeatTarget) {
            // Auto advance after short delay
            renderDhikr(); // Update to show full count first
            setTimeout(() => {
                nextDhikr();
            }, 300);
        } else {
            renderDhikr();
        }
    } else {
        nextDhikr();
    }
}

// ===== Tasbeeh (Selection Mode) Logic =====
function changeTasbeehDhikr() {
    const select = document.getElementById("tasbeeh-select");
    currentTasbeehDhikr = select.value;

    // Show/hide custom fields
    const customFields = document.getElementById("custom-setup-fields");
    if (currentTasbeehDhikr === "custom") {
        customFields.classList.remove("hidden");
        // Load saved custom values
        document.getElementById("custom-text-input").value = customTasbeehText;
        document.getElementById("custom-target-input").value = customTasbeehTarget || "";
    } else {
        customFields.classList.add("hidden");
    }

    updateTasbeehDisplay();
}

function updateCustomLabel() {
    customTasbeehText = document.getElementById("custom-text-input").value;
    localStorage.setItem("customTasbeehText", customTasbeehText);
    updateTasbeehDisplay();
}

function updateCustomTarget() {
    const value = parseInt(document.getElementById("custom-target-input").value) || 0;
    customTasbeehTarget = value;
    tasbeehTargets["custom"] = value;
    localStorage.setItem("customTasbeehTarget", customTasbeehTarget);
    updateTasbeehDisplay();
}

function updateTasbeehDisplay() {
    const count = tasbeehData[currentTasbeehDhikr] || 0;
    const target = currentTasbeehDhikr === "custom" ? customTasbeehTarget : tasbeehTargets[currentTasbeehDhikr];

    // Update counter display
    if (target > 0) {
        document.getElementById("tasbeeh-counter").innerText = `${count} / ${target}`;
    } else {
        document.getElementById("tasbeeh-counter").innerText = count;
    }

    const select = document.getElementById("tasbeeh-select");
    // Sync select if needed (e.g. on load)
    if (select && select.value !== currentTasbeehDhikr) select.value = currentTasbeehDhikr;

    const label = document.getElementById("current-tasbeeh-label");
    if (label) {
        if (currentTasbeehDhikr === "free") {
            label.innerText = "";
        } else if (currentTasbeehDhikr === "custom") {
            label.innerText = customTasbeehText || "تسبيح مخصص";
        } else {
            // Show the name without the (33) part for the label
            const text = select.options[select.selectedIndex]?.text || "";
            label.innerText = text.split('(')[0].trim();
        }
    }

    // Check if target reached - change button color
    if (target > 0 && count >= target) {
        const btn = document.getElementById("tasbeeh-btn");
        if (btn) {
            btn.style.background = "linear-gradient(135deg, #4CAF50, #45a049)";
        }
    } else {
        const btn = document.getElementById("tasbeeh-btn");
        if (btn) {
            btn.style.background = "linear-gradient(135deg, var(--secondary-color), var(--primary-color))";
        }
    }
}

function incrementTasbeeh() {
    const target = currentTasbeehDhikr === "custom" ? customTasbeehTarget : tasbeehTargets[currentTasbeehDhikr];
    const currentCount = tasbeehData[currentTasbeehDhikr] || 0;

    // Check if target is reached (only if target > 0)
    if (target > 0 && currentCount >= target) {
        // Show alert and ask if user wants to reset
        if (confirm(`تم الوصول للهدف (${target})!\nهل تريد إعادة العداد؟`)) {
            tasbeehData[currentTasbeehDhikr] = 0;
            localStorage.setItem("tasbeehData", JSON.stringify(tasbeehData));
            updateTasbeehDisplay();
        }
        return;
    }

    if (!tasbeehData[currentTasbeehDhikr]) tasbeehData[currentTasbeehDhikr] = 0;
    tasbeehData[currentTasbeehDhikr]++;
    localStorage.setItem("tasbeehData", JSON.stringify(tasbeehData));

    updateTasbeehDisplay();

    // Animate button
    const btn = document.getElementById("tasbeeh-btn");
    btn.style.transform = "scale(0.95)";
    setTimeout(() => btn.style.transform = "scale(1)", 100);

    // Haptic feedback if available (mobile)
    if (navigator.vibrate) navigator.vibrate(5);

    // Check if just reached target
    if (target > 0 && tasbeehData[currentTasbeehDhikr] === target) {
        // Celebration - vibrate longer
        if (navigator.vibrate) navigator.vibrate([50, 100, 50]);
        setTimeout(() => {
            alert(`مبارك! تم إكمال ${target} تسبيحة 🎉`);
        }, 200);
    }
}

function resetTasbeeh() {
    if (confirm("هل أنت متأكد من تصفير العداد؟")) {
        tasbeehData[currentTasbeehDhikr] = 0;
        localStorage.setItem("tasbeehData", JSON.stringify(tasbeehData));
        updateTasbeehDisplay();
    }
}

// ===== Favorites Logic =====
function toggleFavorite() {
    const list = adhkar[currentCategory];
    if (!list) return;
    const item = list[currentIndex];
    const text = item.ar;

    if (favorites.includes(text)) {
        favorites = favorites.filter(f => f !== text);
    } else {
        favorites.push(text);
    }
    localStorage.setItem("fav", JSON.stringify(favorites));
    renderDhikr(); // Update icon
}

function renderFavorites() {
    const container = document.getElementById("favorites-list");
    container.innerHTML = "";

    if (favorites.length === 0) {
        container.innerHTML = `<div style="text-align: center; color: var(--text-secondary); margin-top: 2rem;">لا توجد أذكار مفضلة حتى الآن</div>`;
        return;
    }

    favorites.forEach(text => {
        const div = document.createElement("div");
        div.className = "dhikr-card";
        div.style.marginBottom = "1rem";
        div.innerHTML = `
            <p class="dhikr-arabic" style="font-size: 1.25rem;">${text}</p>
            <button onclick="removeFavorite('${text}')" class="icon-btn" style="color: var(--primary-color);"><i class="ph ph-trash"></i></button>
        `;
        container.appendChild(div);
    });
}

function removeFavorite(text) {
    favorites = favorites.filter(f => f !== text);
    localStorage.setItem("fav", JSON.stringify(favorites));
    renderFavorites();
}

// ===== Common / Utils =====
function toggleTheme() {
    theme = theme === "light" ? "dark" : "light";
    localStorage.setItem("theme", theme);
    document.body.setAttribute("data-theme", theme);
}

function playAudio() {
    const list = adhkar[currentCategory];
    if (!list) return;
    const item = list[currentIndex];

    if (item.audio) {
        const audio = new Audio(item.audio);
        audio.play().catch(e => console.log("Audio play error", e));
    } else {
        alert("Audio not available");
    }
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
    document.body.setAttribute("data-theme", theme);
    // Determine greeting
    const hour = new Date().getHours();
    const greetingEl = document.getElementById("greeting");
    if (greetingEl) {
        if (hour < 12) greetingEl.innerText = "صباح الخير";
        else if (hour < 18) greetingEl.innerText = "طاب يومك";
        else greetingEl.innerText = "مساء الخير";
    }

    // Init Tasbeeh
    updateTasbeehDisplay();

    // Init Quran
    if (typeof initQuran === 'function') initQuran();

    // Splash Screen handling
    setTimeout(() => {
        const splash = document.getElementById('splash-screen');
        if (splash) {
            splash.classList.add('splash-hidden');
        }
    }, 2500);

    // Default View
    showView('home');

    // Register Service Worker for PWA
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then(reg => console.log('Service Worker registered'))
                .catch(err => console.log('Service Worker registration failed', err));
        });
    }
});
