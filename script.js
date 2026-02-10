// ===== State Management =====
let count = parseInt(localStorage.getItem("count")) || 0;
let currentTasbeehDhikr = "free";
let tasbeehData = JSON.parse(localStorage.getItem("tasbeehData")) || {};
let customTasbeehText = localStorage.getItem("customTasbeehText") || "";
let customTasbeehTarget = parseInt(localStorage.getItem("customTasbeehTarget")) || 0;

const tasbeehTargets = {
    "free": 0, "subhan_allah": 33, "alhamdulillah": 33, "allahu_akbar": 34,
    "astaghfirullah": 100, "la_ilaha_illa_allah": 100, "subhan_allah_wa_bihamdihi": 100,
    "la_hawla": 0, "salat_ala_nabi": 10, "custom": 0
};

let lang = localStorage.getItem("lang") || "ar";
let theme = localStorage.getItem("theme") ||
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? "dark" : "light");

let favorites = JSON.parse(localStorage.getItem("fav")) || [];
let currentCategory = "morning";
let currentIndex = 0;
let currentCounter = 0;
let repeatTarget = 1;

// ===== Data Loading =====
const adhkar = {};
if (typeof azkarData !== 'undefined') {
    azkarData.forEach(cat => { adhkar[cat.category] = cat.items; });
}

const texts = {
    ar: {
        app: "أنصاري", home: "الرئيسية", tasbeeh: "التسبيح", favorites: "المفضلة", settings: "الإعدادات",
        nightMode: "الوضع الليلي", language: "اللغة", currentLang: "العربية", reminders: "تذكير الأذكار",
        save: "حفظ", morning: "أذكار الصباح", evening: "أذكار المساء", sleep: "أذكار النوم",
        wakeup: "الاستيقاظ", post_prayer: "بعد الصلاة", ramadan_before_iftar: "قبل الإفطار",
        ramadan_after_iftar: "بعد الإفطار", ramadan_night_qiyam: "صلاة القيام",
        duas_kurb: "أدعية الكرب", done: "تقبل الله منك!"
    },
    en: {
        app: "Ansari", home: "Home", tasbeeh: "Tasbeeh", favorites: "Favorites", settings: "Settings",
        nightMode: "Night Mode", language: "Language", currentLang: "English", reminders: "Reminders",
        save: "Save", morning: "Morning", evening: "Evening", sleep: "Sleep",
        wakeup: "Wake-up", post_prayer: "Post-Prayer", ramadan_before_iftar: "Before Iftar",
        ramadan_after_iftar: "After Iftar", ramadan_night_qiyam: "Night Prayer",
        duas_kurb: "Distress Duas", done: "May Allah accept!"
    }
};

// Language & Theme Logic
function toggleLanguage() {
    lang = lang === "ar" ? "en" : "ar";
    localStorage.setItem("lang", lang);
    applyLanguage();
}

function applyLanguage() {
    const t = texts[lang];
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";

    const mappings = {
        "nav-label-home": t.home, "nav-label-tasbeeh": t.tasbeeh,
        "nav-label-favorites": t.favorites, "nav-label-settings": t.settings,
        "settings-title": t.settings, "label-night-mode": t.nightMode,
        "label-language": t.language, "label-reminders": t.reminders,
        "current-lang-text": t.currentLang, "app-subtitle": lang === "ar" ? "رفيقك في الذكر" : "Your Dhikr Companion"
    };

    for (const [id, text] of Object.entries(mappings)) {
        const el = document.getElementById(id);
        if (el) el.innerText = text;
    }
    renderDhikr();
}

function toggleTheme() {
    theme = theme === "light" ? "dark" : "light";
    localStorage.setItem("theme", theme);
    document.body.setAttribute("data-theme", theme);
    updateThemeIcon();
}

function updateThemeIcon() {
    const icon = document.querySelector("#theme-toggle i");
    if (icon) icon.className = theme === "light" ? "ph ph-moon-stars" : "ph ph-sun";
}

// Navigation
function showView(viewId) {
    document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));
    const view = document.getElementById(`view-${viewId}`);
    if (view) {
        view.classList.remove('hidden');
        view.classList.add('fade-in');
    }
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    document.getElementById(`nav-${viewId}`)?.classList.add('active');
    if (viewId === 'favorites') renderFavorites();
    window.scrollTo(0, 0);
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

// Adhkar Logic
function renderDhikr() {
    const item = adhkar[currentCategory]?.[currentIndex];
    if (!item) return;
    document.getElementById("adhkarTitle").innerText = texts[lang][currentCategory] || texts[lang].morning;
    document.getElementById("dhikrText").innerText = (lang === "en" && item.en) ? item.en : item.ar;
    document.getElementById("dhikr-progress-btn").innerText = `${currentCounter} / ${repeatTarget}`;

    const isFav = favorites.includes(item.ar);
    document.getElementById("fav-btn").style.color = isFav ? "#ef4444" : "var(--text-secondary)";
    document.getElementById("fav-btn").querySelector('i').className = isFav ? "ph-fill ph-heart" : "ph ph-heart";
}

function incrementDhikr() {
    if (currentCounter < repeatTarget) {
        currentCounter++;
        hapticFeedback(50);
        if (currentCounter >= repeatTarget) {
            renderDhikr();
            setTimeout(nextDhikr, 300);
        } else {
            renderDhikr();
        }
    }
}

function nextDhikr() {
    if (currentIndex < adhkar[currentCategory].length - 1) {
        currentIndex++;
        currentCounter = 0;
        repeatTarget = adhkar[currentCategory][currentIndex].count || 1;
        renderDhikr();
    } else {
        alert(texts[lang].done);
        showView('home');
    }
}

function prevDhikr() {
    if (currentIndex > 0) {
        currentIndex--;
        currentCounter = 0;
        repeatTarget = adhkar[currentCategory][currentIndex].count || 1;
        renderDhikr();
    }
}

// Tasbeeh Logic
function updateTasbeehDisplay() {
    const countNum = tasbeehData[currentTasbeehDhikr] || 0;
    const target = currentTasbeehDhikr === "custom" ? customTasbeehTarget : tasbeehTargets[currentTasbeehDhikr];
    document.getElementById("tasbeeh-counter").innerText = target > 0 ? `${countNum} / ${target}` : countNum;

    const label = document.getElementById("current-tasbeeh-label");
    const select = document.getElementById("tasbeeh-select");
    label.innerText = currentTasbeehDhikr === "custom" ? (customTasbeehText || "مخصص") : select.options[select.selectedIndex]?.text.split('(')[0].trim();
}

function incrementTasbeeh() {
    const target = currentTasbeehDhikr === "custom" ? customTasbeehTarget : tasbeehTargets[currentTasbeehDhikr];
    if (target > 0 && (tasbeehData[currentTasbeehDhikr] || 0) >= target) {
        hapticFeedback([50, 100, 50]);
        resetTasbeeh();
        return;
    }
    tasbeehData[currentTasbeehDhikr] = (tasbeehData[currentTasbeehDhikr] || 0) + 1;
    localStorage.setItem("tasbeehData", JSON.stringify(tasbeehData));
    updateTasbeehDisplay();
    hapticFeedback(40);
}

function resetTasbeeh() {
    tasbeehData[currentTasbeehDhikr] = 0;
    localStorage.setItem("tasbeehData", JSON.stringify(tasbeehData));
    updateTasbeehDisplay();
}

// Favorites
function toggleFavorite() {
    const item = adhkar[currentCategory][currentIndex];
    if (favorites.includes(item.ar)) {
        favorites = favorites.filter(f => f !== item.ar);
    } else {
        favorites.push(item.ar);
        hapticFeedback(60);
    }
    localStorage.setItem("fav", JSON.stringify(favorites));
    renderDhikr();
}

function renderFavorites() {
    const container = document.getElementById("favorites-list");
    container.innerHTML = favorites.length ? "" : `<p style="text-align:center; color:var(--text-secondary); margin-top:2rem;">${lang === 'ar' ? 'لا توجد مفضلات' : 'No favorites'}</p>`;
    favorites.forEach(text => {
        const div = document.createElement("div");
        div.className = "dhikr-card fade-in";
        div.style.padding = "1.5rem";
        div.innerHTML = `<p class="dhikr-arabic" style="font-size:1.2rem; margin-bottom:1rem;">${text}</p>
                         <button onclick="removeFavorite('${text.replace(/'/g, "\\'")}')" class="icon-btn" style="color:#ef4444;"><i class="ph ph-trash"></i></button>`;
        container.appendChild(div);
    });
}

function removeFavorite(text) {
    favorites = favorites.filter(f => f !== text);
    localStorage.setItem("fav", JSON.stringify(favorites));
    renderFavorites();
}

// Ramadan List Logic
let ramadanCounters = JSON.parse(localStorage.getItem("ramadanCounters")) || {};

function openRamadanList(category) {
    if (!adhkar[category]) return;
    currentCategory = category;
    const container = document.getElementById("ramadan-azkar-container");
    document.getElementById("ramadan-list-title").innerText = texts[lang][category];
    container.innerHTML = "";
    adhkar[category].forEach((item, index) => {
        const key = `${category}_${index}`;
        const div = document.createElement("div");
        div.className = "dhikr-card fade-in";
        div.innerHTML = `
            <p class="dhikr-arabic" style="font-size: 1.3rem; margin-bottom: 1.5rem;">${item.ar}</p>
            <div style="display: flex; align-items: center; justify-content: space-between; background: var(--primary-light); padding: 0.75rem 1.5rem; border-radius: var(--radius-full);">
                <span id="count-${key}" style="font-size: 1.5rem; font-weight: 800; color: var(--primary-color);">${ramadanCounters[key] || 0}</span>
                <button onclick="incrementRamadanZikr('${key}')" class="main-btn" style="width: 50px; height: 50px; border-radius: 50%; background: var(--primary-color); color: white; display:flex; align-items:center; justify-content:center; font-size:1.5rem;"><i class="ph ph-plus"></i></button>
            </div>`;
        container.appendChild(div);
    });
    showView('ramadan-list');
}

function incrementRamadanZikr(key) {
    ramadanCounters[key] = (ramadanCounters[key] || 0) + 1;
    localStorage.setItem("ramadanCounters", JSON.stringify(ramadanCounters));
    document.getElementById(`count-${key}`).innerText = ramadanCounters[key];
    hapticFeedback(50);
}

function resetRamadanList() {
    if (confirm(lang === 'ar' ? "تصفير الكل؟" : "Reset all?")) {
        const prefix = `${currentCategory}_`;
        for (let k in ramadanCounters) if (k.startsWith(prefix)) ramadanCounters[k] = 0;
        localStorage.setItem("ramadanCounters", JSON.stringify(ramadanCounters));
        openRamadanList(currentCategory);
    }
}

// Helpers
function hapticFeedback(pattern) {
    if (navigator.vibrate) navigator.vibrate(pattern);
}

function playAudio() {
    const item = adhkar[currentCategory][currentIndex];
    if (item.audio) new Audio(item.audio).play().catch(() => alert("Error playing audio"));
    else alert(lang === 'ar' ? "الصوت غير متوفر" : "Audio unavailable");
}

function saveReminder() {
    const time = document.getElementById("reminder-time").value;
    if (time) {
        localStorage.setItem("reminderTime", time);
        alert(texts[lang].done);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    document.body.setAttribute("data-theme", theme);
    updateThemeIcon();
    applyLanguage();
    updateTasbeehDisplay();
    setTimeout(() => document.getElementById('splash-screen')?.classList.add('splash-hidden'), 2000);
    showView('home');
});
