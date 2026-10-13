const resourceConfig = {
  projects: { title: 'Projects', description: 'Manage products and projects shown on your website.', fields: [ ['name','Project name','text',true], ['slug','URL slug (lowercase-hyphens)','text',true], ['description','Description','textarea',false], ['status','Status label','text',false], ['website_url','Website URL','url',false], ['screenshot_url','Screenshot image URL','url',false], ['display_order','Display order','number',false], ['is_published','Published','checkbox',false] ] },
  team_members: { title: 'Developers & team', description: 'Manage public team profiles and social links.', fields: [ ['name','Name','text',true], ['role','Role','text',true], ['bio','Biography','textarea',false], ['image_url','Profile image URL','url',false], ['highlights','Highlights (one per line)','textarea',false], ['social_links','Social links (Label | URL, one per line)','textarea',false], ['display_order','Display order','number',false], ['is_published','Published','checkbox',false] ] },
  testimonials: { title: 'Testimonials', description: 'Manage customer testimonials.', fields: [ ['author_name','Author name','text',true], ['author_role','Author role','text',false], ['quote','Quote','textarea',true], ['image_url','Author image URL','url',false], ['display_order','Display order','number',false], ['is_published','Published','checkbox',false] ] },
  partners: { title: 'Partners', description: 'Manage partner organizations and logos.', fields: [ ['name','Partner name','text',true], ['description','Description','textarea',false], ['logo_url','Logo URL','url',false], ['website_url','Website URL','url',false], ['display_order','Display order','number',false], ['is_published','Published','checkbox',false] ] },
};

const state = { csrf: '', email: '', view: 'overview', resource: 'projects', editing: null, submissions: [], content: [] };
const $ = (selector) => document.querySelector(selector);
const loginView = $('#loginView');
const dashboardView = $('#dashboardView');
const pageStatus = $('#pageStatus');

function showStatus(element, message = '', kind = '') {
  element.textContent = message;
  element.className = `notice${kind ? ` ${kind}` : ''}`;
}

async function request(path, options = {}) {
  const headers = new Headers(options.headers || {});
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (options.method && !['GET','HEAD'].includes(options.method)) headers.set('X-CSRF-Token', state.csrf);
  const response = await fetch(path, { credentials: 'same-origin', ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status}).`);
  return data;
}

function showLogin(message = '') {
  dashboardView.hidden = true;
  loginView.hidden = false;
  showStatus($('#loginStatus'), message, message ? 'error' : '');
}

function showDashboard(session) {
  state.email = session.email;
  state.csrf = session.csrfToken;
  loginView.hidden = true;
  dashboardView.hidden = false;
  $('#adminEmail').textContent = session.email;
  openView('overview');
}

$('#loginForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const button = event.currentTarget.querySelector('button[type="submit"]');
  button.disabled = true;
  showStatus($('#loginStatus'), 'Signing in…');
  try {
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const session = await request('/api/admin/auth', { method: 'POST', body: JSON.stringify(values) });
    event.currentTarget.reset();
    showDashboard(session);
  } catch (error) {
    showStatus($('#loginStatus'), error.message, 'error');
  } finally {
    button.disabled = false;
  }
});

$('#logoutButton').addEventListener('click', async () => {
  try { await request('/api/admin/auth', { method: 'DELETE' }); } catch {}
  state.csrf = '';
  showLogin('You have signed out.');
});

$('#mainNav').addEventListener('click', (event) => {
  const button = event.target.closest('[data-view]');
  if (!button) return;
  openView(button.dataset.view);
  closeMobileNav();
});

function openView(view) {
  state.view = view;
  document.querySelectorAll('.nav-item[data-view]').forEach((button) => button.classList.toggle('active', button.dataset.view === view));
  document.querySelectorAll('.view-panel').forEach((panel) => { panel.hidden = true; });
  const overview = view === 'overview';
  const messages = view === 'messages';
  $('#overviewPanel').hidden = !overview;
  $('#messagesPanel').hidden = !messages;
  $('#contentPanel').hidden = overview || messages;
  if (overview) { $('#pageTitle').textContent = 'Overview'; loadOverview(); }
  else if (messages) { $('#pageTitle').textContent = 'Contact messages'; loadMessages(); }
  else if (resourceConfig[view]) { state.resource = view; $('#pageTitle').textContent = resourceConfig[view].title; loadContent(view); }
}

async function loadOverview() {
  try {
    const counts = await request('/api/admin/overview');
    const stats = [ ['✉','Messages',counts.submissions], ['◉','Unread',counts.unread], ['▧','Projects',counts.projects], ['✦','Team profiles',counts.team_members], ['❝','Testimonials',counts.testimonials], ['◇','Partners',counts.partners] ];
    $('#statsGrid').innerHTML = stats.map(([icon,label,value]) => `<article class="stat-card"><div class="stat-icon">${icon}</div><span>${escapeHtml(label)}</span><strong>${Number(value)||0}</strong></article>`).join('');
    $('#unreadBadge').hidden = !counts.unread;
    $('#unreadBadge').textContent = counts.unread;
  } catch (error) { showStatus(pageStatus, error.message, 'error'); }
}

$('#refreshMessages').addEventListener('click', loadMessages);
async function loadMessages() {
  $('#messagesList').innerHTML = '<div class="empty-state">Loading messages…</div>';
  try {
    const result = await request('/api/admin/submissions?limit=100');
    state.submissions = result.items || [];
    $('#unreadBadge').hidden = !state.submissions.some((item) => item.status === 'new');
    const unread = state.submissions.filter((item) => item.status === 'new').length;
    $('#unreadBadge').textContent = unread;
    if (!state.submissions.length) { $('#messagesList').innerHTML = '<div class="empty-state">Your inbox is clear. New website inquiries will appear here.</div>'; return; }
    $('#messagesList').replaceChildren(...state.submissions.map(renderMessage));
  } catch (error) { $('#messagesList').innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`; }
}

function renderMessage(item) {
  const card = document.createElement('article');
  card.className = 'message-card';
  const head = document.createElement('div'); head.className = 'message-head';
  const info = document.createElement('div');
  const name = document.createElement('div'); name.className = 'message-name'; name.textContent = item.name;
  const meta = document.createElement('div'); meta.className = 'message-meta';
  const emailLink = document.createElement('a'); emailLink.href = `mailto:${encodeURIComponent(item.email)}`; emailLink.textContent = item.email; emailLink.style.color = 'inherit';
  meta.append(emailLink, document.createTextNode(` · ${item.service || 'General inquiry'} · ${new Date(item.created_at).toLocaleString()}`));
  info.append(name, meta);
  const pill = document.createElement('span'); pill.className = `status-pill${item.status === 'archived' ? ' archived' : ''}`; pill.textContent = item.status === 'new' ? 'Unread' : item.status;
  head.append(info, pill);
  const message = document.createElement('p'); message.className = 'message-copy'; message.textContent = item.message;
  const actions = document.createElement('div'); actions.className = 'message-actions';
  if (item.status !== 'read') actions.append(actionButton('Mark read', () => updateMessage(item.id, 'read')));
  if (item.status !== 'new') actions.append(actionButton('Mark unread', () => updateMessage(item.id, 'new')));
  actions.append(actionButton(item.status === 'archived' ? 'Restore' : 'Archive', () => updateMessage(item.id, item.status === 'archived' ? 'new' : 'archived')));
  actions.append(actionButton('Delete', () => deleteMessage(item.id), true));
  card.append(head, message, actions);
  return card;
}

function actionButton(label, callback, danger = false) {
  const button = document.createElement('button'); button.type = 'button'; button.className = `small-button${danger ? ' danger' : ''}`; button.textContent = label; button.addEventListener('click', callback); return button;
}

async function updateMessage(id, status) {
  try { await request(`/api/admin/submissions?id=${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify({ status }) }); await loadMessages(); }
  catch (error) { showStatus(pageStatus, error.message, 'error'); }
}
async function deleteMessage(id) {
  if (!confirm('Permanently delete this contact message?')) return;
  try { await request(`/api/admin/submissions?id=${encodeURIComponent(id)}`, { method: 'DELETE' }); await loadMessages(); loadOverview(); }
  catch (error) { showStatus(pageStatus, error.message, 'error'); }
}

async function loadContent(type) {
  const config = resourceConfig[type];
  $('#contentTitle').textContent = config.title;
  $('#contentDescription').textContent = config.description;
  $('#contentList').innerHTML = '<div class="empty-state">Loading…</div>';
  try {
    const result = await request(`/api/admin/content?type=${encodeURIComponent(type)}`);
    state.content = result.items || [];
    renderContent(type);
  } catch (error) { $('#contentList').innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`; }
}

function renderContent(type) {
  const list = $('#contentList');
  if (!state.content.length) { list.innerHTML = '<div class="empty-state">No items yet. Add your first entry.</div>'; return; }
  list.replaceChildren(...state.content.map((item) => {
    const card = document.createElement('article'); card.className = 'content-card';
    const details = document.createElement('div');
    const title = document.createElement('div'); title.className = 'content-title'; title.textContent = item.name || item.author_name;
    const meta = document.createElement('div'); meta.className = 'content-meta'; meta.textContent = `${item.role || item.author_role || item.status || ''}${item.is_published ? ' · Published' : ' · Draft'}`;
    details.append(title, meta);
    const actions = document.createElement('div'); actions.className = 'content-actions';
    actions.append(actionButton(item.is_published ? 'Unpublish' : 'Publish', () => togglePublished(type,item)));
    actions.append(actionButton('Edit', () => openEditor(type,item)));
    actions.append(actionButton('Delete', () => deleteContent(type,item.id),true));
    card.append(details,actions); return card;
  }));
}

$('#addContentButton').addEventListener('click', () => openEditor(state.resource));
function openEditor(type, item = null) {
  state.resource = type; state.editing = item;
  const config = resourceConfig[type];
  $('#editorTitle').textContent = item ? `Edit ${config.title.toLowerCase().replace(/s$/,'')}` : `Add ${config.title.toLowerCase().replace(/s$/,'')}`;
  const container = $('#editorFields'); container.replaceChildren();
  for (const [key,label,kind,required] of config.fields) {
    if (kind === 'checkbox') {
      const wrapper = document.createElement('label'); wrapper.className = 'check-row wide';
      const input = document.createElement('input'); input.type = 'checkbox'; input.name = key; input.checked = Boolean(item?.[key]);
      wrapper.append(input,document.createTextNode(label)); container.append(wrapper); continue;
    }
    const wrapper = document.createElement('label'); wrapper.className = `field-label${kind === 'textarea' ? ' wide' : ''}`; wrapper.textContent = label;
    const input = kind === 'textarea' ? document.createElement('textarea') : document.createElement('input');
    input.name = key; input.className = `field-control${kind === 'textarea' ? ' textarea' : ''}`; input.required = required;
    if (kind !== 'textarea') input.type = kind;
    if (kind === 'number') input.min = '0';
    if (key === 'highlights') input.value = (item?.highlights || []).join('\n');
    else if (key === 'social_links') input.value = (item?.social_links || []).map((link) => `${link.label} | ${link.url}`).join('\n');
    else input.value = item?.[key] ?? (key === 'is_published' ? false : '');
    wrapper.append(input); container.append(wrapper);
  }
  showStatus($('#editorStatus'));
  $('#editorDialog').showModal();
}

$('#closeEditor').addEventListener('click', () => $('#editorDialog').close());
$('#cancelEditor').addEventListener('click', () => $('#editorDialog').close());
$('#editorForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const config = resourceConfig[state.resource];
  const payload = {};
  for (const [key,,kind] of config.fields) {
    if (kind === 'checkbox') payload[key] = form.has(key);
    else if (key === 'display_order') payload[key] = Number(form.get(key) || 0);
    else if (key === 'highlights') payload[key] = String(form.get(key) || '').split('\n').map((v) => v.trim()).filter(Boolean);
    else if (key === 'social_links') payload[key] = String(form.get(key) || '').split('\n').map((line) => { const [label,...url] = line.split('|'); return { label:label?.trim(), url:url.join('|').trim() }; }).filter((item) => item.label && item.url);
    else payload[key] = form.get(key) || '';
  }
  const button = event.currentTarget.querySelector('[type="submit"]'); button.disabled = true;
  showStatus($('#editorStatus'),'Saving…');
  try {
    const editing = state.editing;
    const path = `/api/admin/content?type=${encodeURIComponent(state.resource)}${editing ? `&id=${encodeURIComponent(editing.id)}` : ''}`;
    await request(path,{ method:editing ? 'PUT':'POST', body:JSON.stringify(payload) });
    $('#editorDialog').close(); await loadContent(state.resource); loadOverview();
  } catch (error) { showStatus($('#editorStatus'),error.message,'error'); }
  finally { button.disabled = false; }
});

async function togglePublished(type,item) {
  const payload = { ...item, is_published: !item.is_published };
  try { await request(`/api/admin/content?type=${encodeURIComponent(type)}&id=${encodeURIComponent(item.id)}`,{method:'PUT',body:JSON.stringify(payload)}); await loadContent(type); }
  catch(error){showStatus(pageStatus,error.message,'error');}
}
async function deleteContent(type,id) {
  if (!confirm('Delete this content permanently?')) return;
  try { await request(`/api/admin/content?type=${encodeURIComponent(type)}&id=${encodeURIComponent(id)}`,{method:'DELETE'}); await loadContent(type); loadOverview(); }
  catch(error){showStatus(pageStatus,error.message,'error');}
}

function escapeHtml(value) { return String(value).replace(/[&<>"']/g,(char)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char])); }
$('#mobileMenu').addEventListener('click', () => { $('#sidebar').classList.add('open'); $('#mobileBackdrop').classList.add('show'); });
function closeMobileNav(){ $('#sidebar').classList.remove('open'); $('#mobileBackdrop').classList.remove('show'); }
$('#mobileBackdrop').addEventListener('click',closeMobileNav);

(async function init(){
  try { const session = await request('/api/admin/auth'); showDashboard(session); }
  catch { showLogin(); }
})();
