// ── PIN Protection ───────────────────────────────────────────
const PIN_HASH = '180e7e16333f7904f7dc60367929e9e94cbab98a3fee260fd022d4c29c7aed80';
const AUTH_KEY = 'etgarim_coach_pin_ok';

async function sha256(str) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
}

function isAuthenticated() {
    return localStorage.getItem(AUTH_KEY) === 'yes';
}

function showPinScreen() {
    document.getElementById('pin-screen').style.display = 'flex';
    document.getElementById('app-root').style.display = 'none';
}

function showApp() {
    document.getElementById('pin-screen').style.display = 'none';
    document.getElementById('app-root').style.display = 'block';
    initApp();
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('pin-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const pin = document.getElementById('pin-input').value;
        const hash = await sha256(pin);
        if (hash === PIN_HASH) {
            localStorage.setItem(AUTH_KEY, 'yes');
            showApp();
        } else {
            document.getElementById('pin-error').style.display = 'block';
            document.getElementById('pin-input').value = '';
        }
    });

    if (isAuthenticated()) showApp();
    else showPinScreen();
});

// ── localStorage helpers ─────────────────────────────────────
const LS_KEY = 'etgarim_trainee_data';

function lsLoad() {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || 'null') || {}; } catch { return {}; }
}

function lsSave(data) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch {}
}

// ── State ────────────────────────────────────────────────────
let activeGroup = 'all';
let serverData = {};

async function initApp() {
    await loadServerData();
    renderStats();
    renderGroups();
    setupTabs();
    setupModal();
}

async function loadServerData() {
    try {
        const res = await fetch('/api/trainees', { signal: AbortSignal.timeout(3000) });
        const json = await res.json();
        if (json && typeof json === 'object' && !json.error) {
            serverData = json;
            lsSave(serverData);
        } else throw new Error();
    } catch {
        serverData = lsLoad();
        if (Object.keys(serverData).length === 0 && typeof SEED_DATA !== 'undefined') {
            serverData = SEED_DATA;
            lsSave(serverData);
        }
    }

    for (let i = TRAINEES.length - 1; i >= 0; i--) {
        const sd = serverData[TRAINEES[i].name];
        if (sd && sd._isDeleted) TRAINEES.splice(i, 1);
    }

    TRAINEES.forEach(t => {
        const sd = serverData[t.name];
        if (!sd) return;
        if (sd.goal) t.goal = sd.goal;
        if (sd.goalType) t.goalType = sd.goalType;
        if (sd.goalDate) t.goalDate = sd.goalDate;
        if (sd.currentPace) t.currentPace = sd.currentPace;
        if (sd.currentKm) t.currentKm = sd.currentKm;
        if (sd.injury) t.injury = sd.injury;
        if (sd.personalNotes) t.personalNotes = sd.personalNotes;
        if (sd.log) t.log = sd.log;
        if (sd._groupOverride) t.group = sd._groupOverride;
    });

    for (const [name, sd] of Object.entries(serverData)) {
        if (sd._isAdded && !sd._isDeleted && !TRAINEES.find(t => t.name === name)) {
            const td = sd._traineeData || {};
            TRAINEES.push({
                name,
                gender: td.gender || 'זכר',
                day: td.day || '',
                pace: td.pace || '',
                kmMin: td.kmMin || 0,
                kmMax: td.kmMax || 0,
                group: td.group || 'D',
                notes: td.notes || '',
                goal: sd.goal || '',
                oneToOne: td.oneToOne || false,
                log: sd.log || [],
                _isDynamic: true,
            });
        }
    }
}

function lsUpdateTrainee(name, fields) {
    const data = lsLoad();
    if (!data[name]) data[name] = {};
    Object.assign(data[name], fields);
    data[name].lastUpdated = new Date().toISOString();
    lsSave(data);
}

async function saveTraineeField(name, fields) {
    lsUpdateTrainee(name, fields);
    try {
        await fetch('/api/trainee', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, fields }), signal: AbortSignal.timeout(3000)
        });
    } catch {}
    const t = TRAINEES.find(tr => tr.name === name);
    if (t) Object.assign(t, fields);
}

async function addTrainingLog(name, fields) {
    const data = lsLoad();
    if (!data[name]) data[name] = {};
    if (!data[name].log) data[name].log = [];
    fields.date = fields.date || new Date().toISOString().split('T')[0];
    data[name].log.push(fields);
    data[name].lastUpdated = new Date().toISOString();
    lsSave(data);
    try {
        await fetch('/api/training-log', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, fields }), signal: AbortSignal.timeout(3000)
        });
    } catch {}
    const t = TRAINEES.find(tr => tr.name === name);
    if (t) { if (!t.log) t.log = []; t.log.push(fields); }
}

function renderStats() {
    const stats = document.getElementById('stats');
    const total = TRAINEES.length;
    const groups = ['A', 'B', 'C', 'D'].map(g => TRAINEES.filter(t => t.group === g).length);
    stats.innerHTML = `
        <span>סה"כ ${total} מתאמנים</span>
        <span>🦅 ${groups[0]}</span>
        <span>🐺 ${groups[1]}</span>
        <span>🐬 ${groups[2]}</span>
        <span>🐻 ${groups[3]}</span>
    `;
}

function renderGroups() {
    const main = document.getElementById('mainContent');
    const groupOrder = ['A', 'B', 'C', 'D'];
    const filtered = activeGroup === 'all' ? groupOrder : [activeGroup];

    main.innerHTML = filtered.map(groupKey => {
        const group = GROUPS[groupKey];
        const members = TRAINEES.filter(t => t.group === groupKey);

        return `
            <section class="group-section">
                <div class="group-header group-${groupKey.toLowerCase()}">
                    <span>${group.emoji} ${group.name}</span>
                    <span class="level">רמה ${group.level}</span>
                    <span class="count">${members.length} חברים</span>
                </div>
                <div class="group-desc">${group.description}</div>
                ${members.map(t => renderCard(t, groupKey)).join('')}
            </section>
        `;
    }).join('');

    document.querySelectorAll('.trainee-card').forEach(card => {
        card.addEventListener('click', () => {
            const name = card.dataset.name;
            const trainee = TRAINEES.find(t => t.name === name);
            if (trainee) openModal(trainee);
        });
    });
}

function renderCard(trainee, groupKey) {
    const initial = trainee.name.charAt(0);
    const badges = [];
    if (trainee.oneToOne) badges.push('<span class="badge warn">1:1</span>');
    if (trainee.goal) badges.push('<span class="badge">🎯</span>');
    if (trainee.log && trainee.log.length) badges.push(`<span class="badge">${trainee.log.length} אימונים</span>`);

    const DAY_OPTIONS = [
        { value: 'שלישי',          label: 'שלישי' },
        { value: 'רביעי',          label: 'רביעי' },
        { value: 'שלישי+רביעי',   label: 'שניהם'  },
    ];
    const dayBtns = DAY_OPTIONS.map(d =>
        `<button class="day-btn ${trainee.day === d.value ? 'active' : ''}"
                 onclick="event.stopPropagation(); changeDay('${trainee.name}', '${d.value}')">${d.label}</button>`
    ).join('');

    return `
        <div class="trainee-card" data-name="${trainee.name}">
            <div class="trainee-avatar avatar-${groupKey.toLowerCase()}">${initial}</div>
            <div class="trainee-info">
                <div class="trainee-name">${trainee.name}</div>
                <div class="trainee-meta">${trainee.kmMin}-${trainee.kmMax} ק"מ · ${trainee.pace || 'לא ידוע'}</div>
                ${trainee.goal ? `<div class="trainee-goal-preview">🎯 ${trainee.goal}</div>` : ''}
                <div class="day-selector">${dayBtns}</div>
            </div>
            <div class="trainee-badges">${badges.join('')}</div>
            <div class="trainee-arrow">&#8592;</div>
        </div>
    `;
}

async function changeDay(name, day) {
    const trainee = TRAINEES.find(t => t.name === name);
    if (!trainee) return;
    trainee.day = day;
    await saveTraineeField(name, { day });
    renderGroups();
    showSaved();
}

function setupTabs() {
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            activeGroup = tab.dataset.group;
            renderGroups();
        });
    });
}

function setupModal() {
    const overlay = document.getElementById('modalOverlay');
    const closeBtn = document.getElementById('modalClose');
    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
    });
}

const GOAL_TYPES = [
    { id: 'distance', label: '📏 מרחק מסוים', icon: '📏' },
    { id: 'distance_time', label: '⏱️ מרחק לפי זמן', icon: '⏱️' },
    { id: 'volunteer', label: '🤝 היכרות מתנדב/ת חדש/ה', icon: '🤝' },
];

const GOAL_PRESETS = {
    D: {
        distance: ['1.5 ק"מ', '2 ק"מ', '2.5 ק"מ', '3 ק"מ'],
        distance_time: ['1.5 ק"מ ב-20 דקות', '2 ק"מ ב-25 דקות', '2 ק"מ ב-30 דקות', '3 ק"מ ב-40 דקות'],
        volunteer: ['היכרות עם מתנדב/ת חדש/ה', 'אימון ראשון עם מתנדב/ת', 'שבועיים רצוף עם אותו מתנדב/ת'],
    },
    C: {
        distance: ['3 ק"מ', '4 ק"מ', '5 ק"מ', '6 ק"מ'],
        distance_time: ['3 ק"מ ב-30 דקות', '4 ק"מ ב-40 דקות', '5 ק"מ ב-50 דקות', '5 ק"מ ב-45 דקות'],
        volunteer: ['היכרות עם מתנדב/ת חדש/ה', 'אימון ראשון עם מתנדב/ת', 'שבועיים רצוף עם אותו מתנדב/ת'],
    },
    B: {
        distance: ['3 ק"מ ריצה', '4 ק"מ ריצה', '5 ק"מ ריצה-הליכה', '5 ק"מ ריצה רצופה'],
        distance_time: ['3 ק"מ ב-25 דקות', '4 ק"מ ב-30 דקות', '5 ק"מ ב-40 דקות', '5 ק"מ ב-35 דקות'],
        volunteer: ['היכרות עם מתנדב/ת חדש/ה', 'אימון ראשון עם מתנדב/ת', 'שבועיים רצוף עם אותו מתנדב/ת'],
    },
    A: {
        distance: ['5 ק"מ', '8 ק"מ', '10 ק"מ', '15 ק"מ', '21 ק"מ (חצי מרתון)'],
        distance_time: ['5 ק"מ ב-25 דקות', '5 ק"מ ב-30 דקות', '10 ק"מ ב-55 דקות', '10 ק"מ ב-50 דקות'],
        volunteer: ['היכרות עם מתנדב/ת חדש/ה', 'אימון ראשון עם מתנדב/ת', 'שבועיים רצוף עם אותו מתנדב/ת'],
    }
};

function openModal(trainee) {
    const overlay = document.getElementById('modalOverlay');
    const content = document.getElementById('modalContent');
    const group = GROUPS[trainee.group];
    const genderIcon = trainee.gender === 'נקבה' ? '👩' : '👨';
    const presets = GOAL_PRESETS[trainee.group] || {};
    const logs = trainee.log || [];
    const currentGoalType = trainee.goalType || '';

    content.innerHTML = `
        <h2>${genderIcon} ${trainee.name}</h2>
        <span class="group-tag tag-${trainee.group.toLowerCase()}">${group.emoji} ${group.name} — רמה ${group.level}</span>

        <div class="detail-grid">
            <div class="detail-item">
                <div class="label">יום אימון</div>
                <div class="value">${trainee.day || 'לא קבוע'}</div>
            </div>
            <div class="detail-item">
                <div class="label">קצב (דק'/ק"מ)</div>
                <div class="value">${trainee.pace || 'לא ידוע'}</div>
            </div>
            <div class="detail-item">
                <div class="label">טווח מרחק</div>
                <div class="value">${trainee.kmMin}-${trainee.kmMax} ק"מ</div>
            </div>
            <div class="detail-item">
                <div class="label">ליווי 1:1</div>
                <div class="value">${trainee.oneToOne ? 'כן ✓' : 'לא נדרש'}</div>
            </div>
        </div>

        ${trainee.notes ? `
        <div class="notes-section">
            <h3>📝 הערות</h3>
            <p>${trainee.notes}</p>
        </div>` : ''}

        <!-- GOAL SECTION -->
        <div class="goal-section">
            <h3>🎯 יעד</h3>
            ${trainee.goal ? `<div class="current-goal">יעד נוכחי: <strong>${trainee.goal}</strong>${trainee.goalDate ? ` <span class="goal-date">עד ${trainee.goalDate}</span>` : ''}</div>` : ''}
            <div class="goal-type-selector">
                ${GOAL_TYPES.map(gt => `
                    <button class="goal-type-btn ${currentGoalType === gt.id ? 'selected' : ''}"
                            onclick="showGoalOptions('${trainee.name}', '${gt.id}')">${gt.label}</button>
                `).join('')}
            </div>
            <div class="goal-options" id="goalOptions"></div>
            <div class="goal-date-field">
                <label>תאריך יעד</label>
                <input type="date" id="goalDate" value="${trainee.goalDate || ''}">
            </div>
            <div class="goal-custom">
                <input type="text" id="goalCustom" placeholder="או הקלד יעד מותאם אישית...">
                <button class="btn-save" onclick="saveCustomGoal('${trainee.name}')">שמור יעד</button>
            </div>
        </div>

        <!-- DATA INPUT SECTION -->
        <div class="data-section">
            <h3>📊 עדכון נתונים</h3>
            <div class="data-grid">
                <div class="data-field">
                    <label>קצב נוכחי (דק'/ק"מ)</label>
                    <input type="text" id="fieldPace" value="${trainee.currentPace || ''}" placeholder="לדוגמה: 07:30">
                </div>
                <div class="data-field">
                    <label>מרחק נוכחי (ק"מ)</label>
                    <input type="number" id="fieldKm" value="${trainee.currentKm || ''}" placeholder="לדוגמה: 4.5" step="0.1">
                </div>
                <div class="data-field full-width">
                    <label>פציעות/מגבלות</label>
                    <input type="text" id="fieldInjury" value="${trainee.injury || ''}" placeholder="למשל: כאב ברך ימין">
                </div>
                <div class="data-field full-width">
                    <label>הערות אישיות</label>
                    <textarea id="fieldNotes" rows="2" placeholder="הערות נוספות...">${trainee.personalNotes || ''}</textarea>
                </div>
            </div>
            <button class="btn-save btn-save-data" onclick="saveTraineeData('${trainee.name}')">💾 שמור נתונים</button>
        </div>

        <!-- TRAINING LOG -->
        <div class="log-section">
            <h3>📋 יומן אימונים</h3>
            <div class="log-form">
                <div class="data-grid">
                    <div class="data-field">
                        <label>תאריך</label>
                        <input type="date" id="logDate" value="${new Date().toISOString().split('T')[0]}">
                    </div>
                    <div class="data-field">
                        <label>מרחק (ק"מ)</label>
                        <input type="number" id="logKm" step="0.1" placeholder="3.5">
                    </div>
                    <div class="data-field">
                        <label>זמן (דקות)</label>
                        <input type="number" id="logTime" placeholder="40">
                    </div>
                    <div class="data-field">
                        <label>סוג אימון</label>
                        <select id="logType">
                            ${group.trainingOptions.map(o => `<option value="${o.type}">${o.type}</option>`).join('')}
                        </select>
                    </div>
                    <div class="data-field full-width">
                        <label>הערות</label>
                        <input type="text" id="logNotes" placeholder="איך היה?">
                    </div>
                </div>
                <button class="btn-save btn-add-log" onclick="addLog('${trainee.name}')">➕ הוסף אימון</button>
            </div>

            ${logs.length > 0 ? `
            <div class="log-entries">
                <h4>אימונים אחרונים</h4>
                ${logs.slice().reverse().slice(0, 10).map(l => `
                    <div class="log-entry">
                        <span class="log-date">${l.date || ''}</span>
                        <span class="log-type">${l.type || ''}</span>
                        <span class="log-km">${l.km ? l.km + ' ק"מ' : ''}</span>
                        <span class="log-time">${l.time ? l.time + ' דק\'' : ''}</span>
                        ${l.notes ? `<span class="log-notes">${l.notes}</span>` : ''}
                    </div>
                `).join('')}
            </div>` : '<p class="no-logs">אין אימונים מתועדים עדיין</p>'}
        </div>

        <!-- MOVE TRAINEE -->
        <div class="move-section">
            <h3>🔄 העבר לקבוצה אחרת</h3>
            <div class="move-buttons">
                ${['A', 'B', 'C', 'D'].filter(g => g !== trainee.group).map(g => `
                    <button class="btn-move btn-move-${g.toLowerCase()}"
                            onclick="moveTrainee('${trainee.name}', '${g}')">
                        ${GROUPS[g].emoji} ${GROUPS[g].name}
                    </button>
                `).join('')}
            </div>
        </div>

        <!-- TRAINING OPTIONS -->
        <div class="training-section">
            <h3>💪 אפשרויות אימון ל${group.name}</h3>
            ${group.trainingOptions.map(opt => `
                <div class="training-option">
                    <div class="type">${opt.type}</div>
                    <div class="desc">${opt.desc}</div>
                </div>
            `).join('')}
        </div>

        <!-- DELETE TRAINEE -->
        <div class="delete-section">
            <button class="btn-delete-trainee" onclick="deleteTrainee('${trainee.name}')">🗑️ הסר מתאמן/ת</button>
        </div>
    `;

    overlay.classList.add('open');
}

function showGoalOptions(name, goalType) {
    const trainee = TRAINEES.find(t => t.name === name);
    const presets = GOAL_PRESETS[trainee.group] || {};
    const options = presets[goalType] || [];
    const container = document.getElementById('goalOptions');

    document.querySelectorAll('.goal-type-btn').forEach(b => b.classList.remove('selected'));
    event.target.classList.add('selected');

    container.innerHTML = `
        <div class="goal-presets">
            ${options.map(p => `
                <button class="goal-preset-btn ${trainee.goal === p ? 'selected' : ''}"
                        onclick="selectGoal('${name}', '${goalType}', '${p.replace(/'/g, "\\'")}')">${p}</button>
            `).join('')}
        </div>
    `;
}

async function selectGoal(name, goalType, goal) {
    const goalDate = document.getElementById('goalDate').value;
    await saveTraineeField(name, { goal, goalType, goalDate });
    document.querySelectorAll('.goal-preset-btn').forEach(b => b.classList.remove('selected'));
    event.target.classList.add('selected');
    document.getElementById('goalCustom').value = '';
    // Update current goal display
    const currentGoalEl = document.querySelector('.current-goal');
    if (currentGoalEl) {
        currentGoalEl.innerHTML = `יעד נוכחי: <strong>${goal}</strong>`;
    }
    renderGroups();
    showSaved();
}

async function saveCustomGoal(name) {
    const goal = document.getElementById('goalCustom').value.trim();
    if (!goal) return;
    const goalDate = document.getElementById('goalDate').value;
    await saveTraineeField(name, { goal, goalType: 'custom', goalDate });
    document.querySelectorAll('.goal-preset-btn').forEach(b => b.classList.remove('selected'));
    renderGroups();
    showSaved();
}

async function saveTraineeData(name) {
    const fields = {
        currentPace: document.getElementById('fieldPace').value.trim(),
        currentKm: document.getElementById('fieldKm').value.trim(),
        injury: document.getElementById('fieldInjury').value.trim(),
        personalNotes: document.getElementById('fieldNotes').value.trim(),
    };
    await saveTraineeField(name, fields);
    showSaved();
}

async function addLog(name) {
    const fields = {
        date: document.getElementById('logDate').value,
        km: document.getElementById('logKm').value,
        time: document.getElementById('logTime').value,
        type: document.getElementById('logType').value,
        notes: document.getElementById('logNotes').value.trim(),
    };
    if (!fields.date) return;
    await addTrainingLog(name, fields);
    // Refresh modal
    const trainee = TRAINEES.find(t => t.name === name);
    if (trainee) openModal(trainee);
    renderGroups();
    showSaved();
}

function showSaved() {
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        document.body.appendChild(toast);
    }
    toast.textContent = '✓ נשמר!';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
}

function closeModal() {
    document.getElementById('modalOverlay').classList.remove('open');
}


// ========== ADD TRAINEE ==========
function openAddTraineeModal() {
    const overlay = document.getElementById('modalOverlay');
    const content = document.getElementById('modalContent');
    content.innerHTML = `
        <h2>➕ הוסף מתאמן/ת חדש/ה</h2>
        <div class="add-trainee-form">
            <div class="data-grid">
                <div class="data-field full-width"><label>שם *</label><input type="text" id="addName" placeholder="שם פרטי + אות שם משפחה (למשל: דני כ.)"></div>
                <div class="data-field"><label>מין</label><select id="addGender"><option value="זכר">👨 זכר</option><option value="נקבה">👩 נקבה</option></select></div>
                <div class="data-field"><label>קבוצה *</label><select id="addGroup"><option value="A">🦅 נשרים (A)</option><option value="B">🐺 זאבים (B)</option><option value="C">🐬 דולפינים (C)</option><option value="D" selected>🐻 דובים (D)</option></select></div>
                <div class="data-field"><label>יום אימון</label><select id="addDay"><option value="">לא קבוע</option><option value="שלישי">שלישי</option><option value="רביעי">רביעי</option><option value="שלישי+רביעי">שלישי+רביעי</option></select></div>
                <div class="data-field"><label>קצב (דק'/ק"מ)</label><input type="text" id="addPace" placeholder="למשל: 07:00-09:00"></div>
                <div class="data-field"><label>מרחק מינימום (ק"מ)</label><input type="number" id="addKmMin" step="0.5" value="0" min="0"></div>
                <div class="data-field"><label>מרחק מקסימום (ק"מ)</label><input type="number" id="addKmMax" step="0.5" value="0" min="0"></div>
                <div class="data-field"><label>ליווי 1:1</label><select id="addOneToOne"><option value="false">לא נדרש</option><option value="true">נדרש</option></select></div>
                <div class="data-field full-width"><label>הערות</label><textarea id="addNotes" rows="2" placeholder="הערות נוספות..."></textarea></div>
            </div>
            <button class="btn-save btn-save-add" onclick="saveNewTrainee()">✅ הוסף מתאמן/ת</button>
        </div>
    `;
    overlay.classList.add('open');
}

async function saveNewTrainee() {
    const name = document.getElementById('addName').value.trim();
    if (!name) { alert('חובה להזין שם'); return; }
    if (TRAINEES.find(t => t.name === name)) { alert('מתאמן/ת בשם זה כבר קיים/ת'); return; }
    const trainee = {
        name,
        gender: document.getElementById('addGender').value,
        group: document.getElementById('addGroup').value,
        day: document.getElementById('addDay').value,
        pace: document.getElementById('addPace').value.trim(),
        kmMin: parseFloat(document.getElementById('addKmMin').value) || 0,
        kmMax: parseFloat(document.getElementById('addKmMax').value) || 0,
        oneToOne: document.getElementById('addOneToOne').value === 'true',
        notes: document.getElementById('addNotes').value.trim(),
    };
    lsUpdateTrainee(name, { _isAdded: true, _traineeData: trainee, goal: '', log: [] });
    try {
        await fetch('/api/trainee/add', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(trainee), signal: AbortSignal.timeout(3000) });
    } catch {}
    TRAINEES.push({ ...trainee, goal: '', log: [], _isDynamic: true });
    closeModal(); renderStats(); renderGroups(); showSaved();
}

// ========== MOVE TRAINEE ==========
async function moveTrainee(name, newGroup) {
    if (!confirm(`להעביר את ${name} לקבוצת ${GROUPS[newGroup].emoji} ${GROUPS[newGroup].name}?`)) return;
    lsUpdateTrainee(name, { _groupOverride: newGroup });
    try {
        await fetch('/api/trainee/move', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, group: newGroup }), signal: AbortSignal.timeout(3000) });
    } catch {}
    const t = TRAINEES.find(tr => tr.name === name);
    if (t) t.group = newGroup;
    closeModal(); renderStats(); renderGroups(); showSaved();
}

// ========== DELETE TRAINEE ==========
async function deleteTrainee(name) {
    if (!confirm(`למחוק את ${name} מהמערכת?\nפעולה זו לא ניתנת לביטול!`)) return;
    lsUpdateTrainee(name, { _isDeleted: true });
    try {
        await fetch('/api/trainee/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }), signal: AbortSignal.timeout(3000) });
    } catch {}
    const idx = TRAINEES.findIndex(t => t.name === name);
    if (idx !== -1) TRAINEES.splice(idx, 1);
    closeModal(); renderStats(); renderGroups(); showSaved();
}
