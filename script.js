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
        duas_kurb: "أدعية الكرب", done: "تقبل الله منك!", enable_reminder: "تفعيل التنبيهات",
        quiet_hours: "ساعات الهدوء", quick_options: "خيارات سريعة", remind_every: "ذكرني كل:",
        qibla: "القبلة", qibla_direction: "اتجاه القبلة", calibrating: "جاري المعايرة...", qibla_deg: "درجة القبلة من الشمال", recalibrate: "إعادة معايرة",
        quranic_duas: "أدعية قرآنية", prophetic_duas: "أدعية نبوية", travel_istikhara: "السفر والاستخارة"
    },
    en: {
        app: "Ansari", home: "Home", tasbeeh: "Tasbeeh", favorites: "Favorites", settings: "Settings",
        nightMode: "Night Mode", language: "Language", currentLang: "English", reminders: "Reminders",
        save: "Save", morning: "Morning", evening: "Evening", sleep: "Sleep",
        wakeup: "Wake-up", post_prayer: "Post-Prayer", ramadan_before_iftar: "Before Iftar",
        ramadan_after_iftar: "After Iftar", ramadan_night_qiyam: "Night Prayer",
        duas_kurb: "Distress Duas", done: "May Allah accept!", enable_reminder: "Enable Notifications",
        quiet_hours: "Quiet Hours", quick_options: "Quick Options", remind_every: "Remind every:",
        qibla: "Qibla", qibla_direction: "Qibla Direction", calibrating: "Calibrating...", qibla_deg: "Qibla Degrees from North", recalibrate: "Recalibrate",
        quranic_duas: "Quranic Duas", prophetic_duas: "Prophetic Duas", travel_istikhara: "Travel & Istikhara"
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
        "label-language": t.language, "label-reminders": t.reminders, "label-enable-reminder": t.enable_reminder,
        "current-lang-text": t.currentLang, "app-subtitle": lang === "ar" ? "رفيقك في الذكر" : "Your Dhikr Companion",
        "nav-label-qibla": t.qibla
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
    // Hide all views
    document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));
    const view = document.getElementById(`view-${viewId}`);
    if (view) {
        view.classList.remove('hidden');
        view.classList.add('fade-in');
    }
    // Update active state in bottom nav
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    const activeNav = document.getElementById(`nav-${viewId}`);
    if (activeNav) activeNav.classList.add('active');

    // This line was not in the original content, but is in the instruction's example.
    // Assuming it's part of the intended change for context.
    // let currentView = viewId; 

    if (viewId === 'favorites') renderFavorites();
    window.scrollTo(0, 0);

    // Stop things from other views
    if (viewId !== 'quran-read') {
        if (typeof stopAutoScroll === 'function') stopAutoScroll();
    }
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

// Quran Logic
let allSurahs = [];

async function openQuranList() {
    showView('quran-list');
    if (allSurahs.length === 0) {
        const container = document.getElementById("surah-list-container");
        container.innerHTML = '<div style="text-align:center; padding:2rem;"><div class="splash-loader" style="margin:0 auto;"></div><p style="margin-top:1rem;">جاري تحميل قائمة السور...</p></div>';

        try {
            const response = await fetch('https://api.alquran.cloud/v1/surah');
            const data = await response.json();
            allSurahs = data.data;
            renderSurahList(allSurahs);
        } catch (error) {
            container.innerHTML = '<p style="text-align:center; color:#ef4444; padding:2rem;">فشل تحميل قائمة السور. يرجى التأكد من الاتصال بالإنترنت.</p>';
        }
    }
}

function renderSurahList(surahs) {
    const container = document.getElementById("surah-list-container");
    container.innerHTML = "";
    surahs.forEach(surah => {
        const div = document.createElement("div");
        div.className = "category-card";
        div.style.flexDirection = "row";
        div.style.justifyContent = "space-between";
        div.style.padding = "1.25rem 1.5rem";
        div.style.width = "100%";
        div.onclick = () => openSurah(surah.number, surah.name);

        div.innerHTML = `
            <div style="display: flex; align-items: center; gap: 1rem;">
                <span style="width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; background: var(--primary-light); color: var(--primary-color); border-radius: 50%; font-weight: 800; font-size: 0.9rem;">${surah.number}</span>
                <div style="text-align: right;">
                    <h3 class="category-title" style="margin: 0; font-size: 1.1rem;">${surah.name}</h3>
                    <p style="font-size: 0.8rem; color: var(--text-secondary); margin: 0;">${surah.englishName} • ${surah.numberOfAyahs} آية</p>
                </div>
            </div>
            <i class="ph ph-caret-left" style="color: var(--text-secondary);"></i>
        `;
        container.appendChild(div);
    });
}

function filterSurahs() {
    const term = document.getElementById("quran-search").value.toLowerCase();
    const filtered = allSurahs.filter(s =>
        s.name.includes(term) ||
        s.englishName.toLowerCase().includes(term) ||
        s.number.toString() === term
    );
    renderSurahList(filtered);
}

let readingMode = 'vertical'; // 'vertical' | 'horizontal'
let showTafseer = false;
let currentSurahData = null; // Store fetched data
let currentSurahNumber = 1;

async function openSurah(number, name) {
    showView('quran-read');
    document.getElementById("surah-read-title").innerText = name;
    currentSurahNumber = number; // Update state
    const container = document.getElementById("surah-content");
    container.innerHTML = '<div style="text-align:center; padding:2rem;"><div class="splash-loader" style="margin:0 auto;"></div><p style="margin-top:1rem;">جاري تحميل الآيات والتفسير...</p></div>';

    try {
        // Fetch Quran and Tafseer (Al-Muyassar) in one go
        const response = await fetch(`https://api.alquran.cloud/v1/surah/${number}/editions/quran-uthmani,ar.muyassar`);
        const data = await response.json();

        // Organize data: edition[0] is Quran, edition[1] is Tafseer
        const quranAyahs = data.data[0].ayahs;
        const tafseerAyahs = data.data[1].ayahs;

        // Merge them
        currentSurahData = quranAyahs.map((ayah, i) => ({
            ...ayah,
            tafseer: tafseerAyahs[i].text
        }));

        renderSurah(currentSurahData, number);
    } catch (error) {
        console.error(error);
        container.innerHTML = '<p style="text-align:center; color:#ef4444; padding:2rem;">فشل تحميل السورة. يرجى التأكد من الاتصال بالإنترنت.</p>';
    }
}

function renderSurah(ayahs, surahNumber) {
    const container = document.getElementById("surah-content");

    // Apply Reading Mode Class
    if (readingMode === 'horizontal') {
        container.classList.remove('quran-page-frame');
        container.classList.add('quran-read-horizontal');
    } else {
        container.classList.add('quran-page-frame'); // Add decoration in vertical mode
        container.classList.remove('quran-read-horizontal');
    }

    let html = "";

    // Add Basmala logic
    // Add Basmala for all Surahs except At-Tawbah (9) and Al-Fatiha (1) (since Fatiha usually includes it as ayah 1)
    // Actually API for quran-uthmani usually has Bismillah as Ayah 1 for Fatiha.
    // For others, we need to add it manually if it's not part of the text.
    if (surahNumber !== 9 && surahNumber !== 1 && readingMode === 'vertical') {
        html += `
            <div class="basmala-container">
                <p class="dhikr-arabic" style="font-size: 1.5rem;">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</p>
            </div>
        `;
    }

    if (readingMode === 'vertical') {
        // Vertical Mode: Standard Text Block
        ayahs.forEach((ayah) => {
            html += `<span class="ayah-container" onclick="toggleSingleTafseer(${ayah.numberInSurah})">
                <span class="ayah-text">${ayah.text}</span> 
                <span class="ayah-number">${ayah.numberInSurah}</span>
                <div id="tafseer-${ayah.numberInSurah}" class="tafseer-box ${showTafseer ? 'active' : ''}">${ayah.tafseer}</div>
            </span> `;
        });
    } else {
        // Horizontal Mode: Cards
        ayahs.forEach((ayah) => {
            html += `
                <div class="ayah-card">
                    <div style="flex:1; display:flex; flex-direction:column; justify-content:center; align-items:center; text-align:center; width:100%;">
                        <p class="ayah-text" style="font-size: 1.8rem; line-height: 2;">${ayah.text}</p>
                        <div class="ayah-number" style="margin-top:1rem;">${ayah.numberInSurah}</div>
                    </div>
                    <div class="tafseer-box ${showTafseer ? 'active' : ''}" style="width:100%; max-height: 150px; overflow-y: auto;">
                        ${ayah.tafseer}
                    </div>
                </div>
            `;
        });
    }

    container.innerHTML = html;

    // Reset Scroll
    if (readingMode === 'vertical') window.scrollTo(0, 0);
    else container.scrollLeft = container.scrollWidth; // Start from right (RTL)
}

// Auto Scroll Logic
let autoScrollInterval = null;
let isScrolling = false;
let scrollSpeed = 1; // 1x

function toggleAutoScroll() {
    const btn = document.getElementById("btn-auto-scroll");
    const icon = btn.querySelector("i");

    if (isScrolling) {
        stopAutoScroll();
        if (icon) icon.className = "ph ph-play";
    } else {
        startAutoScroll();
        if (icon) icon.className = "ph ph-pause";
    }
}

function startAutoScroll() {
    isAutoScrolling = true;

    const btn = document.getElementById('btn-auto-scroll');
    btn.classList.add('active');
    btn.querySelector('i').className = "ph ph-pause";

    // Disable sleep prevention would go here if we had a plugin for it

    if (readingMode === 'vertical') {
        const intervalTime = 50 / scrollSpeed; // Base 50ms. 2x = 25ms
        autoScrollInterval = setInterval(() => {
            window.scrollBy(0, 1);
            // Check if reached bottom
            if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight) {
                stopAutoScroll();
            }
        }, intervalTime);
    } else {
        // Horizontal Mode: Flip every N seconds
        const baseDelay = 6000; // 6 seconds base for a card
        const delay = baseDelay / scrollSpeed;

        autoScrollInterval = setInterval(() => {
            const container = document.getElementById("surah-content");
            const cardWidth = container.offsetWidth; // approximate
            // If strictly snap, we can just scrollBy width
            container.scrollBy({ left: -cardWidth, behavior: 'smooth' }); // RTL: negative left

            // Check boundaries
            if (Math.abs(container.scrollLeft) >= (container.scrollWidth - container.clientWidth - 10)) {
                stopAutoScroll();
            }
        }, delay);
    }
}

function stopAutoScroll() {
    isAutoScrolling = false;
    clearInterval(autoScrollInterval);
    const btn = document.getElementById('btn-auto-scroll');
    if (btn) {
        btn.classList.remove('active');
        btn.querySelector('i').className = "ph ph-play";
    }
}

function updateScrollSpeed() {
    scrollSpeed = parseFloat(document.getElementById('scroll-speed').value);
    if (isAutoScrolling) {
        stopAutoScroll();
        startAutoScroll(); // Restart with new speed
    }
}

// Modify toggleReadingMode to stop scroll
function toggleReadingMode() {
    stopAutoScroll(); // Stop logic

    readingMode = readingMode === 'vertical' ? 'horizontal' : 'vertical';
    const btn = document.getElementById('btn-reading-mode');
    if (readingMode === 'horizontal') {
        btn.classList.add('active');
        btn.querySelector('i').className = "ph ph-arrows-out-line-vertical";
    } else {
        btn.classList.remove('active');
        btn.querySelector('i').className = "ph ph-arrows-out-line-horizontal";
    }

    // Re-render if data exists
    if (currentSurahData) {
        renderSurah(currentSurahData, currentSurahNumber);
    }
}

function toggleTafseerVisibility() {
    showTafseer = !showTafseer;
    const btn = document.getElementById('btn-tafseer');
    btn.classList.toggle('active', showTafseer);

    document.querySelectorAll('.tafseer-box').forEach(el => {
        if (showTafseer) el.classList.add('active');
        else el.classList.remove('active');
    });
}

function toggleSingleTafseer(ayahNum) {
    if (showTafseer) return; // If global tafseer is on, ignore individual toggle
    const el = document.getElementById(`tafseer-${ayahNum}`);
    if (el) el.classList.toggle('active');
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

// Reminder Interval Logic
let reminderInterval = JSON.parse(localStorage.getItem("reminderInterval")) || { hours: 0, minutes: 30 };
let reminderEnabled = localStorage.getItem("reminderEnabled") === "true";
let quietHoursEnabled = localStorage.getItem("quietHoursEnabled") === "true";
let quietStart = localStorage.getItem("quietStart") || "23:00";
let quietEnd = localStorage.getItem("quietEnd") || "05:00";

let lastRemindedTime = parseInt(localStorage.getItem("lastRemindedTime")) || Date.now();
let reminderLoopInterval = null;

function initReminders() {
    const toggle = document.getElementById("reminder-toggle");
    const hoursInput = document.getElementById("reminder-hours");
    const minsInput = document.getElementById("reminder-minutes");
    const quietToggle = document.getElementById("quiet-toggle");
    const quietStartInput = document.getElementById("quiet-start");
    const quietEndInput = document.getElementById("quiet-end");

    if (toggle) {
        toggle.checked = reminderEnabled;
        toggleReminder(reminderEnabled);
    }
    if (hoursInput) hoursInput.value = reminderInterval.hours;
    if (minsInput) minsInput.value = reminderInterval.minutes;

    if (quietToggle) {
        quietToggle.checked = quietHoursEnabled;
        toggleQuietHours(quietHoursEnabled);
    }
    if (quietStartInput) quietStartInput.value = quietStart;
    if (quietEndInput) quietEndInput.value = quietEnd;

    if (reminderEnabled) startReminderLoop();
}

function setReminderPreset(h, m) {
    document.getElementById("reminder-hours").value = h;
    document.getElementById("reminder-minutes").value = m;
    hapticFeedback(30);
}

function toggleReminder(checked) {
    const settingsDiv = document.getElementById("reminder-settings");
    reminderEnabled = checked;
    localStorage.setItem("reminderEnabled", checked);
    if (settingsDiv) settingsDiv.style.display = checked ? "flex" : "none";
    if (checked) startReminderLoop();
    else stopReminderLoop();
}

function toggleQuietHours(checked) {
    const inputsDiv = document.getElementById("quiet-inputs");
    quietHoursEnabled = checked;
    localStorage.setItem("quietHoursEnabled", checked);
    if (inputsDiv) inputsDiv.style.display = checked ? "flex" : "none";
}

function saveReminderSettings() {
    const h = parseInt(document.getElementById("reminder-hours").value) || 0;
    const m = parseInt(document.getElementById("reminder-minutes").value) || 1;

    // Save Quiet Hours
    quietStart = document.getElementById("quiet-start").value;
    quietEnd = document.getElementById("quiet-end").value;
    localStorage.setItem("quietStart", quietStart);
    localStorage.setItem("quietEnd", quietEnd);

    reminderInterval = { hours: h, minutes: m };
    localStorage.setItem("reminderInterval", JSON.stringify(reminderInterval));

    // Reset timer
    lastRemindedTime = Date.now();
    localStorage.setItem("lastRemindedTime", lastRemindedTime);

    showToast(texts[lang].done, lang === 'ar' ? 'تم حفظ الإعدادات' : 'Settings saved');
    stopReminderLoop();
    startReminderLoop();
}

function startReminderLoop() {
    if (reminderLoopInterval) clearInterval(reminderLoopInterval);
    reminderLoopInterval = setInterval(() => {
        const now = Date.now();
        const intervalMs = ((reminderInterval.hours * 60) + reminderInterval.minutes) * 60 * 1000;

        if (now - lastRemindedTime >= intervalMs) {
            checkAndTriggerReminder();
        }
    }, 60000);
}

function stopReminderLoop() {
    if (reminderLoopInterval) clearInterval(reminderLoopInterval);
}

function checkAndTriggerReminder() {
    const now = new Date();

    if (quietHoursEnabled) {
        const currentMins = now.getHours() * 60 + now.getMinutes();
        const startParts = quietStart.split(':');
        const endParts = quietEnd.split(':');
        const startMins = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
        const endMins = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);

        let isQuiet = false;
        if (startMins < endMins) {
            // e.g. 14:00 to 16:00
            if (currentMins >= startMins && currentMins < endMins) isQuiet = true;
        } else {
            // e.g. 23:00 to 05:00 (crosses midnight)
            if (currentMins >= startMins || currentMins < endMins) isQuiet = true;
        }

        if (isQuiet) {
            console.log("Quiet hours active, skipping reminder.");
            return;
        }
    }

    triggerReminder();
    lastRemindedTime = Date.now();
    localStorage.setItem("lastRemindedTime", lastRemindedTime);
}

function triggerReminder() {
    // Pick a random dhikr title
    const randomCat = azkarData[Math.floor(Math.random() * azkarData.length)];
    const text = randomCat.items[0].ar;

    // System Notification
    if ("Notification" in window && Notification.permission === "granted") {
        new Notification(lang === 'ar' ? "تذكير" : "Reminder", {
            body: lang === 'ar' ? "حان وقت ذكر الله" : "Time to remember Allah",
            icon: "icon-192.png",
            tag: "dhikr-reminder"
        });
    }

    // In-App Toast
    showToast(lang === 'ar' ? "ذكر الله" : "Dhikr", text);

    playAudio();
}

// Toast System
function showToast(title, message) {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = `
        <div style="background:var(--primary-light); padding:0.5rem; border-radius:50%; color:var(--primary-color);">
            <i class="ph ph-bell-ringing" style="font-size:1.2rem;"></i>
        </div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
    `;

    container.appendChild(toast);
    hapticFeedback(40);

    setTimeout(() => {
        toast.classList.add('hiding');
        toast.addEventListener('animationend', () => toast.remove());
    }, 4000);
}

document.getElementById("reminder-toggle")?.addEventListener('change', () => requestNotificationPermission());

// Prayer Times Logic
// Prayer Times Logic
let prayerTimes = null;
let nextPrayerTimeout = null;
let notificationPermission = false;
let calcMethod = localStorage.getItem("prayerTimesMethod") || "4"; // Default Makkah
let asrMethod = localStorage.getItem("asrMethod") || "0"; // Default Standard (0)
let quranSurahs = [];

// Request Notification Permission on load (or user interaction)
function requestNotificationPermission() {
    if ("Notification" in window) {
        Notification.requestPermission().then(permission => {
            notificationPermission = permission === "granted";
        });
    }
}

function saveCalcMethod() {
    const select = document.getElementById("calc-method-select");
    if (select) {
        calcMethod = select.value;
        localStorage.setItem("calcMethod", calcMethod);
        fetchPrayerTimes(true); // Refresh with new method
        alert(texts[lang].done);
    }
}

// Initialize Calc Method Select
function initCalcMethodSelect() {
    const select = document.getElementById("calc-method-select");
    if (select) {
        select.value = calcMethod;
    }
}

// Geolocation Helper
function getUserLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error("Geolocation not supported"));
            return;
        }

        const options = {
            enableHighAccuracy: true,
            timeout: 15000, // Increased timeout for mobile
            maximumAge: 0
        };

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                });
            },
            (error) => {
                reject(error);
            },
            options
        );
    });
}

async function fetchPrayerTimes(forceRefresh = false) {
    const container = document.getElementById("prayer-times-list");
    if (container) container.innerHTML = '<div class="splash-loader" style="margin: 2rem auto;"></div>';

    if (!forceRefresh) {
        // Try to load from localStorage first
        const cached = localStorage.getItem("prayerTimesData");
        const cachedDate = localStorage.getItem("prayerTimesDate");
        const cachedMethod = localStorage.getItem("prayerTimesMethod");
        const cachedAsr = localStorage.getItem("asrMethod");
        const today = new Date().toDateString();

        if (cached && cachedDate === today && cachedMethod === calcMethod && cachedAsr === asrMethod) {
            prayerTimes = JSON.parse(cached);
            renderPrayerTimes(prayerTimes);
            return;
        }
    }

    try {
        document.getElementById("location-name").innerText = lang === 'ar' ? "جاري تحديد الموقع..." : "Locating...";

        const coords = await getUserLocation();
        const date = new Date();

        // Fetch today's timings
        const response = await fetch(`https://api.aladhan.com/v1/timings/${Math.floor(date.getTime() / 1000)}?latitude=${coords.lat}&longitude=${coords.lng}&method=${calcMethod}&school=${asrMethod}`);
        const data = await response.json();

        prayerTimes = data.data;
        localStorage.setItem("prayerTimesData", JSON.stringify(prayerTimes));
        localStorage.setItem("prayerTimesDate", new Date().toDateString());
        localStorage.setItem("prayerTimesMethod", calcMethod);
        localStorage.setItem("asrMethod", asrMethod);

        // Update Location Name
        document.getElementById("location-name").innerText = `Lat: ${coords.lat.toFixed(4)}, Lon: ${coords.lng.toFixed(4)}`;

        renderPrayerTimes(prayerTimes);

    } catch (error) {
        console.error("Prayer Times Error:", error);

        // Better Error UI
        let errorMsg = lang === 'ar' ? "فشل تحديد الموقع أو الاتصال" : "Location or Network Error";
        let actionBtn = `<button onclick="fetchPrayerTimes(true)" class="main-btn" style="margin-top:1rem; padding:0.5rem 1.5rem; border-radius:var(--radius-full); background:var(--primary-color); color:white;">${lang === 'ar' ? 'إعادة المحاولة' : 'Retry'}</button>`;

        if (error.code === 1) { // Permission Denied
            errorMsg = lang === 'ar' ? "تم رفض إذن الموقع. يرجى تفعيله من إعدادات المتصفح." : "Location permission denied. Please enable it in browser settings.";
            actionBtn = ""; // Can't retry if denied, user must fix settings
        } else if (error.code === 2) { // Position Unavailable
            errorMsg = lang === 'ar' ? "تعذر تحديد الموقع بدقة." : "Location unavailable.";
        } else if (error.code === 3) { // Timeout
            errorMsg = lang === 'ar' ? "انتهت مهلة تحديد الموقع." : "Location request timed out.";
        }

        if (container) {
            container.innerHTML = `
                <div style="text-align:center; padding:2rem; color:var(--text-secondary);">
                    <i class="ph ph-warning-circle" style="font-size:3rem; color:var(--danger-color); margin-bottom:1rem;"></i>
                    <p style="margin-bottom:1rem;">${errorMsg}</p>
                    ${actionBtn}
                </div>
            `;
        }
        document.getElementById("location-name").innerText = lang === 'ar' ? "خطأ في الموقع" : "Location Error";
    }
}

// Customization Logic
let fontSizeLevel = localStorage.getItem("fontSizeLevel") || "medium"; // small, medium, large
let hijriAdjustment = parseInt(localStorage.getItem("hijriAdjustment")) || 0;

function applyFontSize() {
    const root = document.documentElement;
    let dhikrSize, quranSize;

    switch (fontSizeLevel) {
        case 'small':
            dhikrSize = "1.3rem";
            quranSize = "1.2rem";
            break;
        case 'large':
            dhikrSize = "2rem";
            quranSize = "1.9rem";
            break;
        default: // medium
            dhikrSize = "1.6rem";
            quranSize = "1.5rem";
            break;
    }

    root.style.setProperty('--font-size-dhikr', dhikrSize);
    root.style.setProperty('--font-size-quran', quranSize);
}

function setFontSize(level) {
    fontSizeLevel = level;
    localStorage.setItem("fontSizeLevel", level);
    applyFontSize();
    hapticFeedback(40);
}

function adjustHijri(amount) {
    hijriAdjustment += amount;
    // Limit to +/- 2 days usually
    if (hijriAdjustment > 2) hijriAdjustment = 2;
    if (hijriAdjustment < -2) hijriAdjustment = -2;

    localStorage.setItem("hijriAdjustment", hijriAdjustment);
    document.getElementById("hijri-adj-value").innerText = (hijriAdjustment > 0 ? "+" : "") + hijriAdjustment;

    // Refresh prayer times display to show new date
    if (prayerTimes) renderPrayerTimes(prayerTimes);
}

function initSettings() {
    applyFontSize();
    const haEl = document.getElementById("hijri-adj-value");
    if (haEl) haEl.innerText = (hijriAdjustment > 0 ? "+" : "") + hijriAdjustment;

    if (document.getElementById("night-mode-toggle")) {
        document.getElementById("night-mode-toggle").checked = isNightMode;
    }

    // Init Calc Method
    if (document.getElementById("calc-method")) {
        document.getElementById("calc-method").value = calcMethod;
    }
    // Init Asr Method
    if (document.getElementById("asr-method")) {
        document.getElementById("asr-method").value = asrMethod;
    }
}

function saveSettings() {
    isNightMode = document.getElementById("night-mode-toggle").checked;
    setTheme(isNightMode);

    // Save Calc Method
    const newMethod = document.getElementById("calc-method").value;
    const newAsr = document.getElementById("asr-method").value;

    let needRefresh = false;
    if (newMethod !== calcMethod || newAsr !== asrMethod) {
        calcMethod = newMethod;
        asrMethod = newAsr;
        needRefresh = true;
    }

    localStorage.setItem("prayerTimesMethod", calcMethod);
    localStorage.setItem("asrMethod", asrMethod);

    if (needRefresh) {
        fetchPrayerTimes(true);
    }

    showToast(texts[lang].done, lang === 'ar' ? "تم حفظ الإعدادات" : "Settings saved");
}

// Update renderPrayerTimes to include Hijri Adjustment
function renderPrayerTimes(data) {
    const timings = data.timings;
    const date = data.date;
    let hijri = date.hijri;
    const gregorian = date.gregorian;

    // Apply Hijri Adjustment
    try {
        let adjustedDay = parseInt(hijri.day) + hijriAdjustment;
        hijri.day = adjustedDay.toString();
    } catch (e) { console.log("Date adj error", e); }

    // Update Date
    document.getElementById("hijri-date").innerText = `${hijri.day} ${hijri.month.ar} ${hijri.year}`;
    document.getElementById("gregorian-date").innerText = `${gregorian.weekday.en}, ${gregorian.day} ${gregorian.month.en} ${gregorian.year}`;

    // prayers to show
    // Added Sunrise and Icons
    const prayerConfig = [
        { key: "Fajr", ar: "الفجر", en: "Fajr", icon: "ph-cloud-sun" },
        { key: "Sunrise", ar: "الشروق", en: "Sunrise", icon: "ph-sun-horizon" },
        { key: "Dhuhr", ar: "الظهر", en: "Dhuhr", icon: "ph-sun" },
        { key: "Asr", ar: "العصر", en: "Asr", icon: "ph-sun-dim" },
        { key: "Maghrib", ar: "المغرب", en: "Maghrib", icon: "ph-cloud-moon" },
        { key: "Isha", ar: "العشاء", en: "Isha", icon: "ph-moon-stars" }
    ];

    const container = document.getElementById("prayer-times-list");
    container.innerHTML = "";

    const now = new Date();
    let nextPrayerFound = false;
    let nextPrayerName = "";
    let nextPrayerTimeDate = null;

    prayerConfig.forEach(p => {
        const timeStr = timings[p.key]; // "05:30"
        const div = document.createElement("div");
        div.className = "prayer-item";
        div.id = `prayer-${p.key}`;

        // Convert Prayer Time to Date Object for comparison
        const [hours, minutes] = timeStr.split(':').map(Number);
        const prayerDate = new Date();
        prayerDate.setHours(hours, minutes, 0, 0);

        let isActive = false;

        // Skip Sunrise for "Next Prayer" logic (usually we don't pray at sunrise)
        if (p.key !== "Sunrise" && !nextPrayerFound && prayerDate > now) {
            isActive = true;
            nextPrayerFound = true;
            nextPrayerName = lang === 'ar' ? p.ar : p.en;
            nextPrayerTimeDate = prayerDate;
            div.classList.add("active-prayer");
        }

        // Format time to 12h
        const time12 = new Date(`1/1/2000 ${timeStr}`).toLocaleTimeString(lang === 'ar' ? 'ar-SA' : 'en-US', { hour: 'numeric', minute: '2-digit' });

        div.innerHTML = `
            <div class="prayer-name" style="display:flex; align-items:center; gap:0.5rem;">
                <i class="ph ${p.icon}" style="font-size:1.2rem; color:var(--primary-color);"></i>
                ${isActive ? '<span class="next-badge">' + (lang === 'ar' ? 'القادمة' : 'Next') + '</span>' : ''}
                ${lang === 'ar' ? p.ar : p.en}
            </div>
            <div class="prayer-time">${time12}</div>
        `;
        container.appendChild(div);
    });

    // if all prayers passed (after Isha), next is Fajr tomorrow
    if (!nextPrayerFound) {
        nextPrayerName = lang === 'ar' ? "الفجر" : "Fajr";
        // Logic for tomorrow's Fajr would be complex without full data, 
        // we can just say "غداً" or fetch tomorrow's data. 
        // For simplicity, we just leave it or handle basic midnight case.
        document.getElementById("next-prayer-time-home").innerText = "--:--";
        if (nextPrayerTimeout) clearInterval(nextPrayerTimeout);
    }

    // Update Home Widget & Hero
    if (nextPrayerFound) {
        // Home Widget
        document.getElementById("next-prayer-name-home").innerText = nextPrayerName;
        document.getElementById("next-prayer-time-home").innerText = nextPrayerTimeDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        // Prayer View Hero
        const heroName = document.getElementById("next-prayer-name-hero");
        const heroTime = document.getElementById("next-prayer-time-hero");
        if (heroName) heroName.innerText = nextPrayerName;
        if (heroTime) heroTime.innerText = nextPrayerTimeDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        startPrayerCountdown(nextPrayerTimeDate);
        scheduleNotifications(timings);
    }
}

function startPrayerCountdown(targetDate) {
    if (nextPrayerTimeout) clearInterval(nextPrayerTimeout);

    function update() {
        const now = new Date();
        const diff = targetDate - now;

        if (diff <= 0) {
            clearInterval(nextPrayerTimeout);
            // Refresh to show next prayer
            fetchPrayerTimes();
            return;
        }

        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        const str = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        const homeEl = document.getElementById("prayer-countdown-home");
        if (homeEl) homeEl.innerText = `- ${str}`;

        // Hero Update
        const heroCount = document.getElementById("prayer-countdown-hero");
        if (heroCount) heroCount.innerText = str;
    }

    update(); // Run immediately
    nextPrayerTimeout = setInterval(update, 1000);
}

function scheduleNotifications(timings) {
    if (!("Notification" in window) || Notification.permission !== "granted") return;

    // Simple check loop every minute to see if a prayer time matches NOW
    // In a real PWA, you'd use Push Notifications or Background Sync, 
    // but a simple interval works while the app is open.

    // Clear existing interval if any
    if (window.prayerNotificationInterval) clearInterval(window.prayerNotificationInterval);

    window.prayerNotificationInterval = setInterval(() => {
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

        // Prayer names map (English keys from API)
        const prayerNamesConfig = {
            Fajr: { ar: "الفجر", en: "Fajr" },
            Dhuhr: { ar: "الظهر", en: "Dhuhr" },
            Asr: { ar: "العصر", en: "Asr" },
            Maghrib: { ar: "المغرب", en: "Maghrib" },
            Isha: { ar: "العشاء", en: "Isha" }
        };

        for (const [key, val] of Object.entries(prayerNamesConfig)) {
            // Remove (EST) or timezone info if present in timings (API usually returns HH:MM)
            const prayerTime = timings[key].split(' ')[0];

            if (currentTime === prayerTime && now.getSeconds() < 2) {
                const pName = lang === 'ar' ? val.ar : val.en;
                new Notification(lang === 'ar' ? "حان الآن موعد الصلاة" : "Prayer Time", {
                    body: lang === 'ar' ? `حان الآن موعد صلاة ${pName}` : `It is time for ${pName} prayer`,
                    icon: "icon-192.png"
                });
                playAudio(); // Create a dedicated adhan sound function ideally
            }
        }
    }, 1000);
}

document.addEventListener("DOMContentLoaded", () => {
    document.body.setAttribute("data-theme", theme);
    updateThemeIcon();
    applyLanguage();
    updateTasbeehDisplay();
    initCalcMethodSelect();
    initSettings();
    initReminders();
    setTimeout(() => document.getElementById('splash-screen')?.classList.add('splash-hidden'), 2000);
    showView('home');

    // Initial Fetch for Prayer Times (if configured/allowed previously)
    // Or wait for user to enter view. For good UX, let's fetch if we have data.
    if (localStorage.getItem("prayerTimesData")) {
        fetchPrayerTimes();
    }
    requestNotificationPermission();
});

// Qibla Compass Logic
let qiblaDirection = 0;
let compassSensor = null;

function initQiblaView() {
    showView('qibla');
    initQibla();
}

async function initQibla() {
    const statusEl = document.getElementById("qibla-status");
    const degDisplay = document.getElementById("qibla-deg");

    if (statusEl) statusEl.innerText = texts[lang].calibrating;

    try {
        const coords = await getUserLocation();

        qiblaDirection = calculateQibla(coords.lat, coords.lng);

        if (statusEl) statusEl.innerText = lang === 'ar' ? `القبلة: ${Math.round(qiblaDirection)}°` : `Qibla: ${Math.round(qiblaDirection)}°`;
        if (degDisplay) degDisplay.innerText = `${Math.round(qiblaDirection)}°`;

        // Start Compass after location is found
        startCompass();

    } catch (error) {
        console.error("Qibla Location Error:", error);
        let msg = lang === 'ar' ? "تعذر تحديد الموقع" : "Location unavailable";
        if (error.code === 1) msg = lang === 'ar' ? "يرجى تفعيل الموقع" : "Enable Location";

        if (statusEl) statusEl.innerText = msg;

        // Show manual retry button in the degree area if failed
        const compassContainer = document.querySelector(".compass-container");
        if (compassContainer) {
            // Provide visual feedback inside the compass or below it
            // For now, we rely on the generic retry button or toast
            showToast("Error", msg);
        }
    }
}

function calculateQibla(lat, lng) {
    const makkahLat = 21.4225;
    const makkahLng = 39.8262;

    const latRad = lat * (Math.PI / 180);
    const makkahLatRad = makkahLat * (Math.PI / 180);
    const lngDiffRad = (makkahLng - lng) * (Math.PI / 180);

    const y = Math.sin(lngDiffRad) * Math.cos(makkahLatRad);
    const x = Math.cos(latRad) * Math.sin(makkahLatRad) - Math.sin(latRad) * Math.cos(makkahLatRad) * Math.cos(lngDiffRad);

    let qibla = Math.atan2(y, x) * (180 / Math.PI);
    return (qibla + 360) % 360;
}

function startCompass() {
    // iOS 13+ support
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        // Show specific permission button for iOS
        const calibrationMsg = document.getElementById("calibration-msg");
        if (calibrationMsg) {
            calibrationMsg.style.display = "block";
            calibrationMsg.innerHTML = `
                <i class="ph ph-compass" style="font-size: 2rem; color: var(--primary-color);"></i>
                <p style="font-size: 0.9rem; margin-top: 0.5rem; margin-bottom: 1rem;">
                    ${lang === 'ar' ? 'السماح باستخدام البوصلة' : 'Enable Compass'}
                </p>
                <button id="ios-compass-btn" class="main-btn" style="padding:0.5rem 1rem; border-radius:var(--radius-full); background:var(--primary-color); color:white;">
                    ${lang === 'ar' ? 'تفعيل' : 'Enable'}
                </button>
            `;

            // Allow clicking the whole box or just the button
            const btn = document.getElementById("ios-compass-btn");
            if (btn) {
                btn.onclick = requestCompassPermission;
            }
            calibrationMsg.onclick = (e) => {
                // If they clicked the button, don't double trigger (though requestPermission is fine)
                if (e.target !== btn) requestCompassPermission();
            };
        }
    } else {
        // Non-iOS or older devices
        window.addEventListener('deviceorientationabsolute', handleOrientation, true);
        window.addEventListener('deviceorientation', handleOrientation, true);

        // Show calibration message briefly then hide
        const calibrationMsg = document.getElementById("calibration-msg");
        if (calibrationMsg) {
            calibrationMsg.style.display = "block";
            calibrationMsg.innerHTML = `
                <i class="ph ph-infinity" style="font-size: 2rem; color: var(--primary-color);"></i>
                <p style="font-size: 0.85rem; margin-top: 0.5rem;">${lang === 'ar' ? 'حرك الهاتف (8) للمعايرة' : 'Move phone in 8 figure'}</p>
            `;
            setTimeout(() => {
                calibrationMsg.style.display = "none";
            }, 5000);
        }
    }
}

function requestCompassPermission() {
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission()
            .then(response => {
                if (response === 'granted') {
                    document.getElementById("calibration-msg").style.display = "none";
                    window.addEventListener('deviceorientation', handleOrientation, true);
                } else {
                    alert(lang === 'ar' ? "تم رفض إذن البوصلة" : "Compass permission denied");
                }
            })
            .catch(console.error);
    }
}

function handleOrientation(event) {
    let alpha = event.alpha;
    if (event.webkitCompassHeading) alpha = event.webkitCompassHeading;
    else if (event.absolute && event.alpha !== null) alpha = 360 - event.alpha;

    if (alpha == null) return;

    const dial = document.getElementById("compass-dial");
    const pointer = document.getElementById("qibla-pointer");
    const degDisplay = document.getElementById("qibla-deg");

    // Smooth transition handles filtering roughly, but let's ensure we don't flip 360->0 poorly
    // For now, rely on CSS transition

    if (dial) dial.style.transform = `rotate(${-alpha}deg)`;
    if (pointer) pointer.style.transform = `translate(-50%, -100%) rotate(${qiblaDirection}deg)`;
    if (degDisplay) degDisplay.innerText = `${Math.round(qiblaDirection)}°`;
}
