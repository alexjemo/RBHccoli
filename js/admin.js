const adminApp = {
    isAuthenticated: false,
    eventModalMode: 'create',
    sponsorModalMode: 'create',
    editingSponsorId: null,
    selectedEventId: null,

    init() {
        document.getElementById('admin-login-form').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('admin-edit-form').addEventListener('submit', (e) => this.handleSaveEvent(e));
        document.getElementById('admin-sponsor-form').addEventListener('submit', (e) => this.handleSaveSponsor(e));
    },

    handleLogin(e) {
        e.preventDefault();
        const user = document.getElementById('admin-user').value;
        const pass = document.getElementById('admin-pass').value;
        if (user === 'alexjemo@gmail.com' && pass === '800621') {
            this.isAuthenticated = true;
            document.getElementById('admin-login-section').classList.add('hidden');
            document.getElementById('admin-dash-section').classList.remove('hidden');
            this.switchTab('events');
        } else {
            alert('Credenciales incorrectas');
        }
    },

    logout() {
        this.isAuthenticated = false;
        document.getElementById('admin-login-section').classList.remove('hidden');
        document.getElementById('admin-dash-section').classList.add('hidden');
        document.getElementById('admin-login-form').reset();
    },

    switchTab(tabName) {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', (btn.getAttribute('onclick') || '').includes(`'${tabName}'`));
        });
        const content = document.getElementById('admin-content-area');
        content.innerHTML = '';
        if (tabName === 'events') this.renderEventsTab(content);
        else if (tabName === 'sponsors') this.renderSponsorsTab(content);
        else if (tabName === 'leaderboard') this.renderLeaderboardTab(content);
    },

    // =================== EVENTS ===================
    async renderEventsTab(container) {
        container.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;">
                <div><h3 style="margin:0;">Encuentros</h3><p class="subtitle" style="margin:0;">Gestión de eventos</p></div>
                <button class="btn btn-primary" style="width:auto;padding:8px 16px;font-size:13px;" onclick="adminApp.openEventModal()">+ Nuevo</button>
            </div>
        `;
        const events = await dbAPI.getEvents(true);
        if (!events.length) { container.innerHTML += '<p style="text-align:center;color:#666;padding:20px;">No hay eventos.</p>'; return; }
        events.forEach(ev => {
            const parts = (ev.location || '').split('|');
            const locText = parts[0] || 'Sin ubicación';
            const emoji = parts[1] || '';
            const date = ev.date ? new Date(ev.date).toLocaleDateString() : 'Sin fecha';
            const isActive = ev.active !== false;
            const el = document.createElement('div');
            el.style.cssText = 'background:#fff;border-radius:12px;padding:14px 16px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;gap:10px;box-shadow:0 2px 8px rgba(0,0,0,0.05);opacity:' + (isActive ? '1' : '0.55') + ';';
            el.innerHTML = `
                <div style="flex:1;min-width:0;">
                    <div style="font-weight:700;font-size:14px;color:#0b1a30;">${emoji} ${ev.name.replace('Workshop','Encuentros Tecnológicos')}</div>
                    <div style="font-size:11px;color:#8fa0ba;margin-top:2px;">${locText} • ${date}</div>
                    <span style="display:inline-block;margin-top:4px;font-size:10px;padding:2px 8px;border-radius:10px;background:${isActive?'#d4edda':'#f8d7da'};color:${isActive?'#155724':'#721c24'};">${isActive?'● Activo':'○ Inactivo'}</span>
                </div>
                <div style="display:flex;flex-direction:column;gap:6px;flex-shrink:0;">
                    <button style="padding:5px 12px;border:none;border-radius:8px;background:#e6f0ff;color:#0056b3;font-size:12px;font-weight:600;cursor:pointer;" onclick='adminApp.openEventModal(${JSON.stringify(ev).replace(/'/g,"&#39;")})'>Editar</button>
                    <button style="padding:5px 12px;border:none;border-radius:8px;background:${isActive?'#f8d7da':'#d4edda'};color:${isActive?'#721c24':'#155724'};font-size:12px;font-weight:600;cursor:pointer;" onclick="adminApp.toggleEventActive(${ev.id}, ${isActive})">${isActive?'Desactivar':'Activar'}</button>
                </div>
            `;
            container.appendChild(el);
        });
    },

    openEventModal(ev = null) {
        this.eventModalMode = ev ? 'edit' : 'create';
        document.getElementById('edit-modal-title').textContent = ev ? 'Editar Evento' : 'Nuevo Evento';
        document.getElementById('edit-event-id').value = ev ? ev.id : '';
        document.getElementById('edit-event-name').value = ev ? ev.name.replace('Workshop','Encuentros Tecnológicos') : '';
        if (ev && ev.location) {
            const parts = ev.location.split('|');
            const locParts = (parts[0] || '').split(', ');
            document.getElementById('edit-event-city').value = locParts[0] || '';
            document.getElementById('edit-event-country').value = locParts[1] || '';
            document.getElementById('edit-event-emoji').value = parts[1] || '';
        } else {
            document.getElementById('edit-event-city').value = '';
            document.getElementById('edit-event-country').value = '';
            document.getElementById('edit-event-emoji').value = '';
        }
        const d = ev && ev.date ? new Date(ev.date) : new Date();
        document.getElementById('edit-event-date').value = new Date(d.getTime() - d.getTimezoneOffset()*60000).toISOString().slice(0,16);
        document.getElementById('admin-edit-modal').classList.remove('hidden');
    },

    async handleSaveEvent(e) {
        e.preventDefault();
        const id = document.getElementById('edit-event-id').value;
        const name = document.getElementById('edit-event-name').value;
        const city = document.getElementById('edit-event-city').value;
        const country = document.getElementById('edit-event-country').value;
        const emoji = document.getElementById('edit-event-emoji').value;
        const date = document.getElementById('edit-event-date').value;
        let location = country ? `${city}, ${country}` : city;
        if (emoji) location += `|${emoji}`;
        const dateIso = new Date(date).toISOString();
        const btn = document.getElementById('btn-save-event');
        const orig = btn.textContent; btn.textContent = 'Guardando...'; btn.disabled = true;
        try {
            if (this.eventModalMode === 'edit') await dbAPI.updateEvent(id, name, location, dateIso);
            else await dbAPI.createEvent(name, location, dateIso);
            alert(this.eventModalMode === 'edit' ? 'Evento actualizado.' : 'Evento creado.');
            document.getElementById('admin-edit-modal').classList.add('hidden');
            const c = document.getElementById('admin-content-area'); c.innerHTML = '';
            this.renderEventsTab(c);
        } catch(err) {
            console.error(err);
            alert('Error al guardar. Verifica permisos RLS en Supabase (INSERT / UPDATE en events).');
        } finally { btn.textContent = orig; btn.disabled = false; }
    },

    async toggleEventActive(id, currentState) {
        try {
            await dbAPI.toggleEventActive(id, !currentState);
            const c = document.getElementById('admin-content-area'); c.innerHTML = '';
            this.renderEventsTab(c);
        } catch(err) { alert('Error al cambiar estado del evento.'); }
    },

    // =================== SPONSORS ===================
    async renderSponsorsTab(container) {
        const events = await dbAPI.getEvents(true);
        container.innerHTML = `
            <div style="margin-bottom:15px;">
                <h3 style="margin:0 0 4px 0;">Sponsors por Evento</h3>
                <p class="subtitle" style="margin:0 0 10px 0;">Selecciona un evento para gestionar sus sponsors</p>
                <select id="sponsor-event-selector" onchange="adminApp.loadSponsorsForEvent(this.value)"
                    style="width:100%;padding:10px;border:1px solid #ccc;border-radius:8px;font-size:13px;">
                    <option value="">-- Selecciona un evento --</option>
                    ${events.map(ev => `<option value="${ev.id}" ${this.selectedEventId == ev.id ? 'selected' : ''}>${ev.name.replace('Workshop','Encuentros Tecnológicos')}</option>`).join('')}
                </select>
            </div>
            <div id="sponsors-admin-list"></div>
        `;
        if (this.selectedEventId) this.loadSponsorsForEvent(this.selectedEventId);
    },

    async loadSponsorsForEvent(eventId) {
        if (!eventId) return;
        this.selectedEventId = eventId;
        const list = document.getElementById('sponsors-admin-list');
        list.innerHTML = '<p style="text-align:center;color:#666;padding:20px;">Cargando...</p>';
        const sponsors = await dbAPI.getSponsorsAdmin(eventId);
        list.innerHTML = '';

        sponsors.forEach(s => {
            const isActive = s.active !== false;
            const logo = s.logo_url || s.logo || '';
            const tier = s.tier || 'bronze';
            const tierColors = {gold:'#B8860B',silver:'#696969',bronze:'#8B4513'};
            const tierBg = {gold:'rgba(255,215,0,0.15)',silver:'rgba(192,192,192,0.2)',bronze:'rgba(205,127,50,0.15)'};
            const el = document.createElement('div');
            el.style.cssText = `background:#fff;border-radius:12px;padding:12px;margin-bottom:10px;display:flex;gap:12px;align-items:flex-start;box-shadow:0 2px 8px rgba(0,0,0,0.05);opacity:${isActive?'1':'0.55'};`;
            el.innerHTML = `
                <img src="${logo||'https://via.placeholder.com/50'}" onerror="this.src='https://via.placeholder.com/50'" style="width:44px;height:44px;border-radius:50%;object-fit:cover;flex-shrink:0;">
                <div style="flex:1;min-width:0;">
                    <div style="font-weight:700;font-size:13px;">${s.name}</div>
                    <div style="margin:3px 0;"><span style="font-size:10px;padding:2px 7px;border-radius:8px;font-weight:700;background:${tierBg[tier]};color:${tierColors[tier]};">${tier.toUpperCase()}</span> <span style="font-size:11px;color:#666;">• ${s.points} pts</span></div>
                    <div style="font-size:11px;color:#888;margin-top:2px;">${s.question||'Sin pregunta'}</div>
                    <span style="display:inline-block;margin-top:4px;font-size:10px;padding:2px 6px;border-radius:8px;background:${isActive?'#d4edda':'#f8d7da'};color:${isActive?'#155724':'#721c24'};">${isActive?'● Activo':'○ Inactivo'}</span>
                </div>
                <div style="display:flex;flex-direction:column;gap:6px;flex-shrink:0;">
                    <button style="padding:5px 12px;border:none;border-radius:8px;background:#e6f0ff;color:#0056b3;font-size:11px;font-weight:600;cursor:pointer;" onclick='adminApp.openSponsorModal(${JSON.stringify(s).replace(/'/g,"&#39;")})'>Editar</button>
                    <button style="padding:5px 12px;border:none;border-radius:8px;background:${isActive?'#f8d7da':'#d4edda'};color:${isActive?'#721c24':'#155724'};font-size:11px;font-weight:600;cursor:pointer;" onclick="adminApp.toggleSponsorActive(${s.id}, ${isActive})">${isActive?'Desact.':'Activar'}</button>
                </div>
            `;
            list.appendChild(el);
        });

        const addBtn = document.createElement('button');
        addBtn.className = 'btn btn-primary mt-4';
        addBtn.textContent = '+ Agregar Sponsor';
        addBtn.onclick = () => this.openSponsorModal(null, eventId);
        list.appendChild(addBtn);
    },

    openSponsorModal(sponsor = null, eventId = null) {
        this.sponsorModalMode = sponsor ? 'edit' : 'create';
        this.editingSponsorId = sponsor ? sponsor.id : null;
        document.getElementById('sponsor-modal-title').textContent = sponsor ? 'Editar Sponsor' : 'Nuevo Sponsor';
        document.getElementById('edit-sponsor-event-id').value = sponsor ? sponsor.event_id : (eventId || this.selectedEventId);
        document.getElementById('edit-sponsor-name').value = sponsor ? sponsor.name : '';
        document.getElementById('edit-sponsor-tier').value = sponsor ? (sponsor.tier || 'bronze') : 'bronze';
        document.getElementById('edit-sponsor-points').value = sponsor ? sponsor.points : 100;
        document.getElementById('edit-sponsor-question').value = sponsor ? (sponsor.question || '') : '';

        const opts = sponsor ? (Array.isArray(sponsor.options) ? sponsor.options : (()=>{ try{return JSON.parse(sponsor.options||'[]')}catch(e){return[]} })()) : ['', '', ''];
        document.getElementById('edit-sponsor-opt1').value = opts[0] || '';
        document.getElementById('edit-sponsor-opt2').value = opts[1] || '';
        document.getElementById('edit-sponsor-opt3').value = opts[2] || '';
        const correct = sponsor ? (sponsor.correct_option !== undefined ? sponsor.correct_option : (sponsor.correct || 0)) : 0;
        document.getElementById('edit-sponsor-correct').value = String(correct);

        const logoSrc = sponsor ? (sponsor.logo_url || sponsor.logo || '') : '';
        const preview = document.getElementById('sponsor-logo-preview');
        document.getElementById('edit-sponsor-logo-file').value = '';
        document.getElementById('edit-sponsor-logo-current').value = logoSrc;
        if (logoSrc) { preview.src = logoSrc; preview.style.display = 'block'; }
        else { preview.src = ''; preview.style.display = 'none'; }

        document.getElementById('admin-sponsor-modal').classList.remove('hidden');
    },

    handleLogoFile(input) {
        const file = input.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const preview = document.getElementById('sponsor-logo-preview');
            preview.src = e.target.result;
            preview.style.display = 'block';
            document.getElementById('edit-sponsor-logo-current').value = e.target.result;
        };
        reader.readAsDataURL(file);
    },

    async handleSaveSponsor(e) {
        e.preventDefault();
        const eventId = document.getElementById('edit-sponsor-event-id').value;
        const name = document.getElementById('edit-sponsor-name').value;
        const tier = document.getElementById('edit-sponsor-tier').value;
        const points = parseInt(document.getElementById('edit-sponsor-points').value) || 0;
        const question = document.getElementById('edit-sponsor-question').value;
        const opt1 = document.getElementById('edit-sponsor-opt1').value;
        const opt2 = document.getElementById('edit-sponsor-opt2').value;
        const opt3 = document.getElementById('edit-sponsor-opt3').value;
        const correct = parseInt(document.getElementById('edit-sponsor-correct').value) || 0;
        const logoUrl = document.getElementById('edit-sponsor-logo-current').value;
        const options = [opt1, opt2, opt3];

        const btn = document.getElementById('btn-save-sponsor');
        const orig = btn.textContent; btn.textContent = 'Guardando...'; btn.disabled = true;
        try {
            if (this.sponsorModalMode === 'edit') {
                await dbAPI.updateSponsor(this.editingSponsorId, name, logoUrl, tier, question, options, correct, points);
                alert('Sponsor actualizado.');
            } else {
                await dbAPI.createSponsor(eventId, name, logoUrl, tier, question, options, correct, points);
                alert('Sponsor creado.');
            }
            document.getElementById('admin-sponsor-modal').classList.add('hidden');
            this.loadSponsorsForEvent(eventId);
        } catch(err) {
            console.error(err);
            alert('Error al guardar sponsor. Verifica permisos RLS (INSERT / UPDATE en sponsors).');
        } finally { btn.textContent = orig; btn.disabled = false; }
    },

    async toggleSponsorActive(id, currentState) {
        try {
            await dbAPI.toggleSponsorActive(id, !currentState);
            this.loadSponsorsForEvent(this.selectedEventId);
        } catch(err) { alert('Error al cambiar estado del sponsor.'); }
    },

    // =================== LEADERBOARD ===================
    async renderLeaderboardTab(container) {
        const events = await dbAPI.getEvents(true);
        container.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;">
                <h3 style="margin:0;">Leaderboard</h3>
                <button class="btn btn-secondary" style="width:auto;padding:5px 10px;" onclick="adminApp.loadLeaderboardForEvent(document.getElementById('lb-event-selector').value)"><i class="ph ph-arrows-clockwise"></i></button>
            </div>
            <select id="lb-event-selector" onchange="adminApp.loadLeaderboardForEvent(this.value)"
                style="width:100%;padding:10px;border:1px solid #ccc;border-radius:8px;font-size:13px;margin-bottom:15px;">
                <option value="">-- Selecciona un evento --</option>
                ${events.map(ev => `<option value="${ev.id}">${ev.name.replace('Workshop','Encuentros Tecnológicos')}</option>`).join('')}
            </select>
            <div id="lb-list"></div>
        `;
    },

    async loadLeaderboardForEvent(eventId) {
        if (!eventId) return;
        const list = document.getElementById('lb-list');
        list.innerHTML = '<p style="text-align:center;color:#666;">Cargando...</p>';
        const users = await dbAPI.getLeaderboard(eventId);
        list.innerHTML = '';
        if (!users.length) { list.innerHTML = '<p style="text-align:center;color:#666;">No hay usuarios registrados.</p>'; return; }
        users.forEach((u, i) => {
            const el = document.createElement('div');
            el.className = 'leaderboard-item';
            el.innerHTML = `
                <div class="lb-rank">#${i+1}</div>
                <div class="lb-info"><div class="lb-name">${u.name}</div><div class="lb-company">${u.company||''}</div></div>
                <div class="lb-points">${u.total_points} pts</div>
            `;
            list.appendChild(el);
        });
    }
};

window.addEventListener('DOMContentLoaded', () => { adminApp.init(); });
