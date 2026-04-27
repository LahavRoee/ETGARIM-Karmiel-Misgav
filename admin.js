// ============================================================
// Etgarim Admin Dashboard
// ============================================================

let authToken = localStorage.getItem('etgarim_token') || '';

// localStorage helpers for offline/GitHub Pages mode
const LS = {
    get: (key, fallback) => {
        try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
    },
    set: (key, data) => {
        try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
    }
};

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    initLogin();
    initTabs();
    initLogout();
});

// ── Auth ────────────────────────────────────────────────────
async function checkAuth() {
    if (!authToken) return showLogin();
    try {
        const res = await apiFetch('/api/auth/check');
        if (res.authenticated) {
            showDashboard();
        } else {
            showLogin();
        }
    } catch { showLogin(); }
}

function showLogin() {
    document.getElementById('login-screen').classList.remove('hidden');
    document.getElementById('admin-dashboard').classList.add('hidden');
}

function showDashboard() {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('admin-dashboard').classList.remove('hidden');
    loadAllData();
}

// SHA-256 hash using browser SubtleCrypto (for static/GitHub Pages fallback)
async function sha256(str) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

const LOCAL_PW_HASH = '180e7e16333f7904f7dc60367929e9e94cbab98a3fee260fd022d4c29c7aed80';

function initLogin() {
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const pw = document.getElementById('login-password').value;
        const errEl = document.getElementById('login-error');
        errEl.classList.add('hidden');

        // Try server first, fall back to local hash (GitHub Pages / static hosting)
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: pw }),
                signal: AbortSignal.timeout(3000)
            });
            const data = await res.json();
            if (data.ok) {
                authToken = data.token;
                localStorage.setItem('etgarim_token', authToken);
                showDashboard();
                return;
            }
        } catch { /* server not available — use local hash */ }

        // Local fallback
        const hash = await sha256(pw);
        if (hash === LOCAL_PW_HASH) {
            authToken = 'local-' + Date.now();
            localStorage.setItem('etgarim_token', authToken);
            showDashboard();
        } else {
            errEl.classList.remove('hidden');
        }
    });
}

function initLogout() {
    document.getElementById('logout-btn').addEventListener('click', () => {
        authToken = '';
        localStorage.removeItem('etgarim_token');
        showLogin();
    });
}

async function apiFetch(url, opts = {}) {
    const res = await fetch(url, {
        ...opts,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
            ...(opts.headers || {})
        }
    });
    return res.json();
}

// ── Tabs ────────────────────────────────────────────────────
function initTabs() {
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
            document.getElementById(`tab-${tab.dataset.tab}`).classList.remove('hidden');
        });
    });

    // Trainee filters
    document.querySelectorAll('.trainee-filter').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.trainee-filter').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderTrainees(btn.dataset.group);
        });
    });

    // Add buttons
    document.getElementById('add-trainee-btn')?.addEventListener('click', () => showTraineeForm());
    document.getElementById('add-volunteer-btn')?.addEventListener('click', () => showVolunteerForm());
    document.getElementById('add-story-btn')?.addEventListener('click', () => showStoryForm());

    // Modal close
    document.getElementById('modal-overlay')?.addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeModal();
    });
}

// ── Data Loading ────────────────────────────────────────────
let allTrainees = [];
let allVolunteers = [];
let allSignups = [];
let allStories = [];

async function loadAllData() {
    try {
        allTrainees = typeof TRAINEES !== 'undefined' ? [...TRAINEES] : [];

        const [serverData, volunteers, signups, stories] = await Promise.all([
            apiFetch('/api/trainees').catch(() => null),
            apiFetch('/api/volunteers').catch(() => null),
            apiFetch('/api/signups').catch(() => null),
            apiFetch('/api/admin/stories').catch(() => null),
        ]);

        // Merge server overlay, fall back to localStorage
        const overlay = (serverData && typeof serverData === 'object' && !serverData.error)
            ? serverData
            : LS.get('etgarim_trainees_overlay', {});
        allTrainees.forEach(t => { if (overlay[t.name]) Object.assign(t, overlay[t.name]); });

        allVolunteers = Array.isArray(volunteers) ? volunteers : LS.get('etgarim_volunteers', []);
        allSignups = Array.isArray(signups) ? signups : LS.get('etgarim_signups', []);
        allStories = Array.isArray(stories) ? stories : LS.get('etgarim_stories', []);

        updateDashboard();
        renderTrainees('all');
        renderVolunteers();
        renderStories();
        renderSignups();
    } catch (e) {
        console.error('Load error:', e);
    }
}

async function saveTrainee(name, fields) {
    await apiFetch('/api/trainee', { method: 'POST', body: JSON.stringify({ name, fields }) }).catch(() => null);
    const overlay = LS.get('etgarim_trainees_overlay', {});
    overlay[name] = { ...(overlay[name] || {}), ...fields };
    LS.set('etgarim_trainees_overlay', overlay);
}

async function saveVolunteer(data) {
    await apiFetch('/api/volunteer', { method: 'POST', body: JSON.stringify(data) }).catch(() => null);
    const vols = LS.get('etgarim_volunteers', []);
    if (data.id) {
        const idx = vols.findIndex(v => v.id === data.id);
        if (idx >= 0) vols[idx] = { ...vols[idx], ...data };
        else vols.push(data);
    } else {
        data.id = Math.random().toString(36).slice(2, 10);
        data.created = new Date().toISOString();
        vols.push(data);
    }
    LS.set('etgarim_volunteers', vols);
}

async function saveStory(data) {
    await apiFetch('/api/story', { method: 'POST', body: JSON.stringify(data) }).catch(() => null);
    const stories = LS.get('etgarim_stories', []);
    if (data.id) {
        const idx = stories.findIndex(s => s.id === data.id);
        if (idx >= 0) stories[idx] = { ...stories[idx], ...data };
        else stories.unshift(data);
    } else {
        data.id = Math.random().toString(36).slice(2, 10);
        data.created = new Date().toISOString();
        stories.unshift(data);
    }
    LS.set('etgarim_stories', stories);
}

function updateDashboard() {
    document.getElementById('dash-trainees').textContent = allTrainees.length;
    document.getElementById('dash-volunteers').textContent = allVolunteers.length;
    document.getElementById('dash-signups').textContent = allSignups.filter(s => s.status === 'new').length;
    document.getElementById('dash-stories').textContent = allStories.length;

    document.getElementById('dash-group-a').textContent = allTrainees.filter(t => t.group === 'A').length;
    document.getElementById('dash-group-b').textContent = allTrainees.filter(t => t.group === 'B').length;
    document.getElementById('dash-group-c').textContent = allTrainees.filter(t => t.group === 'C').length;
    document.getElementById('dash-group-d').textContent = allTrainees.filter(t => t.group === 'D').length;
}

// ── Trainees ────────────────────────────────────────────────
function renderTrainees(group) {
    const list = document.getElementById('trainees-list');
    let filtered = group === 'all' ? allTrainees : allTrainees.filter(t => t.group === group);

    const groupEmoji = { A: '🦅', B: '🐺', C: '🐬', D: '🐻' };
    const groupColor = { A: 'red', B: 'orange', C: 'blue', D: 'yellow' };

    list.innerHTML = filtered.map(t => `
        <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex justify-between items-center hover:shadow-md transition">
            <div class="flex items-center gap-3">
                <span class="text-2xl">${groupEmoji[t.group] || '❓'}</span>
                <div>
                    <div class="font-bold text-gray-900">${t.name}</div>
                    <div class="text-xs text-gray-500">
                        ${t.pace || ''} | ${t.kmMin || '?'}-${t.kmMax || '?'} ק"מ
                        ${t.oneToOne ? ' | <span class="text-red-500 font-medium">1:1</span>' : ''}
                    </div>
                    ${t.notes ? `<div class="text-xs text-gray-400 mt-1">${t.notes}</div>` : ''}
                </div>
            </div>
            <div class="flex items-center gap-2">
                <button onclick="cycleTrainingDay('${t.name}')" title="שנה יום אימון"
                    class="text-xs px-2 py-1 rounded-lg border border-gray-200 hover:border-brand hover:text-brand transition font-medium whitespace-nowrap">
                    📅 ${t.day || 'לא נקבע'}
                </button>
                <button onclick="showTraineeForm('${t.name}')" class="text-sm text-brand hover:underline">ערוך</button>
            </div>
        </div>
    `).join('') || '<p class="text-gray-400 text-center py-8">אין מתאמנים בקבוצה זו</p>';
}

function showTraineeForm(editName) {
    const trainee = editName ? allTrainees.find(t => t.name === editName) : null;
    const title = trainee ? `עריכת ${trainee.name}` : 'הוספת מתאמן חדש';

    openModal(`
        <h3 class="text-xl font-bold mb-4">${title}</h3>
        <form id="trainee-form" class="space-y-3">
            <div class="grid grid-cols-2 gap-3">
                <div>
                    <label class="text-sm font-medium text-gray-700">שם</label>
                    <input name="name" value="${trainee?.name || ''}" required ${trainee ? 'readonly' : ''}
                           class="w-full px-3 py-2 rounded-lg border text-sm ${trainee ? 'bg-gray-100' : ''}">
                </div>
                <div>
                    <label class="text-sm font-medium text-gray-700">מין</label>
                    <select name="gender" class="w-full px-3 py-2 rounded-lg border text-sm">
                        <option value="זכר" ${trainee?.gender === 'זכר' ? 'selected' : ''}>זכר</option>
                        <option value="נקבה" ${trainee?.gender === 'נקבה' ? 'selected' : ''}>נקבה</option>
                    </select>
                </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
                <div>
                    <label class="text-sm font-medium text-gray-700">יום</label>
                    <select name="day" class="w-full px-3 py-2 rounded-lg border text-sm">
                        <option value="שלישי" ${trainee?.day === 'שלישי' ? 'selected' : ''}>שלישי</option>
                        <option value="רביעי" ${trainee?.day === 'רביעי' ? 'selected' : ''}>רביעי</option>
                        <option value="" ${!trainee?.day ? 'selected' : ''}>לא נקבע</option>
                    </select>
                </div>
                <div>
                    <label class="text-sm font-medium text-gray-700">קבוצה</label>
                    <select name="group" class="w-full px-3 py-2 rounded-lg border text-sm">
                        <option value="A" ${trainee?.group === 'A' ? 'selected' : ''}>🦅 נשרים (A)</option>
                        <option value="B" ${trainee?.group === 'B' ? 'selected' : ''}>🐺 זאבים (B)</option>
                        <option value="C" ${trainee?.group === 'C' ? 'selected' : ''}>🐬 דולפינים (C)</option>
                        <option value="D" ${trainee?.group === 'D' ? 'selected' : ''}>🐻 דובים (D)</option>
                    </select>
                </div>
            </div>
            <div class="grid grid-cols-3 gap-3">
                <div>
                    <label class="text-sm font-medium text-gray-700">קצב</label>
                    <input name="pace" value="${trainee?.pace || ''}" class="w-full px-3 py-2 rounded-lg border text-sm" placeholder="06:00-08:00">
                </div>
                <div>
                    <label class="text-sm font-medium text-gray-700">ק"מ מינ'</label>
                    <input name="kmMin" type="number" step="0.5" value="${trainee?.kmMin || ''}" class="w-full px-3 py-2 rounded-lg border text-sm">
                </div>
                <div>
                    <label class="text-sm font-medium text-gray-700">ק"מ מקס'</label>
                    <input name="kmMax" type="number" step="0.5" value="${trainee?.kmMax || ''}" class="w-full px-3 py-2 rounded-lg border text-sm">
                </div>
            </div>
            <div>
                <label class="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="oneToOne" ${trainee?.oneToOne ? 'checked' : ''} class="rounded">
                    נדרש ליווי 1:1
                </label>
            </div>
            <div>
                <label class="text-sm font-medium text-gray-700">הערות</label>
                <textarea name="notes" rows="2" class="w-full px-3 py-2 rounded-lg border text-sm">${trainee?.notes || ''}</textarea>
            </div>
            <div class="flex gap-2">
                <button type="submit" class="flex-1 bg-brand text-white py-2 rounded-lg font-medium hover:bg-brand-dark transition">שמור</button>
                <button type="button" onclick="closeModal()" class="px-4 py-2 rounded-lg border text-gray-600 hover:bg-gray-50 transition">ביטול</button>
            </div>
        </form>
    `);

    document.getElementById('trainee-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const data = Object.fromEntries(fd);
        data.oneToOne = fd.has('oneToOne');
        data.kmMin = parseFloat(data.kmMin) || 0;
        data.kmMax = parseFloat(data.kmMax) || 0;

        await saveTrainee(data.name, data);
        closeModal();
        await loadAllData();
    });
}

async function cycleTrainingDay(name) {
    const trainee = allTrainees.find(t => t.name === name);
    if (!trainee) return;
    const days = ['שלישי', 'רביעי', ''];
    trainee.day = days[(days.indexOf(trainee.day || '') + 1) % days.length];
    await saveTrainee(name, { day: trainee.day });
    renderTrainees(document.querySelector('.trainee-filter.active')?.dataset.group || 'all');
}

// ── Volunteers ──────────────────────────────────────────────
function renderVolunteers() {
    const list = document.getElementById('volunteers-list');
    list.innerHTML = allVolunteers.map(v => `
        <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex justify-between items-center hover:shadow-md transition">
            <div>
                <div class="font-bold text-gray-900">${v.name || v.first_name || 'ללא שם'}</div>
                <div class="text-xs text-gray-500">${v.phone || ''} | ${v.availability || v.day || ''} | ${v.experience || v.pace || ''}</div>
                ${v.notes ? `<div class="text-xs text-gray-400 mt-1">${v.notes}</div>` : ''}
            </div>
            <button onclick="showVolunteerForm('${v.id}')" class="text-sm text-brand hover:underline">ערוך</button>
        </div>
    `).join('') || '<p class="text-gray-400 text-center py-8">אין מתנדבים רשומים</p>';
}

function showVolunteerForm(editId) {
    const vol = editId ? allVolunteers.find(v => v.id === editId) : null;
    openModal(`
        <h3 class="text-xl font-bold mb-4">${vol ? 'עריכת מתנדב' : 'הוספת מתנדב'}</h3>
        <form id="volunteer-form-admin" class="space-y-3">
            <input type="hidden" name="id" value="${vol?.id || ''}">
            <div class="grid grid-cols-2 gap-3">
                <div>
                    <label class="text-sm font-medium text-gray-700">שם</label>
                    <input name="name" value="${vol?.name || ''}" required class="w-full px-3 py-2 rounded-lg border text-sm">
                </div>
                <div>
                    <label class="text-sm font-medium text-gray-700">טלפון</label>
                    <input name="phone" value="${vol?.phone || ''}" class="w-full px-3 py-2 rounded-lg border text-sm" dir="ltr">
                </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
                <div>
                    <label class="text-sm font-medium text-gray-700">זמינות</label>
                    <select name="availability" class="w-full px-3 py-2 rounded-lg border text-sm">
                        <option value="שלישי" ${vol?.availability === 'שלישי' ? 'selected' : ''}>שלישי</option>
                        <option value="רביעי" ${vol?.availability === 'רביעי' ? 'selected' : ''}>רביעי</option>
                        <option value="גמיש" ${vol?.availability === 'גמיש' ? 'selected' : ''}>גמיש</option>
                    </select>
                </div>
                <div>
                    <label class="text-sm font-medium text-gray-700">רמה</label>
                    <input name="experience" value="${vol?.experience || ''}" class="w-full px-3 py-2 rounded-lg border text-sm" placeholder="רץ/הולך">
                </div>
            </div>
            <div>
                <label class="text-sm font-medium text-gray-700">הערות</label>
                <textarea name="notes" rows="2" class="w-full px-3 py-2 rounded-lg border text-sm">${vol?.notes || ''}</textarea>
            </div>
            <div class="flex gap-2">
                <button type="submit" class="flex-1 bg-brand text-white py-2 rounded-lg font-medium hover:bg-brand-dark transition">שמור</button>
                <button type="button" onclick="closeModal()" class="px-4 py-2 rounded-lg border text-gray-600 hover:bg-gray-50 transition">ביטול</button>
            </div>
        </form>
    `);

    document.getElementById('volunteer-form-admin').addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target));
        await saveVolunteer(data);
        closeModal();
        await loadAllData();
    });
}

// ── Stories ──────────────────────────────────────────────────
function renderStories() {
    const list = document.getElementById('stories-list');
    list.innerHTML = allStories.map(s => `
        <div class="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
            ${s.image ? `<img src="${s.image}" class="w-full h-40 object-cover">` : ''}
            <div class="p-4">
                <div class="flex justify-between items-start mb-2">
                    <h4 class="font-bold text-gray-900">${s.title}</h4>
                    <span class="text-xs px-2 py-1 rounded-full ${s.visible !== false ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}">${s.visible !== false ? 'מוצג' : 'מוסתר'}</span>
                </div>
                <p class="text-sm text-gray-600 mb-3">${s.text || ''}</p>
                ${s.link ? `<a href="${s.link}" target="_blank" class="text-xs text-brand hover:underline">🔗 קישור</a>` : ''}
                <div class="flex gap-2 mt-3 pt-3 border-t">
                    <button onclick="showStoryForm('${s.id}')" class="text-sm text-brand hover:underline">ערוך</button>
                    <button onclick="deleteStory('${s.id}')" class="text-sm text-red-500 hover:underline">מחק</button>
                </div>
            </div>
        </div>
    `).join('') || '<p class="text-gray-400 text-center py-8 col-span-2">אין סיפורי השראה. הוסיפו את הראשון!</p>';
}

function showStoryForm(editId) {
    const story = editId ? allStories.find(s => s.id === editId) : null;
    openModal(`
        <h3 class="text-xl font-bold mb-4">${story ? 'עריכת סיפור' : 'הוספת סיפור השראה'}</h3>
        <form id="story-form" class="space-y-3">
            <input type="hidden" name="id" value="${story?.id || ''}">
            <div>
                <label class="text-sm font-medium text-gray-700">כותרת *</label>
                <input name="title" value="${story?.title || ''}" required class="w-full px-3 py-2 rounded-lg border text-sm">
            </div>
            <div>
                <label class="text-sm font-medium text-gray-700">תוכן</label>
                <textarea name="text" rows="3" class="w-full px-3 py-2 rounded-lg border text-sm">${story?.text || ''}</textarea>
            </div>
            <div>
                <label class="text-sm font-medium text-gray-700">קישור לתמונה (URL)</label>
                <input name="image" value="${story?.image || ''}" class="w-full px-3 py-2 rounded-lg border text-sm" dir="ltr" placeholder="https://...">
            </div>
            <div>
                <label class="text-sm font-medium text-gray-700">קישור לפוסט (פייסבוק/אינסטגרם)</label>
                <input name="link" value="${story?.link || ''}" class="w-full px-3 py-2 rounded-lg border text-sm" dir="ltr" placeholder="https://facebook.com/...">
            </div>
            <div>
                <label class="text-sm font-medium text-gray-700">תאריך</label>
                <input name="date" type="date" value="${story?.date || new Date().toISOString().split('T')[0]}" class="w-full px-3 py-2 rounded-lg border text-sm" dir="ltr">
            </div>
            <div>
                <label class="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="visible" ${story?.visible !== false ? 'checked' : ''} class="rounded">
                    הצג באתר
                </label>
            </div>
            <div class="flex gap-2">
                <button type="submit" class="flex-1 bg-brand text-white py-2 rounded-lg font-medium hover:bg-brand-dark transition">שמור</button>
                <button type="button" onclick="closeModal()" class="px-4 py-2 rounded-lg border text-gray-600 hover:bg-gray-50 transition">ביטול</button>
            </div>
        </form>
    `);

    document.getElementById('story-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const data = Object.fromEntries(fd);
        data.visible = fd.has('visible');
        await saveStory(data);
        closeModal();
        await loadAllData();
    });
}

async function deleteStory(id) {
    if (!confirm('למחוק את הסיפור?')) return;
    await apiFetch('/api/story/delete', { method: 'POST', body: JSON.stringify({ id }) }).catch(() => null);
    const stories = LS.get('etgarim_stories', []);
    LS.set('etgarim_stories', stories.filter(s => s.id !== id));
    await loadAllData();
}

// ── Signups ─────────────────────────────────────────────────
function renderSignups() {
    const list = document.getElementById('signups-list');
    list.innerHTML = allSignups.map(s => `
        <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100 ${s.status === 'new' ? 'border-r-4 border-r-brand' : ''}">
            <div class="flex justify-between items-start">
                <div>
                    <div class="font-bold text-gray-900">${s.name}</div>
                    <div class="text-sm text-gray-600">${s.phone || ''} | ${s.email || ''}</div>
                    <div class="text-xs text-gray-500 mt-1">זמינות: ${s.availability || 'לא צוין'} | ניסיון: ${s.experience || 'לא צוין'}</div>
                    ${s.notes ? `<div class="text-xs text-gray-400 mt-1 italic">"${s.notes}"</div>` : ''}
                    <div class="text-xs text-gray-300 mt-1">${s.date ? new Date(s.date).toLocaleDateString('he-IL') : ''}</div>
                </div>
                <span class="text-xs px-2 py-1 rounded-full ${s.status === 'new' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}">${s.status === 'new' ? 'חדש' : 'טופל'}</span>
            </div>
        </div>
    `).join('') || '<p class="text-gray-400 text-center py-8">אין פניות חדשות</p>';
}

// ── Modal ────────────────────────────────────────────────────
function openModal(html) {
    document.getElementById('modal-content').innerHTML = html;
    document.getElementById('modal-overlay').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('modal-overlay').classList.add('hidden');
}
