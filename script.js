// ===== Luxury State Management =====
let lang = localStorage.getItem("lang") || "ar";
let theme = localStorage.getItem("theme") || (window.matchMedia('(prefers-color-scheme: dark)').matches ? "dark" : "light");
let favorites = JSON.parse(localStorage.getItem("fav")) || [];
let tasbeehCount = parseInt(localStorage.getItem("tasbeehCount")) || 0;
let dailyTasbeehTotal = parseInt(localStorage.getItem("dailyTasbeehTotal")) || 0;
let totalDhikrToday = parseInt(localStorage.getItem("totalDhikrToday")) || 0;
let streakCount = parseInt(localStorage.getItem("streakCount")) || 1;
let currentFontSize = parseInt(localStorage.getItem("fontSize")) || 24;

let currentCategory = "morning";
let currentIndex = 0;
let currentCounter = 0;
let repeatTarget = 1;

let currentTasbeehTheme = localStorage.getItem("tasbeehTheme") || "emerald";
let tasbeehTarget = parseInt(localStorage.getItem("tasbeehTarget")) || 33;
let tasbeehVibeEnabled = localStorage.getItem("tasbeehVibe") !== "false";
let tasbeehSoundEnabled = localStorage.getItem("tasbeehSound") !== "false";

// ===== Data Initialization =====
const adhkar = {};
if (typeof azkarData !== 'undefined') {
    azkarData.forEach(cat => { adhkar[cat.category] = cat.items; });
}

const translations = {
    ar: {
        greeting_morning: "صباح الخير، أهلاً بك",
        greeting_afternoon: "طاب يومك بذكر الله",
        greeting_evening: "مساء الخير والذكر",
        greeting_night: "ليلة مباركة هادئة",
        subtitle: "رحلتك الإيمانية اليومية",
        done: "تقبل الله طاعتك!",
        copied: "تم نسخ الذكر",
        reset_confirm: "هل تريد تصفير العداد؟",
        allah_names: "أسماء الله الحسنى"
    },
    en: {
        greeting_morning: "Good Morning, Welcome",
        greeting_afternoon: "Good Afternoon",
        greeting_evening: "Good Evening",
        greeting_night: "Good Night",
        subtitle: "Your Daily Spiritual Journey",
        done: "May Allah accept your dhikr!",
        copied: "Dhikr copied",
        reset_confirm: "Reset counter?",
        allah_names: "Allah's Names"
    }
};



const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playClickSound() {
    if (!tasbeehSoundEnabled) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
}

function setTasbeehTarget(target, el) {
    tasbeehTarget = target;
    localStorage.setItem("tasbeehTarget", target);

    document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    if (el) el.classList.add('active');

    updateTasbeehDisplay();
    hapticFeedback(30);
}

function toggleTSSound() {
    tasbeehSoundEnabled = !tasbeehSoundEnabled;
    localStorage.setItem("tasbeehSound", tasbeehSoundEnabled);
    const btn = document.getElementById('ts-sound-btn');
    btn.classList.toggle('active', tasbeehSoundEnabled);
    hapticFeedback(20);
}

function toggleTSVibe() {
    tasbeehVibeEnabled = !tasbeehVibeEnabled;
    localStorage.setItem("tasbeehVibe", tasbeehVibeEnabled);
    const btn = document.getElementById('ts-vibe-btn');
    btn.classList.toggle('active', tasbeehVibeEnabled);
    hapticFeedback(20);
}

function setTasbeehTheme(themeName, el) {
    document.body.classList.forEach(cls => {
        if (cls.startsWith('theme-')) document.body.classList.remove(cls);
    });
    if (themeName !== 'emerald') document.body.classList.add(`theme-${themeName}`);
    document.querySelectorAll('.theme-dot').forEach(dot => dot.classList.remove('active'));
    if (el) el.classList.add('active');
    currentTasbeehTheme = themeName;
    localStorage.setItem("tasbeehTheme", themeName);
    updateTasbeehDisplay();
    hapticFeedback(20);
}

function setProgress(percent) {
    const circle = document.querySelector('.progress-ring__circle');
    if (!circle) return;
    const radius = circle.r.baseVal.value;
    const circumference = radius * 2 * Math.PI;

    circle.style.strokeDasharray = `${circumference} ${circumference}`;
    const offset = circumference - (percent / 100 * circumference);
    circle.style.strokeDashoffset = offset;
}

// ===== Professional Tasbeeh Logic =====
function createBeads() {
    const container = document.getElementById('beads-circle');
    if (!container) return;
    container.innerHTML = "";
    const totalBeads = 33;
    const radius = 135; // px

    for (let i = 0; i < totalBeads; i++) {
        const bead = document.createElement('div');
        bead.className = `bead ${i % 11 === 0 ? 'large' : ''}`;
        const angle = (i / totalBeads) * 360;
        const x = Math.cos(angle * Math.PI / 180) * radius;
        const y = Math.sin(angle * Math.PI / 180) * radius;

        bead.style.transform = `translate(${x}px, ${y}px)`;
        container.appendChild(bead);
    }
}

function updateTasbeehDisplay() {
    const el = document.getElementById('tasbeeh-counter');
    if (el) el.innerText = tasbeehCount;

    const dailyEl = document.getElementById('tasbeeh-daily-total');
    if (dailyEl) dailyEl.innerText = `${lang === 'ar' ? 'إجمالي اليوم' : 'Daily Total'}: ${dailyTasbeehTotal}`;

    // Update Ring
    if (tasbeehTarget > 0) {
        const progress = (tasbeehCount % tasbeehTarget / tasbeehTarget) * 100;
        setProgress(progress || (tasbeehCount > 0 ? 100 : 0));
    } else {
        setProgress(0);
    }

    // Update Beads Rotation
    const beadsCircle = document.getElementById('beads-circle');
    if (beadsCircle) {
        const rotation = (tasbeehCount % 33) * (360 / 33);
        beadsCircle.style.transform = `rotate(${-rotation}deg)`;
    }

    // Auto label logic
    const label = document.getElementById('current-tasbeeh-label');
    const display = document.querySelector('.tasbeeh-display');
    if (!label) return;

    let newLabel = "";
    if (tasbeehCount < 33) newLabel = lang === 'ar' ? "سبحان الله" : "Subhan Allah";
    else if (tasbeehCount < 66) newLabel = lang === 'ar' ? "الحمد لله" : "Alhamdulillah";
    else if (tasbeehCount < 99) newLabel = lang === 'ar' ? "الله أكبر" : "Allahu Akbar";
    else newLabel = lang === 'ar' ? "لا إله إلا الله" : "La ilaha illa Allah";

    if (label.innerText !== newLabel) {
        label.innerText = newLabel;
        if (display) {
            display.classList.remove('active');
            void display.offsetWidth;
            display.classList.add('active');
        }
    }
}

function incrementTasbeeh() {
    tasbeehCount++;
    dailyTasbeehTotal++;
    totalDhikrToday++;
    localStorage.setItem("tasbeehCount", tasbeehCount);
    localStorage.setItem("dailyTasbeehTotal", dailyTasbeehTotal);
    localStorage.setItem("totalDhikrToday", totalDhikrToday);

    updateTasbeehDisplay();
    updateDashboard();
    playClickSound();
    createParticles();

    if (tasbeehVibeEnabled) {
        if (tasbeehTarget > 0 && tasbeehCount % tasbeehTarget === 0) {
            hapticFeedback([60, 100, 60]);
            showToast(lang === 'ar' ? "تم تحقيق الهدف!" : "Target reached!");
        } else {
            hapticFeedback(30);
        }
    }
}

function createParticles() {
    const btn = document.getElementById('tasbeeh-btn');
    if (!btn) return;

    for (let i = 0; i < 6; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        const angle = Math.random() * Math.PI * 2;
        const dist = 50 + Math.random() * 50;
        const tx = Math.cos(angle) * dist;
        const ty = Math.sin(angle) * dist;

        p.style.setProperty('--tx', `${tx}px`);
        p.style.setProperty('--ty', `${ty}px`);
        p.style.left = '50%';
        p.style.top = '50%';
        p.style.background = `var(--primary)`;
        p.style.animation = `particleFade 0.6s ease-out forwards`;

        btn.appendChild(p);
        setTimeout(() => p.remove(), 600);
    }
}

function resetTasbeeh() {
    if (confirm(translations[lang].reset_confirm)) {
        tasbeehCount = 0;
        localStorage.setItem("tasbeehCount", tasbeehCount);
        updateTasbeehDisplay();
        hapticFeedback(50);
    }
}

// ===== Notification & Reminder Logic =====

function toggleReminderPermission() {
    const checkbox = document.getElementById('reminder-checkbox');
    const freqDiv = document.getElementById('reminder-frequency');

    if (checkbox.checked) {
        if (!("Notification" in window)) {
            showToast(lang === 'ar' ? "متصفحك لا يدعم التنبيهات" : "Browser doesn't support notifications");
            checkbox.checked = false;
            return;
        }

        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                showToast(lang === 'ar' ? "تم تفعيل التنبيهات بنجاح" : "Notifications enabled");
                freqDiv.classList.remove('hidden');
                localStorage.setItem("remindersEnabled", "true");
                scheduleReminders();
            } else {
                showToast(lang === 'ar' ? "يرجى السماح بالتنبهات من إعدادات المتصفح" : "Please allow notifications in settings");
                checkbox.checked = false;
            }
        });
    } else {
        freqDiv.classList.add('hidden');
        localStorage.setItem("remindersEnabled", "false");
    }
}

function updateReminderInterval() {
    const interval = document.getElementById('reminder-interval').value;
    localStorage.setItem("reminderInterval", interval);
    showToast(lang === 'ar' ? "تم تحديث وقت التنبيه" : "Interval updated");
    scheduleReminders();
}

function scheduleReminders() {
    // In a real PWA, this would involve a Service Worker.
    // For now, we'll use a local interval if the app is open.
    const interval = localStorage.getItem("reminderInterval") || "30";
    if (localStorage.getItem("remindersEnabled") === "true") {
        console.log(`Schedulig reminders every ${interval} mins`);
    }
}

// ===== Core Functions =====

function init() {
    applyTheme();
    applyLanguage();
    updateGreeting();
    updateDate();
    createBeads();
    updateDashboard();

    // Restore Tasbeeh Theme
    if (currentTasbeehTheme !== 'emerald') {
        const activeDot = document.querySelector(`.theme-dot[onclick*="${currentTasbeehTheme}"]`);
        if (activeDot) setTasbeehTheme(currentTasbeehTheme, activeDot);
    }

    updateTasbeehDisplay();

    // Restore UI for Sound/Vibe
    document.getElementById('ts-sound-btn')?.classList.toggle('active', tasbeehSoundEnabled);
    document.getElementById('ts-vibe-btn')?.classList.toggle('active', tasbeehVibeEnabled);

    // Initial Font Size
    const dhikrEl = document.getElementById('dhikrText');
    if (dhikrEl) dhikrEl.style.fontSize = `${currentFontSize}px`;

    // Global Search Focus Logic
    const searchInput = document.getElementById('global-search');
    if (searchInput) {
        searchInput.addEventListener('focus', () => {
            document.getElementById('home-default-content').classList.add('hidden');
            document.getElementById('search-results-view').classList.remove('hidden');
            document.getElementById('clear-search').classList.remove('hidden');
        });
    }

    // Smooth Splash Exit
    setTimeout(() => {
        const splash = document.getElementById('splash-screen');
        if (splash) splash.classList.add('hidden');
    }, 1800);
}

function applyTheme() {
    document.body.setAttribute("data-theme", theme);
    const icon = document.querySelector("#theme-toggle i");
    if (icon) icon.className = theme === "light" ? "ph-fill ph-moon-stars" : "ph-fill ph-sun";
}

function toggleTheme() {
    theme = theme === "light" ? "dark" : "light";
    localStorage.setItem("theme", theme);
    applyTheme();
    hapticFeedback(30);
}

function applyLanguage() {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
}

function toggleLanguage() {
    lang = lang === "ar" ? "en" : "ar";
    localStorage.setItem("lang", lang);
    applyLanguage();
    updateGreeting();
    updateDate();
    updateDashboard();
    updateTasbeehDisplay();
    if (!document.getElementById('view-adhkar').classList.contains('hidden')) {
        renderDhikr();
    }
}

// ===== Names of Allah Logic =====
function renderAllahNames() {
    const grid = document.getElementById('names-grid');
    if (!grid) return;
    grid.innerHTML = "";

    const names = adhkar['allah_names'];
    if (!names) return;

    names.forEach(item => {
        const div = document.createElement('div');
        div.className = 'name-item fade-in';
        div.innerHTML = `
            <span class="name-arabic">${item.ar}</span>
        `;
        div.onclick = () => showToast(`${item.ar}`);
        grid.appendChild(div);
    });
}

// ===== Common Functions =====

function showView(viewId) {
    const views = ['home', 'adhkar', 'tasbeeh', 'settings', 'favorites', 'allah-names'];
    views.forEach(v => {
        const el = document.getElementById(`view-${v}`);
        if (el) el.classList.add('hidden');
    });

    const target = document.getElementById(`view-${viewId}`);
    if (target) {
        target.classList.remove('hidden');
        target.classList.add('fade-in');
    }

    // Nav active states
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`nav-${viewId}`)?.classList.add('active');

    // Floating button visibility
    const floatingBtn = document.getElementById('floating-tasbeeh');
    if (floatingBtn) {
        floatingBtn.style.display = (viewId === 'tasbeeh') ? 'none' : 'flex';
    }

    if (viewId === 'allah-names') renderAllahNames();
    if (viewId === 'favorites') renderFavorites();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===== Home Screen Logic =====

function updateGreeting() {
    const hour = new Date().getHours();
    let key = "greeting_morning";
    if (hour >= 12 && hour < 17) key = "greeting_afternoon";
    if (hour >= 17 && hour < 21) key = "greeting_evening";
    if (hour >= 21 || hour < 5) key = "greeting_night";

    const el = document.getElementById('greeting-text');
    if (el) el.innerText = translations[lang][key];
}

function updateDate() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateStr = new Date().toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', options);
    const el = document.getElementById('current-date');
    if (el) el.innerText = dateStr;
}

// ===== Adhkar Logic =====
let currentCategoryTitle = "";

function openAdhkar(category) {
    if (!adhkar[category]) return;
    currentCategory = category;
    const catObj = azkarData.find(c => c.category === category);
    currentCategoryTitle = catObj ? catObj.title : "";

    currentIndex = 0;
    currentCounter = 0;
    repeatTarget = adhkar[currentCategory][currentIndex].count || 1;
    showView('adhkar');
    renderDhikr();
}

function renderDhikr() {
    const items = adhkar[currentCategory];
    const item = items[currentIndex];
    const t = translations[lang];

    document.getElementById('adhkarTitle').innerText = currentCategoryTitle || (lang === 'ar' ? "الأذكار" : "Adhkar");
    document.getElementById('dhikrText').innerText = (lang === 'en' && item.en) ? item.en : item.ar;

    const progressBtn = document.getElementById('dhikr-progress-btn');
    progressBtn.innerText = currentCounter;

    // Progress Bar
    const progress = ((currentIndex + 1) / items.length) * 100;
    document.getElementById('dhikr-progress-bar').style.width = `${progress}%`;

    // Fav state
    const isFav = favorites.includes(item.ar);
    const favBtn = document.getElementById('fav-btn');
    favBtn.innerHTML = isFav ? '<i class="ph-fill ph-heart" style="color:#ef4444"></i>' : '<i class="ph ph-heart"></i>';

    // Index & Repeat Info
    document.getElementById('dhikr-index-info').innerText = `${currentIndex + 1} / ${items.length}`;
    document.getElementById('dhikr-repeat-info').innerText = lang === 'ar' ? `التكرار: ${repeatTarget}` : `Repeat: ${repeatTarget}`;
}

function incrementDhikr() {
    if (currentCounter < repeatTarget) {
        currentCounter++;
        totalDhikrToday++;
        localStorage.setItem("totalDhikrToday", totalDhikrToday);
        updateDashboard();

        hapticFeedback(50);

        if (currentCounter >= repeatTarget) {
            hapticFeedback([50, 100, 50]);
            setTimeout(nextDhikr, 400);
        }
    }
    renderDhikr();
}

function nextDhikr() {
    const items = adhkar[currentCategory];
    if (currentIndex < items.length - 1) {
        currentIndex++;
        currentCounter = 0;
        repeatTarget = items[currentIndex].count || 1;
        renderDhikr();
    } else {
        showToast(translations[lang].done);
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

// ===== Utilities =====

function hapticFeedback(pattern) {
    if (navigator.vibrate) navigator.vibrate(pattern);
}

function showToast(message) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span class="toast-message">${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-20px)';
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

function copyDhikr() {
    const text = document.getElementById('dhikrText').innerText;
    navigator.clipboard.writeText(text).then(() => {
        showToast(translations[lang].copied);
    });
}

function shareDhikr() {
    const text = document.getElementById('dhikrText').innerText;
    if (navigator.share) {
        navigator.share({
            title: 'أنصاري',
            text: text,
            url: window.location.href
        }).catch(console.error);
    } else {
        copyDhikr();
    }
}

function playAudio() {
    const item = adhkar[currentCategory][currentIndex];
    if (item.audio) {
        const audio = new Audio(item.audio);
        audio.play();
    } else {
        showToast(lang === 'ar' ? "الصوت غير متوفر حالياً" : "Audio not available yet");
    }
}

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

function resetAllData() {
    if (confirm("مسح كافة البيانات والإعدادات؟")) {
        localStorage.clear();
        location.reload();
    }
}

// ===== New Professional Features Logic =====

function handleSearch() {
    const query = document.getElementById('global-search').value.toLowerCase().trim();
    const resultsContainer = document.getElementById('search-results-list');
    if (!resultsContainer) return;

    if (query.length < 2) {
        resultsContainer.innerHTML = '<p style="text-align:center; color:var(--text-muted); padding:2rem;">ادخل حرفين على الأقل للبحث...</p>';
        return;
    }

    resultsContainer.innerHTML = "";
    let found = [];

    azkarData.forEach(cat => {
        cat.items.forEach(item => {
            if (item.ar.toLowerCase().includes(query)) {
                found.push({ ...item, category: cat.category, catTitle: cat.title });
            }
        });
    });

    if (found.length === 0) {
        resultsContainer.innerHTML = '<p style="text-align:center; color:var(--text-muted); padding:2rem;">لم يتم العثور على نتائج</p>';
        return;
    }

    found.forEach(item => {
        const div = document.createElement('div');
        div.className = 'search-item';
        div.innerHTML = `
            <i class="ph ph-list-stars"></i>
            <div class="item-info">
                <h4>${item.catTitle}</h4>
                <p>${item.ar.substring(0, 60)}...</p>
            </div>
        `;
        div.onclick = () => {
            openAdhkar(item.category);
            // Find index of this item
            currentIndex = adhkar[item.category].findIndex(i => i.id === item.id);
            renderDhikr();
            clearSearch();
        };
        resultsContainer.appendChild(div);
    });
}

function clearSearch() {
    document.getElementById('global-search').value = "";
    document.getElementById('home-default-content').classList.remove('hidden');
    document.getElementById('search-results-view').classList.add('hidden');
    document.getElementById('clear-search').classList.add('hidden');
}

function renderFavorites() {
    const list = document.getElementById('favorites-list');
    if (!list) return;
    list.innerHTML = "";

    if (favorites.length === 0) {
        list.innerHTML = `
            <div class="empty-state" style="text-align: center; padding: 4rem 1.5rem;">
                <i class="ph ph-heart-break" style="font-size: 3.5rem; color: var(--text-muted); opacity: 0.3;"></i>
                <p style="margin-top: 1.5rem; color: var(--text-muted); font-weight: 600;">لا توجد أذكار مفضلة حالياً</p>
            </div>
        `;
        return;
    }

    favorites.forEach(favAr => {
        // Find categories for this fav
        let catInfo = { category: 'morning', title: 'اذكار' };
        azkarData.forEach(c => {
            if (c.items.some(i => i.ar === favAr)) {
                catInfo = { category: c.category, title: c.title };
            }
        });

        const div = document.createElement('div');
        div.className = 'fav-item';
        div.innerHTML = `
            <i class="ph-fill ph-heart"></i>
            <div class="item-info">
                <h4>${catInfo.title}</h4>
                <p>${favAr.substring(0, 80)}...</p>
            </div>
        `;
        div.onclick = () => {
            openAdhkar(catInfo.category);
            currentIndex = adhkar[catInfo.category].findIndex(i => i.ar === favAr);
            renderDhikr();
        };
        list.appendChild(div);
    });
}

function increaseFont() {
    if (currentFontSize < 40) {
        currentFontSize += 2;
        updateFontSize();
    }
}

function decreaseFont() {
    if (currentFontSize > 16) {
        currentFontSize -= 2;
        updateFontSize();
    }
}

function updateFontSize() {
    document.getElementById('dhikrText').style.fontSize = `${currentFontSize}px`;
    localStorage.setItem("fontSize", currentFontSize);
}

function updateDashboard() {
    const totalEl = document.getElementById('total-dhikr-today');
    const streakEl = document.getElementById('streak-count');

    const lastDate = localStorage.getItem("lastDate") || "";
    const today = new Date().toLocaleDateString();

    if (lastDate !== today) {
        totalDhikrToday = 0;
        localStorage.setItem("totalDhikrToday", 0);
        localStorage.setItem("lastDate", today);

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        if (lastDate !== yesterday.toLocaleDateString() && lastDate !== "") {
            streakCount = 1;
            localStorage.setItem("streakCount", 1);
        }
    }

    if (totalEl) totalEl.innerText = totalDhikrToday;
    if (streakEl) streakEl.innerText = streakCount;
}

// Initial Run
document.addEventListener('DOMContentLoaded', init);
