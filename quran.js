const QURAN_API = 'https://api.alquran.cloud/v1';
const TOTAL_PAGES = 604;

let surahs = [];
let currentPage = 1;
let isLoadingPage = false;
let loadedPages = new Set();
let selectedAyah = null;

async function initQuran() {
    try {
        const response = await fetch(`${QURAN_API}/surah`);
        const data = await response.json();
        surahs = data.data;
        renderSurahs(surahs);

        // Load saved page if exists
        const savedPage = localStorage.getItem('lastQuranPage');
        if (savedPage) {
            currentPage = parseInt(savedPage);
            document.getElementById('page-slider').value = currentPage;
        }

        // Close context menu on click outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.ayah-text') && !e.target.closest('.context-menu')) {
                closeAyahMenu();
            }
        });

    } catch (error) {
        console.error('Error initializing Quran:', error);
    }
}

function renderSurahs(surahArray) {
    const list = document.getElementById('surah-list');
    if (!list) return;

    const arrayToRender = surahArray || surahs;
    if (!arrayToRender || arrayToRender.length === 0) return;

    let html = arrayToRender.map(s => `
        <div class="surah-card" onclick="openQuranReader(${s.number})">
            <span class="surah-num">${s.number}</span>
            <div style="text-align: center;">
                <h3 class="surah-name">${s.name}</h3>
                <span style="font-size: 0.8rem; opacity: 0.7;">${s.englishName}</span>
            </div>
            <span class="surah-num">${s.numberOfAyahs}</span>
        </div>
    `).join('');

    // Add Dua Khatm at the end if not filtering
    if (surahArray.length === surahs.length) {
        html += `
            <div class="surah-card" style="background: var(--primary-light); grid-column: 1 / -1;" onclick="showKhatmDua()">
                <i class="ph ph-hands-praying" style="font-size: 1.5rem; color: var(--primary-color);"></i>
                <h3 class="surah-name">دعاء ختم القرآن</h3>
            </div>
        `;
    }

    list.innerHTML = html;
}

function filterSurahs() {
    const query = document.getElementById('surah-search').value.toLowerCase();
    const filtered = surahs.filter(s =>
        s.name.includes(query) ||
        s.englishName.toLowerCase().includes(query) ||
        s.number.toString() === query
    );
    renderSurahs(filtered);
}

async function openQuranReader(surahNumber = null, pageNumber = null) {
    showView('quran-reader', false);

    if (surahNumber) {
        // Find first page of this surah
        const response = await fetch(`${QURAN_API}/surah/${surahNumber}`);
        const data = await response.json();
        pageNumber = data.data.ayahs[0].page;
    }

    if (pageNumber) {
        currentPage = pageNumber;
    }

    const container = document.getElementById('quran-pages-container');
    container.innerHTML = ''; // Clear for fresh start or jump
    loadedPages.clear();

    loadPage(currentPage);
    updateReaderUI();
}

async function loadPage(page) {
    if (page < 1 || page > TOTAL_PAGES || loadedPages.has(page) || isLoadingPage) return;

    isLoadingPage = true;
    try {
        const response = await fetch(`${QURAN_API}/page/${page}/quran-uthmani`);
        const data = await response.json();

        const pageEl = document.createElement('div');
        pageEl.className = 'quran-page fade-in';
        pageEl.id = `page-${page}`;
        pageEl.dataset.page = page;

        let pageHtml = '';
        let lastSurah = null;

        data.data.ayahs.forEach(ayah => {
            if (ayah.surah.number !== lastSurah && ayah.numberInSurah === 1) {
                pageHtml += `<div class="surah-header-divider">${ayah.surah.name}</div>`;
            }
            lastSurah = ayah.surah.number;

            let text = ayah.text;
            if (ayah.numberInSurah === 1 && ayah.surah.number !== 1 && ayah.surah.number !== 9) {
                const bismillah = "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ";
                if (text.startsWith(bismillah)) {
                    text = text.replace(bismillah, "").trim();
                }
            }

            pageHtml += `<span class="ayah-text" 
                               data-ayah-key="${ayah.surah.number}:${ayah.numberInSurah}" 
                               onclick="handleAyahClick(event, this)">
                               ${text} ﴿${ayah.numberInSurah}﴾
                         </span> `;
        });

        pageEl.innerHTML = `<div class="page-text">${pageHtml}</div><div class="page-num-footer">${page}</div>`;

        const container = document.getElementById('quran-pages-container');
        container.appendChild(pageEl);

        loadedPages.add(page);
        updateCurrentPageInfo();

    } catch (error) {
        console.error(`Error loading page ${page}:`, error);
    } finally {
        isLoadingPage = false;
    }
}

function handleAyahClick(event, element) {
    event.stopPropagation();

    // Highlight ayah
    document.querySelectorAll('.ayah-text').forEach(el => el.classList.remove('active-ayah'));
    element.classList.add('active-ayah');

    selectedAyah = {
        key: element.dataset.ayahKey,
        text: element.innerText,
        element: element
    };

    showAyahMenu(event.clientX, event.clientY);
}

function showAyahMenu(x, y) {
    const menu = document.getElementById('ayah-menu');
    menu.classList.remove('hidden');

    // Positions
    const menuWidth = 150;
    const menuHeight = 180;

    let left = x;
    let top = y;

    if (x + menuWidth > window.innerWidth) left = x - menuWidth;
    if (y + menuHeight > window.innerHeight) top = y - menuHeight;

    menu.style.left = `${left}px`;
    menu.style.top = `${top}px`;
}

function closeAyahMenu() {
    const menu = document.getElementById('ayah-menu');
    if (menu) menu.classList.add('hidden');
}

async function showTafsir() {
    if (!selectedAyah) return;

    closeAyahMenu();
    const modal = document.getElementById('tafsir-modal');
    const textEl = document.getElementById('tafsir-text');
    const titleEl = document.getElementById('tafsir-ayah-title');

    modal.classList.remove('hidden');
    modal.classList.add('show');
    textEl.innerText = "جاري تحميل التفسير...";
    titleEl.innerText = `تفسير الآية (${selectedAyah.key})`;

    try {
        const response = await fetch(`https://api.alquran.cloud/v1/ayah/${selectedAyah.key}/ar.jalalayn`);
        const data = await response.json();
        textEl.innerText = data.data.text;
    } catch (error) {
        textEl.innerText = "حدث خطأ أثناء تحميل التفسير.";
    }
}

function closeTafsir() {
    const modal = document.getElementById('tafsir-modal');
    modal.classList.add('hidden');
    modal.classList.remove('show');
}

async function playAyahAudio() {
    if (!selectedAyah) return;
    closeAyahMenu();

    const audio = document.getElementById('quran-audio');
    // Using Alafasy for recitation
    audio.src = `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${selectedAyah.key.split(':').join('/')}.mp3`;
    audio.play();
}

function copyAyah() {
    if (!selectedAyah) return;
    navigator.clipboard.writeText(selectedAyah.text);
    closeAyahMenu();
    alert("تم نسخ الآية");
}

function shareAyah() {
    if (!selectedAyah) return;
    const shareText = `${selectedAyah.text}\n\n[تطبيق أنصاري]`;
    if (navigator.share) {
        navigator.share({
            text: shareText
        });
    } else {
        copyAyah();
    }
}

function updateCurrentPageInfo() {
    const container = document.getElementById('quran-pages-container');
    const pages = container.querySelectorAll('.quran-page');
    let topPage = currentPage;

    pages.forEach(p => {
        const rect = p.getBoundingClientRect();
        if (rect.top >= 0 && rect.top < window.innerHeight / 2) {
            topPage = parseInt(p.dataset.page);
        }
    });

    currentPage = topPage;
    document.getElementById('current-page-info').textContent = `صفحة ${currentPage}`;
    document.getElementById('page-slider').value = currentPage;
}

function onPageSliderChange(val) {
    const page = parseInt(val);
    if (page !== currentPage) {
        openQuranReader(null, page);
    }
}

function saveQuranMark() {
    localStorage.setItem('lastQuranPage', currentPage);
    alert('تم حفظ مكان القراءة بنجاح');
}

document.getElementById('quran-pages-container').addEventListener('scroll', throttle(() => {
    const container = document.getElementById('quran-pages-container');
    if (container.scrollHeight - container.scrollTop - container.clientHeight < 500) {
        loadPage(currentPage + loadedPages.size); // Basic next page logic
    }
    updateCurrentPageInfo();
}, 200));

function showKhatmDua() {
    const modal = document.getElementById('tafsir-modal');
    const textEl = document.getElementById('tafsir-text');
    const titleEl = document.getElementById('tafsir-ayah-title');
    const sourceEl = document.getElementById('tafsir-source');

    modal.classList.remove('hidden');
    modal.classList.add('show');
    titleEl.innerText = "دعاء ختم القرآن الكريم";
    sourceEl.innerText = "";

    textEl.innerHTML = `
        <div style="text-align: center; line-height: 2.5; font-size: 1.3rem;">
            أللَّهُمَّ ارْحَمْنِي بالقُرْآنِ وَاجْعَلْهُ لِي إِمَاماً وَنُوراً وَهُدًى وَرَحْمَةً *<br>
            أللَّهُمَّ ذَكِّرْنِي مِنْهُ مَا نَسِيتُ وَعَلِّمْنِي مِنْهُ مَا جَهِلْتُ وَارْزُقْنِي تِلاَوَتَهُ آنَاءَ اللَّيْلِ وَأَطْرَافَ النَّهَارِ وَاجْعَلْهُ لِي حُجَّةً يَا رَبَّ العَالَمِينَ *<br>
            أللَّهُمَّ أَصْلِحْ لِي دِينِي الَّذِي هُوَ عِصْمَةُ أَمْرِي، وَأَصْلِحْ لِي دُنْيَايَ الَّتِي فِيهَا مَعَاشِي، وَأَصْلِحْ لِي آخِرَتِي الَّتِي فِيهَا مَعَادِي، وَاجْعَلِ الحَيَاةَ زِيَادَةً لِي فِي كُلِّ خَيْرٍ وَاجْعَلِ المَوْتَ رَاحَةً لِي مِنْ كُلِّ شَرٍّ *<br>
            أللَّهُمَّ اجْعَلْ خَيْرَ عُمْرِي آخِرَهُ وَخَيْرَ عَمَلِي خَوَاتِمَهُ وَخَيْرَ أَيَّامِي يَوْمَ أَلْقَاكَ فِيهِ *
        </div>
    `;
}

function updateReaderUI() {
    document.getElementById('current-page-info').textContent = `صفحة ${currentPage}`;
    document.getElementById('page-slider').value = currentPage;
}

function throttle(func, limit) {
    let inThrottle;
    return function () {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}
