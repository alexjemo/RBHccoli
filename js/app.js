const SUPABASE_URL = 'https://qjobrkzefvheypzlwpex.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqb2Jya3plZnZoZXlwemx3cGV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3NzM0NjcsImV4cCI6MjA5NDM0OTQ2N30.h4e6beu8TL_041HO9Ws8qshqnLgFs9YS1wosakv3Whk';

let supabaseClient = null;
if (SUPABASE_URL && SUPABASE_ANON_KEY && window.supabase) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

const MOCK_DB = {
    events: [
        { id: 1, name: "Workshop ALAS - Medellín", active: true },
        { id: 2, name: "Workshop ALAS - Panamá", active: true }
    ],
    sponsors: [
        { id: 1, event_id: 1, name: "Sponsor Oro", logo_url: "https://via.placeholder.com/100/FFD700", tier: "gold", question: "¿Cuál es nuestro producto estrella?", options: ["Cámara 360", "Sensor de humo", "Alarma básica"], correct_option: 0, points: 200, active: true },
        { id: 2, event_id: 1, name: "Sponsor Plata", logo_url: "https://via.placeholder.com/100/C0C0C0", tier: "silver", question: "¿Año de fundación?", options: ["1990", "2000", "2010"], correct_option: 1, points: 100, active: true },
        { id: 3, event_id: 1, name: "Sponsor Bronce", logo_url: "https://via.placeholder.com/100/CD7F32", tier: "bronze", question: "¿Oficina principal?", options: ["Miami", "Bogotá", "Lima"], correct_option: 1, points: 50, active: true }
    ],
    users: [],
};

const dbAPI = {
    // ---- EVENTS ----
    async getEvents(includeInactive = false) {
        if (supabaseClient) {
            // Fetch all events - filter client-side in case 'active' column doesn't exist yet
            const { data, error } = await supabaseClient.from('events').select('*').order('id', { ascending: true });
            if (error) console.error(error);
            const all = data || [];
            // If active column exists, filter; if not (null/undefined), treat as active
            return includeInactive ? all : all.filter(e => e.active !== false);
        }
        const evs = MOCK_DB.events;
        return includeInactive ? evs : evs.filter(e => e.active !== false);
    },


    async createEvent(name, location, date) {
        if (supabaseClient) {
            const { data, error } = await supabaseClient.from('events').insert([{ name, location, date, active: true }]).select();
            if (error) throw error;
            return data ? data[0] : null;
        }
        const ev = { id: Date.now(), name, location, date, active: true };
        MOCK_DB.events.push(ev);
        return ev;
    },

    async updateEvent(id, name, location, date) {
        if (supabaseClient) {
            const { data, error } = await supabaseClient.from('events').update({ name, location, date }).eq('id', id).select();
            if (error) throw error;
            return data ? data[0] : null;
        }
        const ev = MOCK_DB.events.find(e => e.id == id);
        if (ev) { ev.name = name; ev.location = location; ev.date = date; }
        return ev;
    },

    async toggleEventActive(id, active) {
        if (supabaseClient) {
            const { error } = await supabaseClient.from('events').update({ active }).eq('id', id);
            if (error) throw error;
            return;
        }
        const ev = MOCK_DB.events.find(e => e.id == id);
        if (ev) ev.active = active;
    },

    // ---- SPONSORS ----
    async getSponsors(eventId) {
        if (supabaseClient) {
            const { data, error } = await supabaseClient.from('sponsors').select('*').eq('event_id', eventId).eq('active', true);
            if (error) console.error(error);
            return data || [];
        }
        return MOCK_DB.sponsors.filter(s => s.event_id == eventId && s.active !== false);
    },

    async getSponsorsAdmin(eventId) {
        if (supabaseClient) {
            const { data, error } = await supabaseClient.from('sponsors').select('*').eq('event_id', eventId).order('id');
            if (error) console.error(error);
            return data || [];
        }
        return MOCK_DB.sponsors.filter(s => s.event_id == eventId);
    },

    async createSponsor(eventId, name, logoUrl, tier, question, options, correctOption, points) {
        if (supabaseClient) {
            const { data, error } = await supabaseClient.from('sponsors').insert([{
                event_id: eventId, name, logo_url: logoUrl, tier, question,
                options: JSON.stringify(options), correct_option: correctOption, points, active: true
            }]).select();
            if (error) throw error;
            return data ? data[0] : null;
        }
        const s = { id: Date.now(), event_id: eventId, name, logo_url: logoUrl, tier, question, options, correct_option: correctOption, points, active: true };
        MOCK_DB.sponsors.push(s);
        return s;
    },

    async updateSponsor(id, name, logoUrl, tier, question, options, correctOption, points) {
        if (supabaseClient) {
            const update = { name, tier, question, options: JSON.stringify(options), correct_option: correctOption, points };
            if (logoUrl) update.logo_url = logoUrl;
            const { data, error } = await supabaseClient.from('sponsors').update(update).eq('id', id).select();
            if (error) throw error;
            return data ? data[0] : null;
        }
        const s = MOCK_DB.sponsors.find(x => x.id == id);
        if (s) { s.name = name; if (logoUrl) s.logo_url = logoUrl; s.tier = tier; s.question = question; s.options = options; s.correct_option = correctOption; s.points = points; }
        return s;
    },

    async toggleSponsorActive(id, active) {
        if (supabaseClient) {
            const { error } = await supabaseClient.from('sponsors').update({ active }).eq('id', id);
            if (error) throw error;
            return;
        }
        const s = MOCK_DB.sponsors.find(x => x.id == id);
        if (s) s.active = active;
    },

    // ---- USERS ----
    async loginUser(eventId, name, company, email) {
        if (supabaseClient) {
            let { data: users } = await supabaseClient.from('users').select('*').eq('email', email).eq('event_id', eventId);
            if (users && users.length > 0) return users[0];
            const { data, error } = await supabaseClient.from('users').insert([{
                event_id: eventId, name, company, email, total_points: 0, start_time: new Date().toISOString()
            }]).select();
            return data ? data[0] : null;
        }
        return new Promise(res => {
            setTimeout(() => {
                let user = MOCK_DB.users.find(u => u.email === email && u.event_id == eventId);
                if (!user) {
                    user = { id: Date.now(), event_id: eventId, name, company, email, total_points: 0, activities: [] };
                    MOCK_DB.users.push(user);
                }
                res(user);
            }, 500);
        });
    },

    async registerActivity(userId, type, points, sponsorId = null, metadata = null) {
        if (supabaseClient) {
            const record = { user_id: userId, activity_type: type, points, sponsor_id: sponsorId };
            if (metadata) record.metadata = metadata;
            await supabaseClient.from('user_activities').insert([record]);
            const { data: user } = await supabaseClient.from('users').select('total_points').eq('id', userId).single();
            await supabaseClient.from('users').update({ total_points: user.total_points + points }).eq('id', userId);
            return;
        }
        return new Promise(res => {
            setTimeout(() => {
                let user = MOCK_DB.users.find(u => u.id === userId);
                if (user) { user.activities.push({ type, sponsorId, points }); user.total_points += points; }
                res();
            }, 300);
        });
    },

    async getUserActivities(userId) {
        if (supabaseClient) {
            const { data } = await supabaseClient.from('user_activities').select('*').eq('user_id', userId);
            return data || [];
        }
        return new Promise(res => {
            setTimeout(() => {
                let user = MOCK_DB.users.find(u => u.id === userId);
                res(user ? user.activities : []);
            }, 300);
        });
    },

    async getLeaderboard(eventId) {
        if (supabaseClient) {
            const { data } = await supabaseClient.from('users')
                .select('name, company, total_points')
                .eq('event_id', eventId)
                .order('total_points', { ascending: false })
                .order('start_time', { ascending: true });
            return data || [];
        }
        return new Promise(res => {
            setTimeout(() => {
                let users = MOCK_DB.users.filter(u => u.event_id == eventId);
                users.sort((a, b) => b.total_points - a.total_points);
                res(users);
            }, 500);
        });
    },

    async getSurveyResults(eventId) {
        if (supabaseClient) {
            const { data: users } = await supabaseClient.from('users').select('id, name, company').eq('event_id', eventId);
            if (!users || !users.length) return [];
            const userIds = users.map(u => u.id);
            const { data: surveys } = await supabaseClient.from('user_activities').select('user_id, metadata, created_at').eq('activity_type', 'survey').in('user_id', userIds);
            const userMap = Object.fromEntries(users.map(u => [u.id, u]));
            return (surveys || []).map(s => ({ ...s, user: userMap[s.user_id] }));
        }
        return [];
    },
};

window.dbAPI = dbAPI;

// Helper: normalize sponsor field names (Supabase uses logo_url, correct_option)
function normalizeSponsor(s) {
    return {
        ...s,
        logo: s.logo_url || s.logo || '',
        correct: s.correct_option !== undefined ? s.correct_option : (s.correct || 0),
        options: Array.isArray(s.options) ? s.options : JSON.parse(s.options || '[]')
    };
}

const CHALLENGES_CONFIG = [
    { type: 'social',    title: 'Foto en redes',          desc: 'Sube una foto etiquetando a ALAS',       pts: 50,  icon: 'ph-camera' },
    { type: 'colleague', title: 'Foto con colega',         desc: 'Reencuentro con un colega',              pts: 50,  icon: 'ph-users' },
    { type: 'survey',    title: 'Encuesta del evento',     desc: 'Danos tu opinión',                       pts: 100, icon: 'ph-list-numbers' },
    { type: 'card',      title: 'Tarjeta de presentación', desc: 'Fotografía la tarjeta para guardarla',   pts: 50,  icon: 'ph-address-book' },
];

const app = {
    currentUser: null,
    currentEventId: null,
    sponsors: [],
    activities: [],
    eventsList: [],

    init() {
        if (window.location.hash === '#admin' || window.location.search.includes('admin=true')) {
            document.body.classList.add('admin-mode');
            this.showView('view-admin');
        } else {
            const savedUser = localStorage.getItem('alas_user');
            if (savedUser) {
                try {
                    const parsed = JSON.parse(savedUser);
                    document.getElementById('user-name').value = parsed.name || '';
                    document.getElementById('user-company').value = parsed.company || '';
                    document.getElementById('user-email').value = parsed.email || '';
                } catch(e) {}
            }
            this.loadEvents();
        }
        document.getElementById('login-form').addEventListener('submit', (e) => this.handleLogin(e));
    },

    showView(viewId, ...args) {
        document.querySelectorAll('.view').forEach(el => {
            if (el.id !== viewId) {
                el.classList.remove('active-view');
                setTimeout(() => el.classList.add('hidden'), 300);
            }
        });
        const target = document.getElementById(viewId);
        target.classList.remove('hidden');
        setTimeout(() => target.classList.add('active-view'), 50);
        if (viewId === 'view-extra' && args.length > 0) {
            this.renderExtraChallenge(args[0]);
        }
    },

    async loadEvents() {
        try {
            const events = await dbAPI.getEvents(false); // active only
            if (events && Array.isArray(events) && events.length > 0) {
                this.eventsList = events;
                const list = document.getElementById('events-list');
                list.innerHTML = '';
                events.forEach(ev => {
                    const card = document.createElement('div');
                    card.className = 'event-card';
                    const parts = (ev.location || '').split('|');
                    const locText = parts[0] || ev.name.split(' - ')[1] || 'ALAS';
                    const emoji = parts[1] || '';
                    const eventDate = ev.date ? new Date(ev.date).toLocaleDateString() : '';
                    card.innerHTML = `
                        ${emoji ? `<span style="font-size: 32px; line-height: 1; flex-shrink: 0;">${emoji}</span>` : ''}
                        <div class="event-card-info">
                            <h3>${ev.name.split(' - ')[0].replace('Workshop', 'Encuentros Tecnológicos')}</h3>
                            <p style="text-transform: uppercase;">${locText} • ${eventDate}</p>
                        </div>
                    `;
                    card.onclick = () => {
                        this.currentEventId = ev.id;
                        document.getElementById('register-event-name').textContent = 'ENCUENTRO ' + locText.toUpperCase();
                        this.showView('view-register');
                    };
                    list.appendChild(card);
                });
            } else {
                document.getElementById('events-list').innerHTML = '<p style="color:#d9534f;text-align:center;padding:20px;font-weight:bold;font-size:12px;">No hay eventos disponibles.</p>';
            }
        } catch (e) {
            console.error("Failed to load events", e);
            document.getElementById('events-list').innerHTML = '<p style="color:#d9534f;text-align:center;padding:20px;font-weight:bold;font-size:12px;">Error: ' + e.message + '</p>';
        } finally {
            this.showView('view-events');
        }
    },

    async handleLogin(e) {
        e.preventDefault();
        const eventId = this.currentEventId;
        const name = document.getElementById('user-name').value;
        const company = document.getElementById('user-company').value;
        const email = document.getElementById('user-email').value;
        if (!eventId || !name || !email) return;
        const btn = document.getElementById('btn-submit-register');
        const origText = btn.innerHTML;
        btn.innerHTML = '<i class="ph ph-spinner ph-spin" style="font-size:24px;"></i>';
        try {
            this.currentUser = await dbAPI.loginUser(eventId, name, company, email);
            localStorage.setItem('alas_user', JSON.stringify({ name, company, email }));
            await this.loadDashboardData();
            this.showView('view-dashboard');
        } catch (e) {
            console.error("Login failed", e);
            alert("Error al iniciar sesión.");
            this.showView('view-register');
        } finally {
            btn.innerHTML = origText;
        }
    },

    async loadDashboardData() {
        const rawSponsors = await dbAPI.getSponsors(this.currentEventId);
        this.sponsors = rawSponsors.map(normalizeSponsor);
        this.activities = await dbAPI.getUserActivities(this.currentUser.id);

        document.getElementById('dash-name').textContent = this.currentUser.name;
        const currentEvent = this.eventsList.find(e => e.id === this.currentEventId);
        const eventName = currentEvent ? currentEvent.name : 'Encuentros Tecnológicos ALAS';
        document.getElementById('dash-event').textContent = eventName.replace('Workshop', 'Encuentros Tecnológicos');
        document.getElementById('dash-points').textContent = this.currentUser.total_points || 0;

        this.renderSponsors();
        this.renderChallenges();
    },

    renderSponsors() {
        const container = document.getElementById('sponsors-list');
        container.innerHTML = '';
        const tierOrder = { 'gold': 1, 'silver': 2, 'bronze': 3 };
        const sorted = [...this.sponsors].sort((a, b) => (tierOrder[a.tier] || 9) - (tierOrder[b.tier] || 9));
        sorted.forEach(s => {
            const isCompleted = this.activities.some(act =>
                (act.sponsor_id === s.id || act.sponsorId === s.id) &&
                (act.activity_type === 'sponsor_quiz' || act.type === 'sponsor_quiz')
            );
            const card = document.createElement('div');
            card.className = `sponsor-card ${isCompleted ? 'completed' : ''}`;
            if (!isCompleted) card.onclick = () => this.openQuiz(s);
            const tierName = s.tier === 'gold' ? 'ORO' : (s.tier === 'silver' ? 'PLATA' : 'BRONCE');
            card.innerHTML = `
                <img src="${s.logo}" class="sponsor-logo" alt="${s.name}" onerror="this.src='https://via.placeholder.com/50'">
                <div class="sponsor-info">
                    <h3>${s.name}</h3>
                    <p><span class="tier-badge tier-${s.tier}">${tierName}</span> • ${s.points} pts</p>
                </div>
                <div>${isCompleted
                    ? '<i class="ph ph-check-circle" style="color:#28a745;font-size:24px;"></i>'
                    : '<i class="ph ph-caret-right" style="color:var(--primary-blue);"></i>'
                }</div>
            `;
            container.appendChild(card);
        });
    },

    renderChallenges() {
        const container = document.getElementById('challenges-list');
        if (!container) return;
        container.innerHTML = '';
        CHALLENGES_CONFIG.forEach(ch => {
            const isCompleted = this.activities.some(act =>
                act.activity_type === ch.type || act.type === ch.type
            );
            const card = document.createElement('div');
            card.className = `challenge-card ${isCompleted ? 'challenge-done' : ''}`;
            if (!isCompleted) card.onclick = () => this.showView('view-extra', ch.type);
            card.innerHTML = `
                <div class="challenge-icon ${isCompleted ? 'challenge-icon-done' : ''}">
                    <i class="ph ${isCompleted ? 'ph-check-bold' : ch.icon}"></i>
                </div>
                <div class="challenge-info">
                    <h3>${ch.title}</h3>
                    <p>${isCompleted ? 'Reto completado ✓' : ch.desc}</p>
                </div>
                <div class="challenge-points ${isCompleted ? 'pts-done' : ''}">
                    ${isCompleted ? '✓' : `+${ch.pts} pts`}
                </div>
            `;
            container.appendChild(card);
        });
    },

    openQuiz(sponsor) {
        document.getElementById('quiz-sponsor-name').textContent = sponsor.name;
        document.getElementById('quiz-sponsor-logo').src = sponsor.logo;
        document.getElementById('quiz-question').textContent = sponsor.question;
        const optionsContainer = document.getElementById('quiz-options');
        optionsContainer.innerHTML = '';
        const feedback = document.getElementById('quiz-feedback');
        feedback.className = 'feedback-msg hidden';
        (sponsor.options || []).forEach((optText, index) => {
            const btn = document.createElement('button');
            btn.className = 'quiz-option';
            btn.textContent = optText;
            btn.onclick = () => this.submitQuiz(sponsor, index, btn);
            optionsContainer.appendChild(btn);
        });
        this.showView('view-sponsor');
    },

    async submitQuiz(sponsor, selectedIndex, btnElement) {
        const btns = document.querySelectorAll('.quiz-option');
        btns.forEach(b => b.disabled = true);
        const feedback = document.getElementById('quiz-feedback');
        feedback.classList.remove('hidden');
        if (selectedIndex === sponsor.correct) {
            btnElement.classList.add('correct');
            feedback.textContent = `¡Correcto! Has ganado ${sponsor.points} puntos.`;
            feedback.className = 'feedback-msg success';
            await dbAPI.registerActivity(this.currentUser.id, 'sponsor_quiz', sponsor.points, sponsor.id);
            this.currentUser.total_points += sponsor.points;
            setTimeout(() => { this.loadDashboardData(); this.showView('view-dashboard'); }, 2000);
        } else {
            btnElement.classList.add('wrong');
            btns[sponsor.correct].classList.add('correct');
            feedback.textContent = 'Respuesta incorrecta. ¡Sigue intentando con otros patrocinadores!';
            feedback.className = 'feedback-msg error';
            await dbAPI.registerActivity(this.currentUser.id, 'sponsor_quiz', 0, sponsor.id);
            setTimeout(() => { this.loadDashboardData(); this.showView('view-dashboard'); }, 3000);
        }
    },

    renderExtraChallenge(type) {
        const titleEl = document.getElementById('extra-title');
        const contentEl = document.getElementById('extra-content');
        contentEl.innerHTML = '';
        const isCompleted = this.activities.some(act => act.activity_type === type || act.type === type);
        if (isCompleted) {
            titleEl.textContent = 'Reto completado';
            contentEl.innerHTML = `
                <i class="ph ph-check-circle" style="font-size:80px;color:#28a745;margin-bottom:20px;"></i>
                <h3 style="text-align:center;">Ya completaste este reto.</h3>
                <button class="btn btn-primary mt-4" onclick="app.showView('view-dashboard')">Volver</button>
            `;
            return;
        }
        const cfg = CHALLENGES_CONFIG.find(c => c.type === type) || {};
        if (type === 'survey') {
            titleEl.textContent = 'Encuesta del evento';
            contentEl.innerHTML = `
                <div class="survey-section"><p>A. Salón de exposiciones y conferencias</p>
                    <div class="stars" id="stars-A">
                        <i class="ph-fill ph-star" onclick="app.rate('A',1)"></i><i class="ph-fill ph-star" onclick="app.rate('A',2)"></i><i class="ph-fill ph-star" onclick="app.rate('A',3)"></i><i class="ph-fill ph-star" onclick="app.rate('A',4)"></i><i class="ph-fill ph-star" onclick="app.rate('A',5)"></i>
                    </div>
                </div>
                <div class="survey-section"><p>B. Evaluación de las charlas</p>
                    <div class="stars" id="stars-B">
                        <i class="ph-fill ph-star" onclick="app.rate('B',1)"></i><i class="ph-fill ph-star" onclick="app.rate('B',2)"></i><i class="ph-fill ph-star" onclick="app.rate('B',3)"></i><i class="ph-fill ph-star" onclick="app.rate('B',4)"></i><i class="ph-fill ph-star" onclick="app.rate('B',5)"></i>
                    </div>
                </div>
                <div class="survey-section"><p>C. Evento en general</p>
                    <div class="stars" id="stars-C">
                        <i class="ph-fill ph-star" onclick="app.rate('C',1)"></i><i class="ph-fill ph-star" onclick="app.rate('C',2)"></i><i class="ph-fill ph-star" onclick="app.rate('C',3)"></i><i class="ph-fill ph-star" onclick="app.rate('C',4)"></i><i class="ph-fill ph-star" onclick="app.rate('C',5)"></i>
                    </div>
                </div>
                <div class="survey-section"><p>D. Opinión</p><textarea placeholder="Escribe tu opinión aquí..."></textarea></div>
                <button class="btn btn-primary mt-4" onclick="app.submitSurvey()">Enviar encuesta (+100 pts)</button>
            `;
            return;
        }
        // Tarjeta de presentación — guardar en galería
        if (type === 'card') {
            this._pendingShareFile = null;
            titleEl.textContent = cfg.title;
            contentEl.innerHTML = `
                <div class="glass-card" style="margin-top:20px;text-align:center;">
                    <i class="ph ph-address-book" style="font-size:56px;color:var(--primary-blue);margin-bottom:8px;"></i>
                    <p style="margin-bottom:20px;color:#8fa0ba;font-size:13px;">${cfg.desc}</p>
                    <div id="photo-preview-wrap" style="display:none;margin-bottom:16px;">
                        <img id="photo-preview-img" style="width:100%;max-height:200px;object-fit:cover;border-radius:12px;border:2px solid #e6f0ff;">
                    </div>
                    <input type="file" id="challenge-photo-input" accept="image/*" style="display:none;" onchange="app.onPhotoSelected(this,'card',${cfg.pts||50})">
                    <button id="btn-pick-photo" class="btn btn-secondary" style="width:100%;" onclick="document.getElementById('challenge-photo-input').click()">
                        <i class="ph ph-camera"></i>&nbsp; Fotografiar tarjeta
                    </button>
                    <button id="btn-share-photo" class="btn btn-primary mt-4 hidden" style="width:100%;background:linear-gradient(135deg,#1a4ef5,#7b2ff7);" onclick="app.saveCard(${cfg.pts||50})">
                        <i class="ph ph-floppy-disk"></i>&nbsp; Guardar en galería (+${cfg.pts||50} pts)
                    </button>
                    <p id="share-fallback-msg" class="hidden" style="font-size:11px;color:#8fa0ba;margin-top:10px;">Descarga la imagen para guardarla en tu dispositivo.</p>
                </div>
            `;
            return;
        }
        // Foto en redes / Foto con colega — Web Share API
        this._pendingShareFile = null;
        titleEl.textContent = cfg.title || 'Reto';
        contentEl.innerHTML = `
            <div class="glass-card" style="margin-top:20px;text-align:center;">
                <i class="ph ${cfg.icon}" style="font-size:56px;color:var(--primary-blue);margin-bottom:8px;"></i>
                <p style="margin-bottom:20px;color:#8fa0ba;font-size:13px;">${cfg.desc || ''}</p>
                <div id="photo-preview-wrap" style="display:none;margin-bottom:16px;">
                    <img id="photo-preview-img" style="width:100%;max-height:200px;object-fit:cover;border-radius:12px;border:2px solid #e6f0ff;">
                </div>
                <input type="file" id="challenge-photo-input" accept="image/*" style="display:none;" onchange="app.onPhotoSelected(this,'${type}',${cfg.pts||50})">
                <button id="btn-pick-photo" class="btn btn-secondary" style="width:100%;" onclick="document.getElementById('challenge-photo-input').click()">
                    <i class="ph ph-camera"></i>&nbsp; Seleccionar / Tomar foto
                </button>
                <button id="btn-share-photo" class="btn btn-primary mt-4 hidden" style="width:100%;background:linear-gradient(135deg,#1a4ef5,#7b2ff7);" onclick="app.sharePhoto('${type}',${cfg.pts||50})">
                    <i class="ph ph-share-network"></i>&nbsp; Publicar y ganar +${cfg.pts||50} pts
                </button>
                <p id="share-fallback-msg" class="hidden" style="font-size:11px;color:#8fa0ba;margin-top:10px;">Comparte la imagen manualmente y luego pulsa el botón para registrar tus puntos.</p>
            </div>
        `;
    },

    onPhotoSelected(input, type, pts) {
        const file = input.files[0];
        if (!file) return;
        this._pendingShareFile = file;
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('photo-preview-img').src = e.target.result;
            document.getElementById('photo-preview-wrap').style.display = 'block';
        };
        reader.readAsDataURL(file);
        document.getElementById('btn-share-photo').classList.remove('hidden');
        document.getElementById('btn-pick-photo').innerHTML = '<i class="ph ph-camera"></i>&nbsp; Cambiar foto';
    },

    async sharePhoto(type, pts) {
        const file = this._pendingShareFile;
        if (!file) return;
        const texts = {
            social:    { title: '¡En los Encuentros Tecnológicos ALAS! 🚀', text: 'Participando en los Encuentros Tecnológicos ALAS. #EncuentrosALAS #Tecnología' },
            colleague: { title: '¡Reencuentro en ALAS! 🤝',                 text: 'Genial reencontrarme con colegas. #EncuentrosALAS' },
            card:      { title: 'Nuevos contactos en ALAS 📇',              text: 'Ampliando mi red en los Encuentros Tecnológicos ALAS. #EncuentrosALAS' },
        };
        const data = texts[type] || texts.social;
        const btn = document.getElementById('btn-share-photo');

        // Sin Web Share API → fallback manual
        if (!navigator.share) {
            document.getElementById('share-fallback-msg').classList.remove('hidden');
            btn.innerHTML = `<i class="ph ph-check-circle"></i>&nbsp; Ya compartí · +${pts} pts`;
            btn.onclick = () => this.completeExtra(type, pts);
            return;
        }

        btn.disabled = true;
        btn.innerHTML = '<i class="ph ph-circle-notch"></i>&nbsp; Abriendo…';

        // Construir payload una sola vez (canShare evita el doble-share que rompe el gesto en iOS Safari)
        const payload = { title: data.title, text: data.text };
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            payload.files = [file];
        }

        try {
            await navigator.share(payload);
            await this.completeExtra(type, pts);
        } catch (err) {
            btn.disabled = false;
            if (err.name === 'AbortError') {
                // Usuario canceló el menú nativo — restaurar botón
                btn.innerHTML = `<i class="ph ph-share-network"></i>&nbsp; Publicar y ganar +${pts} pts`;
            } else {
                // Error inesperado → fallback manual
                document.getElementById('share-fallback-msg').classList.remove('hidden');
                btn.innerHTML = `<i class="ph ph-check-circle"></i>&nbsp; Ya compartí · +${pts} pts`;
                btn.onclick = () => this.completeExtra(type, pts);
            }
        }
    },

    submitSurvey() {
        const getRating = (section) => {
            const el = document.getElementById(`stars-${section}`);
            if (!el) return 0;
            return [...el.children].filter(s => s.classList.contains('active')).length;
        };
        const textarea = document.querySelector('#extra-content textarea');
        const metadata = {
            a: getRating('A'),
            b: getRating('B'),
            c: getRating('C'),
            d: textarea ? textarea.value.trim() : ''
        };
        this.completeExtra('survey', 100, null, metadata);
    },

    rate(section, value) {
        const stars = document.getElementById(`stars-${section}`).children;
        for (let i = 0; i < 5; i++) {
            if (i < value) stars[i].classList.add('active');
            else stars[i].classList.remove('active');
        }
    },

    async saveCard(pts) {
        const file = this._pendingShareFile;
        if (!file) return;
        const btn = document.getElementById('btn-share-photo');

        // En iOS/Android con Web Share API + soporte de archivos → menú nativo con "Guardar imagen"
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            btn.disabled = true;
            btn.innerHTML = '<i class="ph ph-circle-notch"></i>&nbsp; Guardando…';
            try {
                await navigator.share({ files: [file], title: 'Tarjeta de contacto' });
                await this.completeExtra('card', pts, 'Hemos guardado esta tarjeta de contacto en tu galería.');
                return;
            } catch (err) {
                btn.disabled = false;
                if (err.name === 'AbortError') {
                    btn.innerHTML = `<i class="ph ph-floppy-disk"></i>&nbsp; Guardar en galería (+${pts} pts)`;
                    return;
                }
            }
        }

        // Fallback: descarga directa (Android Chrome / desktop)
        try {
            const url = URL.createObjectURL(file);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'tarjeta-contacto.jpg';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 100);
        } catch(e) { /* ignore */ }

        await this.completeExtra('card', pts, 'Hemos guardado esta tarjeta de contacto en tu galería.');
    },

    async completeExtra(type, points, customMsg = null, metadata = null) {
        this.showView('view-loading');
        try {
            await dbAPI.registerActivity(this.currentUser.id, type, points, null, metadata);
        } catch(e) {
            console.error('registerActivity error', e);
        }
        // Actualizar estado local inmediatamente — garantiza que los checkmarks aparezcan
        this.currentUser.total_points += points;
        if (!this.activities.some(a => (a.activity_type || a.type) === type)) {
            this.activities.push({ activity_type: type, type, points });
        }
        this.renderChallenges();
        const ptsEl = document.getElementById('dash-points');
        if (ptsEl) ptsEl.textContent = this.currentUser.total_points;

        const msg = customMsg || 'Los puntos han sido acreditados a tu cuenta.';
        document.getElementById('extra-title').textContent = 'Reto completado';
        document.getElementById('extra-content').innerHTML = `
            <div style="display:flex;flex-direction:column;align-items:center;gap:24px;padding:48px 24px;text-align:center;">
                <div style="width:96px;height:96px;border-radius:50%;background:linear-gradient(135deg,#28a745,#20c997);display:flex;align-items:center;justify-content:center;box-shadow:0 8px 32px rgba(40,167,69,0.35);">
                    <i class="ph ph-check-bold" style="font-size:48px;color:#fff;"></i>
                </div>
                <div>
                    <h2 style="margin:0 0 6px;font-size:22px;">¡Reto completado!</h2>
                    <p style="margin:0;color:#8fa0ba;font-size:13px;">${msg}</p>
                </div>
                <div style="background:linear-gradient(135deg,#1a4ef5,#7b2ff7);border-radius:20px;padding:22px 48px;box-shadow:0 8px 32px rgba(26,78,245,0.35);">
                    <p style="margin:0;color:rgba(255,255,255,0.65);font-size:11px;text-transform:uppercase;letter-spacing:2px;">Puntos ganados</p>
                    <p style="margin:6px 0 0;color:#fff;font-size:56px;font-weight:900;line-height:1;">+${points}</p>
                </div>
                <button class="btn btn-primary" style="width:100%;margin-top:8px;" onclick="app.showView('view-dashboard')">
                    <i class="ph ph-trophy"></i>&nbsp; Ver mi puntaje
                </button>
            </div>
        `;
        this.showView('view-extra');
    }
};

window.addEventListener('DOMContentLoaded', () => { app.init(); });
