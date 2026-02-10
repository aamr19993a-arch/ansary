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
    ar: {
        app: "أنصاري",
        home: "الرئيسية",
        tasbeeh: "التسبيح",
        favorites: "المفضلة",
        settings: "الإعدادات",
        nightMode: "الوضع الليلي",
        language: "اللغة (Language)",
        currentLang: "العربية",
        reminders: "تذكير الأذكار",
        save: "حفظ",
        morning: "أذكار الصباح",
        evening: "أذكار المساء",
        sleep: "أذكار النوم",
        wakeup: "أذكار الاستيقاظ",
        post_prayer: "أذكار بعد الصلاة",
        quran: "المصحف الشريف",
        search: "بحث عن سورة...",
        reset: "تصفير العداد",
        next: "التالي",
        prev: "السابق",
        done: "تم الانتهاء من الأذكار لهذه المجموعة",
        audioErr: "الصوت غير متوفر حالياً",
        reminderSet: "تم ضبط التذكير بنجاح",
        notifDenied: "يرجى تفعيل التنبيهات من إعدادات المتصفح",
        categories: "الأقسام"
    },
    en: {
        app: "Ansari",
        home: "Home",
        tasbeeh: "Tasbeeh",
        favorites: "Favorites",
        settings: "Settings",
        nightMode: "Night Mode",
        language: "Language",
        currentLang: "English",
        reminders: "Dhikr Reminders",
        save: "Save",
        morning: "Morning Dhikr",
        evening: "Evening Dhikr",
        sleep: "Sleep Dhikr",
        wakeup: "Wake-up Dhikr",
        post_prayer: "Post-Prayer Dhikr",
        quran: "Holy Quran",
        search: "Search Surah...",
        reset: "Reset Counter",
        next: "Next",
        prev: "Previous",
        done: "You have finished this category",
        audioErr: "Audio not available",
        reminderSet: "Reminder set successfully",
        notifDenied: "Please enable notifications in browser settings",
        categories: "Categories"
    }
};

// Language Logic
function toggleLanguage() {
    lang = lang === "ar" ? "en" : "ar";
    localStorage.setItem("lang", lang);
    applyLanguage();
}

function applyLanguage() {
    const t = texts[lang];
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";

    // Update UI elements by ID
    const mappings = {
        "nav-label-home": t.home,
        "nav-label-tasbeeh": t.tasbeeh,
        "nav-label-favorites": t.favorites,
        "nav-label-settings": t.settings,
        "settings-title": t.settings,
        "label-night-mode": t.nightMode,
        "label-language": t.language,
        "label-reminders": t.reminders,
        "current-lang-text": t.currentLang,
        "surah-search": t.search // Placeholder handled differently
    };

    for (const [id, text] of Object.entries(mappings)) {
        const el = document.getElementById(id);
        if (el) {
            if (el.tagName === "INPUT") el.placeholder = text;
            else el.innerText = text;
        }
    }

    // Update Category Titles and other dynamic content
    renderDhikr();
    if (typeof renderSurahs === 'function') renderSurahs(); // Refresh Quran list if needed
}

// Notification Logic
function saveReminder() {
    const timeInput = document.getElementById("reminder-time");
    const status = document.getElementById("reminder-status");
    const t = texts[lang];

    if (!timeInput.value) return;

    if (!("Notification" in window)) {
        alert("This browser does not support notifications");
        return;
    }

    Notification.requestPermission().then(permission => {
        if (permission === "granted") {
            localStorage.setItem("reminderTime", timeInput.value);
            status.innerText = `${t.reminderSet}: ${timeInput.value}`;
            status.style.color = "var(--primary-color)";
            scheduleNotification(timeInput.value);
        } else {
            status.innerText = t.notifDenied;
            status.style.color = "var(--danger-color, #f44336)";
        }
    });
}

function scheduleNotification(time) {
    // Simple check every minute (In a real app, this would be a background task or service worker)
    if (window.reminderInterval) clearInterval(window.reminderInterval);

    window.reminderInterval = setInterval(() => {
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

        if (currentTime === time) {
            new Notification("تطبيق أنصاري - Ansari", {
                body: texts[lang].reminder || "📿 حان وقت الأذكار",
                icon: "app_logo.svg"
            });
            // To avoid multiple triggers in the same minute
            clearInterval(window.reminderInterval);
            setTimeout(() => scheduleNotification(time), 61000);
        }
    }, 60000);
}

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
    const t = texts[lang];

    document.getElementById("adhkarTitle").innerText = t[currentCategory] || t.morning;

    // Show English if available and language is English, else Arabic
    const dhikrTextEl = document.getElementById("dhikrText");
    if (lang === "en" && item.en && item.en.trim() !== "") {
        dhikrTextEl.innerText = item.en;
    } else {
        dhikrTextEl.innerText = item.ar;
    }

    // Update progress button
    const btn = document.getElementById("dhikr-progress-btn");
    btn.innerText = `${currentCounter} / ${repeatTarget}`;

    // Update Favorite Icon State
    const favBtn = document.getElementById("fav-btn");
    const isFav = favorites.includes(item.ar); // Check by Arabic text as ID
    favBtn.style.color = isFav ? "var(--primary-color)" : "var(--text-secondary)";
}

function nextDhikr() {
    const list = adhkar[currentCategory];
    if (!list) return;

    currentIndex++;
    if (currentIndex >= list.length) {
        alert(texts[lang].done);
        showView('home');
        return;
    }

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

        const btn = document.getElementById("dhikr-progress-btn");
        btn.style.transform = "scale(0.95)";
        setTimeout(() => btn.style.transform = "scale(1)", 100);

        if (currentCounter >= repeatTarget) {
            renderDhikr();
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

// ===== Tasbeeh Logic =====
function changeTasbeehDhikr() {
    const select = document.getElementById("tasbeeh-select");
    currentTasbeehDhikr = select.value;

    const customFields = document.getElementById("custom-setup-fields");
    if (currentTasbeehDhikr === "custom") {
        customFields.classList.remove("hidden");
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
    const countNum = tasbeehData[currentTasbeehDhikr] || 0;
    const target = currentTasbeehDhikr === "custom" ? customTasbeehTarget : tasbeehTargets[currentTasbeehDhikr];

    if (target > 0) {
        document.getElementById("tasbeeh-counter").innerText = `${countNum} / ${target}`;
    } else {
        document.getElementById("tasbeeh-counter").innerText = countNum;
    }

    const label = document.getElementById("current-tasbeeh-label");
    if (label) {
        if (currentTasbeehDhikr === "free") {
            label.innerText = "";
        } else if (currentTasbeehDhikr === "custom") {
            label.innerText = customTasbeehText || (lang === "ar" ? "تسبيح مخصص" : "Custom Tasbeeh");
        } else {
            const select = document.getElementById("tasbeeh-select");
            const text = select.options[select.selectedIndex]?.text || "";
            label.innerText = text.split('(')[0].trim();
        }
    }

    const btn = document.getElementById("tasbeeh-btn");
    if (btn) {
        if (target > 0 && countNum >= target) {
            btn.style.background = "linear-gradient(135deg, #4CAF50, #45a049)";
        } else {
            btn.style.background = "linear-gradient(135deg, var(--secondary-color), var(--primary-color))";
        }
    }
}

function incrementTasbeeh() {
    const target = currentTasbeehDhikr === "custom" ? customTasbeehTarget : tasbeehTargets[currentTasbeehDhikr];
    const currentCountNum = tasbeehData[currentTasbeehDhikr] || 0;

    if (target > 0 && currentCountNum >= target) {
        const msg = lang === "ar" ? `تم الوصول للهدف (${target})!\nهل تريد إعادة العداد؟` : `Target reached (${target})!\nReset counter?`;
        if (confirm(msg)) {
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

    const btn = document.getElementById("tasbeeh-btn");
    btn.style.transform = "scale(0.95)";
    setTimeout(() => btn.style.transform = "scale(1)", 100);

    if (navigator.vibrate) navigator.vibrate(5);

    if (target > 0 && tasbeehData[currentTasbeehDhikr] === target) {
        if (navigator.vibrate) navigator.vibrate([50, 100, 50]);
        setTimeout(() => {
            const celebMsg = lang === "ar" ? `مبارك! تم إكمال ${target} تسبيحة 🎉` : `Congratulations! You completed ${target} Tasbeeh 🎉`;
            alert(celebMsg);
        }, 200);
    }
}

function resetTasbeeh() {
    const msg = lang === "ar" ? "هل أنت متأكد من تصفير العداد؟" : "Are you sure you want to reset?";
    if (confirm(msg)) {
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
    renderDhikr();
}

function renderFavorites() {
    const container = document.getElementById("favorites-list");
    container.innerHTML = "";

    if (favorites.length === 0) {
        container.innerHTML = `<div style="text-align: center; color: var(--text-secondary); margin-top: 2rem;">${lang === "ar" ? "لا توجد أذكار مفضلة حتى الآن" : "No favorites yet"}</div>`;
        return;
    }

    favorites.forEach(text => {
        const div = document.createElement("div");
        div.className = "dhikr-card";
        div.style.marginBottom = "1rem";
        div.innerHTML = `
            <p class="dhikr-arabic" style="font-size: 1.25rem;">${text}</p>
            <button onclick="removeFavorite('${text.replace(/'/g, "\\'")}')" class="icon-btn" style="color: var(--primary-color);"><i class="ph ph-trash"></i></button>
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
        alert(texts[lang].audioErr);
    }
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
    document.body.setAttribute("data-theme", theme);

    // Check saved reminder
    const savedTime = localStorage.getItem("reminderTime");
    if (savedTime) {
        const timeInput = document.getElementById("reminder-time");
        if (timeInput) timeInput.value = savedTime;
        scheduleNotification(savedTime);
    }

    applyLanguage();

    // Default View logic with shortcuts
    const urlParams = new URLSearchParams(window.location.search);
    const viewParam = urlParams.get('view');
    if (viewParam) {
        if (viewParam === 'morning' || viewParam === 'evening' || viewParam === 'sleep' || viewParam === 'wakeup' || viewParam === 'post_prayer') {
            openAdhkar(viewParam);
        } else {
            showView(viewParam);
        }
    } else {
        showView('home');
    }

    // Init Tasbeeh
    updateTasbeehDisplay();

    // Init Quran
    if (typeof initQuran === 'function') initQuran();

    // Splash Screen
    setTimeout(() => {
        const splash = document.getElementById('splash-screen');
        if (splash) splash.classList.add('splash-hidden');
    }, 2500);

    // Service Worker
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then(reg => console.log('Service Worker registered'))
                .catch(err => console.log('Service Worker registration failed', err));
        });
    }
});
