'use strict';

function daysSince(ts){
  if(!ts) return 0;
  return (Date.now() - ts) / 86400000;
}

function getTimePart(h){
  if(h < 5) return 'evening';
  if(h < 12) return 'morning';
  if(h < 17) return 'afternoon';
  return 'evening';
}

function isMorningHour(h){ return h >= 5 && h < 12; }
function isEveningHour(h){ return h >= 17 || h < 5; }

function homeSubState(h, daysAway){
  if(daysAway >= RETURN_AFTER_DAYS){
    return { text: 'Welcome back — no streak lost, just pick up gently.', action: null };
  }
  if(isMorningHour(h)){
    return { text: 'Begin with today\'s reflection?', action: 'reflect' };
  }
  if(isEveningHour(h)){
    return { text: 'Capture your day in your journal?', action: 'journal' };
  }
  return { text: SITE.homeTagline, action: null };
}

function homeSubClick(action){
  if(action === 'reflect') openDailyToday();
  else if(action === 'journal') go('journal');
}

function homeSubActionLabel(action){
  return action === 'reflect' ? 'Reflect' : action === 'journal' ? 'Journal' : '';
}

function renderHomeSub(h){
  const subEl = document.getElementById('homeSub');
  if(!subEl) return;
  const state = homeSubState(h, sessionDaysAway);
  subEl.textContent = state.text;
  subEl.classList.toggle('is-action', !!state.action);
  if(state.action){
    subEl.setAttribute('role', 'button');
    subEl.tabIndex = 0;
    subEl.setAttribute('aria-label', state.text + ' — open ' + homeSubActionLabel(state.action));
    subEl.onclick = () => homeSubClick(state.action);
    subEl.onkeydown = e => {
      if(e.key === 'Enter' || e.key === ' '){
        e.preventDefault();
        homeSubClick(state.action);
      }
    };
  }else{
    subEl.removeAttribute('role');
    subEl.removeAttribute('aria-label');
    subEl.tabIndex = -1;
    subEl.onclick = null;
    subEl.onkeydown = null;
  }
}

let sessionDaysAway = 0;

function initLastSeen(){
  sessionDaysAway = daysSince(store.get('lastSeenAt', null));
  store.set('lastSeenAt', Date.now());
}

/* ───────── Navigation ───────── */
function isJournalFlowActive(){
  return document.getElementById('screen-journal')?.classList.contains('active')
    || document.getElementById('screen-journal-entry')?.classList.contains('active');
}

function go(name){
  ensureDailyContent();
  const wasJournal = isJournalFlowActive();
  if(wasJournal && name !== 'journal' && name !== 'journal-entry'){
    lockJournal();
    clearTimeout(journalIdleTimer);
  }
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-'+name).classList.add('active');
  document.querySelectorAll('nav button').forEach(b => b.classList.toggle('sel', b.dataset.s === name));
  const screen = document.getElementById('screen-'+name);
  screen.scrollTop = 0;
  if(name === 'home') renderHome();
  if(name === 'journal'){
    activeJournalEntryId = null;
    updateJournalAccess();
    bumpJournalActivity();
  }
  if(name === 'journal-entry') bumpJournalActivity();
  if(name === 'tools'){
    mountSoundPickers();
    initToolSound();
    initRest();
    renderGround();
  }
  if(name === 'daily') renderDaily();
  if(name === 'calm') renderCalm();
  if(name === 'checkin'){
    buildCheckin();
    syncCheckinForm();
    renderMoodTrend(store.get('checkins', []));
    renderCalmTeaser();
  }
  if(name === 'connect') updateInstallUI();
  if(name !== 'tools') stopBreath();
}

function toast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.remove('toast-update');
  t.style.pointerEvents = '';
  t.onclick = null;
  t.classList.add('show');
  clearTimeout(t._h);
  t._h = setTimeout(() => t.classList.remove('show'), 2600);
}

function checkPendingAppUpdate(reg){
  if(!reg?.waiting || !navigator.serviceWorker.controller) return;
  showAppUpdatePrompt();
}

function applyAppUpdate(){
  navigator.serviceWorker.getRegistration().then(reg => {
    if(reg && reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
    else window.location.reload();
  });
}

function showAppUpdatePrompt(){
  const t = document.getElementById('toast');
  if(!t) return;
  if(t.classList.contains('toast-update') && t.classList.contains('show')) return;
  clearTimeout(t._h);
  t.textContent = 'Update ready — tap to refresh';
  t.classList.add('show', 'toast-update');
  t.style.pointerEvents = 'auto';
  t.onclick = () => {
    t.classList.remove('show', 'toast-update');
    t.style.pointerEvents = '';
    t.onclick = null;
    applyAppUpdate();
  };
}

function pollServiceWorkerUpdate(){
  if(document.visibilityState !== 'visible') return;
  navigator.serviceWorker.getRegistration().then(reg => {
    if(!reg) return;
    reg.update().catch(() => {});
    checkPendingAppUpdate(reg);
  });
}

function initServiceWorker(){
  if(!('serviceWorker' in navigator)) return;

  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if(refreshing) return;
    refreshing = true;
    window.location.reload();
  });

  const watchForWaiting = reg => {
    checkPendingAppUpdate(reg);
    reg.addEventListener('updatefound', () => {
      const worker = reg.installing;
      if(!worker) return;
      worker.addEventListener('statechange', () => {
        if(worker.state === 'installed') checkPendingAppUpdate(reg);
      });
    });
  };

  navigator.serviceWorker.register('sw.js')
    .then(reg => {
      watchForWaiting(reg);
      setTimeout(() => reg.update().catch(() => {}), 5000);
    })
    .catch(() => {});

  document.addEventListener('visibilitychange', () => {
    if(document.visibilityState === 'visible') pollServiceWorkerUpdate();
  });

  window.addEventListener('pageshow', () => {
    setTimeout(pollServiceWorkerUpdate, 3000);
  });

  setInterval(pollServiceWorkerUpdate, 30 * 60 * 1000);
}

/* ───────── Privacy notice ───────── */
function privacyAccepted(){
  return store.get('privacyAcceptedVersion') === SITE.privacy.noticeVersion;
}

function showPrivacyNotice(reviewOnly){
  applyPrivacyNoticeCopy();
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-privacy').classList.add('active');
  document.querySelectorAll('nav button').forEach(b => b.classList.remove('sel'));
  const screen = document.getElementById('screen-privacy');
  if(screen) screen.scrollTop = 0;
  const scroll = screen?.querySelector('.privacy-notice-scroll');
  if(scroll) scroll.scrollTop = 0;

  const needsAccept = !privacyAccepted();
  const acceptBlock = document.getElementById('privacyAcceptBlock');
  const reviewBlock = document.getElementById('privacyReviewBlock');
  const check = document.getElementById('privacyAcceptCheck');
  const btn = document.getElementById('privacyAcceptBtn');
  if(acceptBlock) acceptBlock.hidden = reviewOnly && !needsAccept;
  if(reviewBlock) reviewBlock.hidden = !reviewOnly || needsAccept;
  if(check) check.checked = false;
  if(btn) btn.disabled = true;
}

function finishPrivacyAccept(){
  store.set('privacyAcceptedVersion', SITE.privacy.noticeVersion);
  store.set('privacyAcceptedAt', Date.now());
  const check = document.getElementById('privacyAcceptCheck');
  if(check) check.checked = false;
  continueAfterPrivacy();
}

function closePrivacyReview(){
  go('connect');
}

function continueAfterPrivacy(){
  if(store.get('onboarded', false)){
    go('home');
    if(!store.get('installDismissed') && !isStandalone()){
      setTimeout(maybeShowInstall, 1400);
    }
  }else{
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('screen-welcome').classList.add('active');
  }
}

/* ───────── Welcome ───────── */
function finishWelcome(){
  const name = document.getElementById('nameInput').value.trim();
  if(name) store.set('name', name);
  store.set('onboarded', true);
  store.set('lastSeenAt', Date.now());
  document.getElementById('screen-welcome').classList.remove('active');
  go('home');
  setTimeout(maybeShowInstall, 900);
}

/* ───────── Home ───────── */
function dailySlot(salt, len){
  const s = todayKey() + '|' + salt;
  let h = 0;
  for(let i = 0; i < s.length; i++) h = Math.imul(31, h) + s.charCodeAt(i) | 0;
  return (h >>> 0) % len;
}

let affirmIdx = dailySlot('affirm', AFFIRMS.length);
let promptIdx = dailySlot('prompt', PROMPTS.length);

function ensureDailyContent(){
  const td = todayKey();
  if(store.get('contentDay') !== td){
    store.set('contentDay', td);
    affirmIdx = dailySlot('affirm', AFFIRMS.length);
    promptIdx = dailySlot('prompt', PROMPTS.length);
  }
  document.getElementById('affirmHome').textContent = AFFIRMS[dailySlot('affirm', AFFIRMS.length)];
  document.getElementById('affirmText').textContent = AFFIRMS[affirmIdx];
  const jp = document.getElementById('journalPrompt');
  if(jp) jp.textContent = PROMPTS[promptIdx];
}

function renderHome(){
  ensureDailyContent();
  const name = store.get('name', '');
  const h = new Date().getHours();
  const part = getTimePart(h);
  document.getElementById('greeting').textContent =
    'Good ' + part + (name ? ', ' + name : '');

  const checkins = store.get('checkins', []);
  const todayCheckin = getTodayCheckin();
  renderHomeSub(h);

  document.getElementById('affirmHome').textContent = AFFIRMS[dailySlot('affirm', AFFIRMS.length)];
  const faceEl = document.getElementById('homeMoodFace');
  const textEl = document.getElementById('homeMoodText');
  const moodFab = document.getElementById('homeMoodFab');
  if(todayCheckin){
    const m = MOODS.find(x => x.v === todayCheckin.mood);
    if(faceEl) faceEl.innerHTML = m ? moodIconHtml(m.v, 'xs', false) : moodIconHtml(0, 'xs', false);
    if(textEl) textEl.textContent = m ? m.name : 'Done';
    if(moodFab) moodFab.setAttribute('aria-label', m ? "Today's mood: " + m.name + '. Tap to check in.' : 'Checked in today. Tap to check in.');
  }else{
    if(faceEl) faceEl.innerHTML = moodIconHtml(0, 'xs', false);
    if(textEl) textEl.textContent = 'Check in';
    if(moodFab) moodFab.setAttribute('aria-label', 'How are you today? Tap to check in.');
  }

  // Streak: consecutive days ending today (or yesterday) with a check-in
  const days = new Set(checkins.map(c => c.date));
  let streak = 0;
  let d = new Date();
  if(!days.has(todayKey())) d.setDate(d.getDate() - 1);
  while(days.has(localDateKey(d))){
    streak++;
    d.setDate(d.getDate() - 1);
  }
  document.getElementById('streakText').textContent = streak > 0
    ? streak + (streak === 1 ? ' day' : ' days') + ' of checking in'
    : 'Your first check-in awaits';

  // 7-day mood strip
  const wrap = document.getElementById('moodWeek');
  wrap.innerHTML = '';
  const labels = ['Su','Mo','Tu','We','Th','Fr','Sa'];
  for(let i = 6; i >= 0; i--){
    const dt = new Date();
    dt.setDate(dt.getDate() - i);
    const key = localDateKey(dt);
    const found = [...checkins].reverse().find(c => c.date === key);
    const el = document.createElement('div');
    el.className = 'mood-day' + (i === 0 ? ' today' : '');
    el.innerHTML = '<div class="dot' + (found ? '' : ' empty') + '">' +
                   (found ? moodIconHtml(found.mood, 'xs') : '·') + '</div>' +
                   '<div class="lbl">' + (i === 0 ? 'Today' : labels[dt.getDay()]) + '</div>';
    wrap.appendChild(el);
  }
}

function renderMoodTrend(checkins){
  const wrap = document.getElementById('moodTrend');
  const sumEl = document.getElementById('moodTrendSummary');
  if(!wrap) return;
  wrap.innerHTML = '';
  const byDate = {};
  checkins.forEach(c => { byDate[c.date] = c; });

  let total = 0, count = 0;
  for(let i = 29; i >= 0; i--){
    const dt = new Date();
    dt.setDate(dt.getDate() - i);
    const key = localDateKey(dt);
    const found = byDate[key];
    const mood = found ? found.mood : 0;
    if(mood){ total += mood; count++; }

    const bar = document.createElement('div');
    bar.className = 'mood-bar';
    const inner = document.createElement('div');
    inner.className = 'bar' + (mood ? (' m' + mood) : '');
    inner.style.height = mood ? (12 + mood * 11) + 'px' : '4px';
    if(mood){
      const m = MOODS.find(x => x.v === mood);
      if(m) inner.title = m.name;
    }
    bar.appendChild(inner);
    if(i === 0 || i === 14 || i === 29){
      const lbl = document.createElement('div');
      lbl.className = 'lbl';
      lbl.textContent = i === 0 ? 'Today' : (dt.getMonth() + 1) + '/' + dt.getDate();
      bar.appendChild(lbl);
    }
    wrap.appendChild(bar);
  }

  if(sumEl){
    if(!count) sumEl.textContent = 'Check in a few times this month to see your mood pattern here.';
    else{
      const avg = total / count;
      const label = avg < 2.5 ? 'a tender stretch' : avg < 3.5 ? 'steady, mixed days' : avg < 4.5 ? 'mostly holding steady' : 'many brighter days';
      sumEl.textContent = count + ' check-in' + (count === 1 ? '' : 's') + ' this month — ' + label + '.';
    }
  }
}

function renderCalmTeaser(){
  const plan = getCalmPlan();
  const title = document.getElementById('calmTeaserTitle');
  const sub = document.getElementById('calmTeaserSub');
  if(!title || !sub) return;
  if(plan.steps){
    title.textContent = 'Your calm plan';
    sub.textContent = plan.steps.length > 72 ? plan.steps.slice(0, 72) + '…' : plan.steps;
  }else{
    title.textContent = 'Your calm plan';
    sub.textContent = 'Steps, tools, and Aurora — ready when you need them.';
  }
}

/* ───────── Check-in ───────── */
let selMood = null;
const selFeelings = new Set();

function buildCheckin(){
  const row = document.getElementById('moodRow');
  if(!row || row.children.length) return;
  row.innerHTML = '';
  MOODS.forEach(m => {
    const b = document.createElement('button');
    b.className = 'mood-opt';
    b.innerHTML = moodIconHtml(m.v, 'md') + '<span class="name">' + m.name + '</span>';
    b.dataset.mood = m.v;
    b.onclick = () => {
      selMood = m.v;
      row.querySelectorAll('.mood-opt').forEach(x => x.classList.remove('sel'));
      b.classList.add('sel');
      document.getElementById('saveCheckin').disabled = false;
    };
    row.appendChild(b);
  });

  const chips = document.getElementById('chipWrap');
  chips.innerHTML = '';
  FEELINGS.forEach(f => {
    const c = document.createElement('button');
    c.className = 'chip';
    c.textContent = f;
    c.onclick = () => {
      selFeelings.has(f) ? selFeelings.delete(f) : selFeelings.add(f);
      c.classList.toggle('sel');
    };
    chips.appendChild(c);
  });
}

function getTodayCheckin(){
  const checkins = store.get('checkins', []);
  const key = todayKey();
  let found = [...checkins].reverse().find(c => c.date === key);
  if(found) return found;
  const utcKey = new Date().toISOString().slice(0, 10);
  if(utcKey === key) return null;
  const legacy = [...checkins].reverse().find(c => c.date === utcKey);
  if(legacy){
    legacy.date = key;
    store.set('checkins', checkins);
    return legacy;
  }
  return null;
}

function syncCheckinForm(){
  const today = getTodayCheckin();
  selMood = today ? today.mood : null;
  selFeelings.clear();
  if(today && today.feelings) today.feelings.forEach(f => selFeelings.add(f));

  document.querySelectorAll('#moodRow .mood-opt').forEach(b => {
    b.classList.toggle('sel', +b.dataset.mood === selMood);
  });
  document.querySelectorAll('#chipWrap .chip').forEach(c => {
    c.classList.toggle('sel', selFeelings.has(c.textContent));
  });
  const noteEl = document.getElementById('checkinNote');
  if(noteEl) noteEl.value = today && today.note ? today.note : '';
  const saveBtn = document.getElementById('saveCheckin');
  if(saveBtn){
    saveBtn.disabled = !selMood;
    saveBtn.textContent = today ? 'Update Check-In' : 'Save Check-In';
  }
  syncCheckinSupportNudge();
}

function showSupportNudge(mood){
  const s = SITE.support;
  const nudge = document.getElementById('supportNudge');
  const block988 = document.getElementById('support988Block');
  if(!nudge || !s) return;

  const title = document.getElementById('supportNudgeTitle');
  const body = document.getElementById('supportNudgeBody');
  if(mood === 1){
    if(title) title.textContent = s.checkinStrugglingTitle;
    if(body) body.textContent = s.checkinStrugglingBody;
    if(block988) block988.hidden = false;
  }else{
    if(title) title.textContent = s.checkinLowTitle;
    if(body) body.textContent = s.checkinLowBody;
    if(block988) block988.hidden = true;
  }
  nudge.hidden = false;
}

function syncCheckinSupportNudge(){
  const today = getTodayCheckin();
  const nudge = document.getElementById('supportNudge');
  if(!nudge) return;
  if(today && today.mood <= 2){
    showSupportNudge(today.mood);
  }else{
    nudge.hidden = true;
  }
}

function saveCheckin(){
  if(!selMood) return;
  const checkins = store.get('checkins', []);
  const key = todayKey();
  const entry = {
    date: key,
    time: new Date().toTimeString().slice(0,5),
    mood: selMood,
    feelings: [...selFeelings],
    note: document.getElementById('checkinNote').value.trim()
  };
  const idx = checkins.findIndex(c => c.date === key);
  if(idx >= 0) checkins[idx] = entry;
  else checkins.push(entry);
  store.set('checkins', checkins);

  const msgs = {
    1:'Thank you for being honest. Be gentle with yourself today.',
    2:'Noted, with care. Heavy days pass — you are not alone.',
    3:'Thank you for checking in. Okay is a real place to be.',
    4:'Lovely. Notice what is helping today.',
    5:'Wonderful — soak it in. You earned this brightness.'
  };
  toast(msgs[selMood]);

  if(selMood <= 2){
    renderMoodTrend(checkins);
    renderHome();
    syncCheckinForm();
  }else{
    document.getElementById('supportNudge').hidden = true;
    go('home');
    selMood = null;
    selFeelings.clear();
    document.getElementById('checkinNote').value = '';
    document.querySelectorAll('.mood-opt').forEach(x => x.classList.remove('sel'));
    document.querySelectorAll('.chip').forEach(x => x.classList.remove('sel'));
    document.getElementById('saveCheckin').disabled = true;
    document.getElementById('saveCheckin').textContent = 'Save Check-In';
  }
}

/* ───────── Tools: tabs ───────── */
function pickTool(name){
  document.querySelectorAll('.tool-tab').forEach(t => t.classList.toggle('sel', t.dataset.tool === name));
  document.querySelectorAll('.tool-pane').forEach(p => p.classList.remove('active'));
  document.getElementById('pane-' + name).classList.add('active');
  const toolsScreen = document.getElementById('screen-tools');
  if(toolsScreen?.classList.contains('active')) toolsScreen.scrollTop = 0;
  if(name !== 'breathe') stopBreath();
  if(name !== 'ground') stopGroundSession(false);
  if(name !== 'rest') stopRest(true);
}

/* ───────── Tools: breathing ───────── */
let breathTimer = null;
const PHASES = [
  { label:'Breathe In', grow:true },
  { label:'Hold', grow:true },
  { label:'Breathe Out', grow:false },
  { label:'Hold', grow:false }
];

function toggleBreath(){
  breathTimer ? stopBreath() : startBreath();
}

function startBreath(){
  const circle = document.getElementById('breathCircle');
  const label = document.getElementById('breathLabel');
  const count = document.getElementById('breathCount');
  const phaseEl = document.getElementById('breathPhase');
  document.getElementById('breathBtn').textContent = 'End Session';

  if(toolSound !== 'none') Ambient.playFromTap(toolSound);

  let phase = 0, tick = 0;
  const step = () => {
    if(tick === 0){
      const p = PHASES[phase];
      label.textContent = p.label;
      phaseEl.textContent = p.label;
      circle.classList.toggle('grow', p.grow);
    }
    count.textContent = 4 - tick;
    tick++;
    if(tick >= 4){ tick = 0; phase = (phase + 1) % 4; }
  };
  step();
  breathTimer = setInterval(step, 1000);
}

function stopBreath(){
  Ambient.stop();
  if(breathTimer){
    clearInterval(breathTimer);
    breathTimer = null;
  }
  const circle = document.getElementById('breathCircle');
  circle.classList.remove('grow');
  document.getElementById('breathLabel').textContent = 'Ready';
  document.getElementById('breathCount').textContent = '';
  document.getElementById('breathPhase').textContent = 'Box breathing · 4\u20224\u20224\u20224';
  const btn = document.getElementById('breathBtn');
  if(btn) btn.textContent = 'Begin Breathing';
}

/* ───────── Tools: grounding ───────── */
const GROUND = [
  { n:'', title:'The 5-4-3-2-1 Practice', body:'A gentle way to return to the present moment using your senses. Move through each step slowly — there is no rush.' },
  { n:'5', title:'Things You Can See', body:'Look around slowly. Name five things you can see — colors, shapes, light, anything at all.' },
  { n:'4', title:'Things You Can Touch', body:'Notice four textures — your clothing, a chair, the air on your skin, something nearby.' },
  { n:'3', title:'Things You Can Hear', body:'Listen for three sounds, near or far. Let them come to you without judgment.' },
  { n:'2', title:'Things You Can Smell', body:'Find two scents, or simply recall two smells that bring you comfort.' },
  { n:'1', title:'Thing You Can Taste', body:'Notice one taste — a sip of water, or just the inside of your mouth.' },
  { n:'☀', title:'You Are Here', body:'Take one slow breath. You brought yourself back to this moment — that is a real skill, and you just used it.' }
];
let groundIdx = 0;
let groundActive = false;

function stopGroundSession(reset){
  groundActive = false;
  Ambient.stop();
  if(reset){
    groundIdx = 0;
    renderGround();
  }
}

function renderGround(){
  const g = GROUND[groundIdx];
  document.getElementById('groundStep').innerHTML =
    (g.n ? '<div class="big">' + g.n + '</div>' : '') +
    '<h3>' + g.title + '</h3><p>' + g.body + '</p>';
  const dots = document.getElementById('groundDots');
  dots.innerHTML = '';
  for(let i = 0; i < GROUND.length; i++){
    const s = document.createElement('span');
    if(i <= groundIdx) s.classList.add('on');
    dots.appendChild(s);
  }
  document.getElementById('groundBtn').textContent =
    groundIdx === 0 ? 'Start 5\u20104\u20103\u20102\u20101' :
    groundIdx === GROUND.length - 1 ? 'Begin Again' : 'Next';
}

function nextGround(){
  const prev = groundIdx;
  groundIdx = (groundIdx + 1) % GROUND.length;
  renderGround();

  if(prev === 0 && groundIdx === 1){
    groundActive = true;
    if(toolSound !== 'none') Ambient.playFromTap(toolSound);
  }

  if(groundIdx === 0){
    stopGroundSession(false);
  }
}

/* ───────── Daily meditation ───────── */
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const WEEKDAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

let dailyViewDate = stripTime(new Date());
let dailyMeditationsLoad = null;

function loadDailyMeditations(){
  if(window.AURORA_DAILY) return Promise.resolve();
  if(dailyMeditationsLoad) return dailyMeditationsLoad;
  dailyMeditationsLoad = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'daily-meditations.js';
    s.onload = () => resolve();
    s.onerror = () => {
      dailyMeditationsLoad = null;
      reject(new Error('daily-meditations load failed'));
    };
    document.head.appendChild(s);
  });
  return dailyMeditationsLoad;
}

function prefetchDailyMeditations(){
  const run = () => loadDailyMeditations().catch(() => {});
  if(typeof requestIdleCallback === 'function') requestIdleCallback(run, { timeout: 8000 });
  else setTimeout(run, 4000);
}

function stripTime(d){
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function dailyEntryForDate(d){
  const list = window.AURORA_DAILY;
  if(!list) return null;
  const m = d.getMonth() + 1;
  const day = (m === 2 && d.getDate() === 29) ? 28 : d.getDate();
  return list.find(e => e.month === m && e.day === day) || null;
}

function formatDailyLabel(d){
  return WEEKDAY_NAMES[d.getDay()] + ', ' + MONTH_NAMES[d.getMonth()] + ' ' + d.getDate();
}

function escapeHtml(s){
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function renderDaily(){
  const bodyEl = document.getElementById('dailyBody');
  if(!window.AURORA_DAILY){
    if(bodyEl) bodyEl.innerHTML = '<p class="daily-loading">Loading today\'s reflection…</p>';
    loadDailyMeditations()
      .then(() => renderDailyContent())
      .catch(() => {
        if(bodyEl) bodyEl.innerHTML = '<p>Could not load today\'s reflection. Check your connection and try again.</p>';
      });
    return;
  }
  renderDailyContent();
}

function renderDailyContent(){
  const entry = dailyEntryForDate(dailyViewDate);
  const dateEl = document.getElementById('dailyDateLabel');
  const titleEl = document.getElementById('dailyTitle');
  const bodyEl = document.getElementById('dailyBody');
  const carryEl = document.getElementById('dailyCarry');
  const heroEl = document.getElementById('dailyHeroTitle');
  const isToday = stripTime(new Date()).getTime() === dailyViewDate.getTime();

  if(dateEl) dateEl.textContent = formatDailyLabel(dailyViewDate);
  if(heroEl) heroEl.textContent = isToday ? "Today's reflection" : formatDailyLabel(dailyViewDate);

  if(!entry){
    if(titleEl) titleEl.textContent = 'Reading coming soon';
    if(bodyEl) bodyEl.innerHTML = '<p>Today\'s meditation will be available here shortly.</p>';
    if(carryEl) carryEl.textContent = '';
    updateDailyFavoriteBtn();
    renderDailyFavorites();
    return;
  }

  if(titleEl) titleEl.textContent = entry.title;
  if(bodyEl) bodyEl.innerHTML = entry.paragraphs.map(p => '<p>' + escapeHtml(p) + '</p>').join('');
  if(carryEl) carryEl.textContent = entry.carry || '';
  updateDailyFavoriteBtn();
  renderDailyFavorites();
}

function openDailyToday(){
  dailyViewDate = stripTime(new Date());
  go('daily');
}

function openDailyOnDate(month, day){
  dailyViewDate = new Date(new Date().getFullYear(), month - 1, day);
  go('daily');
}

function isDailyFavorited(entry){
  if(!entry) return false;
  return store.get('dailyFavorites', []).some(f => f.month === entry.month && f.day === entry.day);
}

function toggleDailyFavorite(){
  const entry = dailyEntryForDate(dailyViewDate);
  if(!entry) return;
  let favs = store.get('dailyFavorites', []);
  const idx = favs.findIndex(f => f.month === entry.month && f.day === entry.day);
  if(idx >= 0) favs.splice(idx, 1);
  else favs.unshift({ month: entry.month, day: entry.day, title: entry.title });
  store.set('dailyFavorites', favs);
  updateDailyFavoriteBtn();
  renderDailyFavorites();
  toast(idx >= 0 ? 'Removed from saved readings' : 'Reading saved');
}

function updateDailyFavoriteBtn(){
  const btn = document.getElementById('dailyFavBtn');
  const entry = dailyEntryForDate(dailyViewDate);
  if(!btn) return;
  const on = isDailyFavorited(entry);
  btn.classList.toggle('saved', on);
  const svg = btn.querySelector('svg');
  if(svg) svg.setAttribute('fill', on ? 'currentColor' : 'none');
}

function renderDailyFavorites(){
  const list = document.getElementById('dailyFavList');
  const section = document.getElementById('dailyFavSection');
  const favs = store.get('dailyFavorites', []);
  if(section) section.style.display = favs.length ? '' : 'none';
  if(!list) return;
  list.innerHTML = '';
  favs.forEach(f => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'fav-item';
    b.innerHTML = '<strong>' + escapeHtml(f.title) + '</strong><span>' + MONTH_NAMES[f.month - 1] + ' ' + f.day + '</span>';
    b.onclick = () => openDailyOnDate(f.month, f.day);
    list.appendChild(b);
  });
}

function shiftDaily(delta){
  dailyViewDate = new Date(dailyViewDate.getFullYear(), dailyViewDate.getMonth(), dailyViewDate.getDate() + delta);
  renderDaily();
}

function goDailyToday(){
  dailyViewDate = stripTime(new Date());
  renderDaily();
}

/* ───────── Calm plan ───────── */
const CALM_DEFAULT = { steps: '', tools: [], contact1: '', contact1Phone: '', contact2: '', contact2Phone: '' };
let calmToolsSel = new Set();

function getCalmPlan(){
  return Object.assign({}, CALM_DEFAULT, store.get('calmPlan', {}));
}

function renderCalm(){
  const plan = getCalmPlan();
  document.getElementById('calmSteps').value = plan.steps || '';
  document.getElementById('calmContact1').value = plan.contact1 || '';
  document.getElementById('calmContact1Phone').value = plan.contact1Phone || '';
  document.getElementById('calmContact2').value = plan.contact2 || '';
  document.getElementById('calmContact2Phone').value = plan.contact2Phone || '';
  calmToolsSel = new Set(plan.tools || []);
  document.querySelectorAll('.calm-tool').forEach(b => {
    b.classList.toggle('sel', calmToolsSel.has(b.dataset.tool));
  });
  const launch = document.getElementById('calmLaunchBtn');
  if(launch) launch.disabled = calmToolsSel.size === 0;
}

function toggleCalmTool(id){
  calmToolsSel.has(id) ? calmToolsSel.delete(id) : calmToolsSel.add(id);
  document.querySelectorAll('.calm-tool').forEach(b => {
    b.classList.toggle('sel', calmToolsSel.has(b.dataset.tool));
  });
  const launch = document.getElementById('calmLaunchBtn');
  if(launch) launch.disabled = calmToolsSel.size === 0;
}

function saveCalmPlan(){
  store.set('calmPlan', {
    steps: document.getElementById('calmSteps').value.trim(),
    tools: [...calmToolsSel],
    contact1: document.getElementById('calmContact1').value.trim(),
    contact1Phone: document.getElementById('calmContact1Phone').value.trim(),
    contact2: document.getElementById('calmContact2').value.trim(),
    contact2Phone: document.getElementById('calmContact2Phone').value.trim()
  });
  toast('Calm plan saved — only on this device');
  renderCalmTeaser();
}

function launchCalmTool(){
  const tools = calmToolsSel.size ? [...calmToolsSel] : (getCalmPlan().tools || []);
  if(!tools.length) return;
  const t = tools[0];
  if(t === 'daily') openDailyToday();
  else if(t === 'journal') go('journal');
  else{ go('tools'); pickTool(t); }
}

/* ───────── Install prompt ───────── */
let deferredInstall = null;

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredInstall = e;
});

function isStandalone(){
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

function isIOS(){
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

function fillInstallSheet(){
  const steps = document.getElementById('installSteps');
  const btn = document.getElementById('installBtn');
  if(isIOS()){
    steps.innerHTML = '<li>Tap the <strong>Share</strong> button in Safari (square with arrow)</li><li>Scroll and tap <strong>Add to Home Screen</strong></li><li>Tap <strong>Add</strong></li>';
    if(btn) btn.textContent = 'Got it';
  }else if(deferredInstall){
    steps.innerHTML = '<li>Tap below and confirm when your browser asks to install Aurora.</li>';
    if(btn) btn.textContent = 'Install now';
  }else{
    steps.innerHTML = '<li>Open your browser menu (⋮ or …)</li><li>Choose <strong>Add to Home screen</strong> or <strong>Install app</strong></li>';
    if(btn) btn.textContent = 'Got it';
  }
}

function closeInstallSheet(){
  document.getElementById('installBackdrop').classList.remove('show');
}

function updateInstallUI(){
  const section = document.getElementById('installSection');
  if(section) section.style.display = isStandalone() ? 'none' : 'block';
}

function showInstallPrompt(){
  if(isStandalone()) return;
  fillInstallSheet();
  document.getElementById('installBackdrop').classList.add('show');
}

function maybeShowInstall(){
  if(isStandalone() || store.get('installDismissed')) return;
  showInstallPrompt();
}

function dismissInstall(){
  store.set('installDismissed', true);
  closeInstallSheet();
}

async function installApp(){
  if(deferredInstall){
    deferredInstall.prompt();
    const choice = await deferredInstall.userChoice;
    deferredInstall = null;
    if(choice.outcome === 'accepted') dismissInstall();
    else closeInstallSheet();
    return;
  }
  closeInstallSheet();
  toast(isIOS() ? 'Look for Share → Add to Home Screen' : 'Use your browser menu to add to Home screen');
}

/* ───────── Tools: affirmations ───────── */
function nextAffirm(){
  affirmIdx = (affirmIdx + 1) % AFFIRMS.length;
  document.getElementById('affirmText').textContent = AFFIRMS[affirmIdx];
}

/* ───────── Journal ───────── */
let journalLockMode = 'unlock';
let activeJournalEntryId = null;
let journalEntriesCache = [];
let journalLastActivity = 0;
let journalIdleTimer = null;

function journalIdleMs(){
  return (SITE.journalIdleMinutes || 10) * 60 * 1000;
}

function bumpJournalActivity(){
  if(!isJournalUnlocked()) return;
  journalLastActivity = Date.now();
  scheduleJournalIdleCheck();
}

function scheduleJournalIdleCheck(){
  clearTimeout(journalIdleTimer);
  if(!isJournalUnlocked() || !isJournalFlowActive()) return;
  journalIdleTimer = setTimeout(() => {
    if(!isJournalUnlocked() || !isJournalFlowActive()) return;
    if(Date.now() - journalLastActivity >= journalIdleMs()){
      lockJournalFromIdle();
      return;
    }
    scheduleJournalIdleCheck();
  }, Math.min(journalIdleMs(), 30000));
}

function lockJournalFromIdle(){
  if(!isJournalUnlocked()) return;
  lockJournalNow();
  toast('Journal locked to protect your privacy.');
}

function initJournalIdleLock(){
  const bump = () => bumpJournalActivity();
  document.getElementById('journalText')?.addEventListener('input', bump);
  document.getElementById('journalEntryBody')?.addEventListener('input', bump);
  ['keydown', 'touchstart', 'click', 'scroll'].forEach(ev => {
    document.getElementById('screen-journal')?.addEventListener(ev, bump, { passive: true });
    document.getElementById('screen-journal-entry')?.addEventListener(ev, bump, { passive: true });
  });
  document.addEventListener('visibilitychange', () => {
    if(document.visibilityState === 'hidden' && isJournalUnlocked() && isJournalFlowActive()){
      lockJournalFromIdle();
    }
  });
}

function updateJournalAccess(){
  if(!journalCryptoSupported()){
    toast('This browser cannot encrypt your journal.');
    showJournalContent(false);
    renderEntries();
    return;
  }
  if(!hasJournalVault()){
    journalLockMode = 'setup';
    showJournalLockPanel();
    return;
  }
  if(!isJournalUnlocked()){
    journalLockMode = 'unlock';
    showJournalLockPanel();
    return;
  }
  showJournalContent(true);
  renderEntries();
}

function showJournalLockPanel(){
  document.getElementById('journalLockPanel').hidden = false;
  document.getElementById('journalContent').hidden = true;
  const confirm = document.getElementById('journalPassConfirm');
  const title = document.getElementById('journalLockTitle');
  const desc = document.getElementById('journalLockDesc');
  const passA = document.getElementById('journalPassA');
  passA.value = '';
  confirm.value = '';
  if(journalLockMode === 'setup'){
    title.textContent = 'Create a journal passcode';
    desc.textContent = SITE.privacy.journalLockSetupDesc || 'Your journal entry text will be encrypted on this device with a passcode only you know.';
    confirm.hidden = false;
    passA.placeholder = 'Choose a passcode';
    passA.autocomplete = 'new-password';
  }else{
    title.textContent = 'Unlock your journal';
    desc.textContent = SITE.privacy.journalLockUnlockDesc || 'Enter your passcode to read and write encrypted journal entries.';
    confirm.hidden = true;
    passA.placeholder = 'Passcode';
    passA.autocomplete = 'current-password';
  }
  passA.focus();
}

function bindJournalLock(){
  const form = document.getElementById('journalLockForm');
  const passA = document.getElementById('journalPassA');
  const confirm = document.getElementById('journalPassConfirm');
  if(!form || !passA) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    submitJournalLock();
  });

  passA.addEventListener('keydown', e => {
    if(e.key !== 'Enter') return;
    if(journalLockMode === 'setup' && confirm && !confirm.hidden){
      e.preventDefault();
      confirm.focus();
    }
  });
}

function showJournalContent(unlocked){
  document.getElementById('journalLockPanel').hidden = true;
  document.getElementById('journalContent').hidden = false;
  document.getElementById('journalLockBtn').hidden = !unlocked;
  if(unlocked) bumpJournalActivity();
}

async function submitJournalLock(){
  const pass = document.getElementById('journalPassA').value;
  const confirm = document.getElementById('journalPassConfirm').value;
  if(pass.length < MIN_PASS_LEN){
    toast('Use at least ' + MIN_PASS_LEN + ' characters.');
    return;
  }
  try{
    if(journalLockMode === 'setup'){
      if(pass !== confirm){
        toast('Passcodes do not match.');
        return;
      }
      await setupJournalPasscode(pass);
      toast('Journal secured.');
    }else{
      await unlockJournal(pass);
    }
    document.getElementById('journalPassA').value = '';
    document.getElementById('journalPassConfirm').value = '';
    showJournalContent(true);
    renderEntries();
  }catch(e){
    toast(journalLockMode === 'setup' ? 'Could not secure journal.' : 'Incorrect passcode.');
  }
}

function lockJournalNow(){
  lockJournal();
  clearTimeout(journalIdleTimer);
  activeJournalEntryId = null;
  journalEntriesCache = [];
  document.getElementById('journalText').value = '';
  const entryBody = document.getElementById('journalEntryBody');
  if(entryBody) entryBody.value = '';
  journalLockMode = 'unlock';
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-journal').classList.add('active');
  document.querySelectorAll('nav button').forEach(b => b.classList.toggle('sel', b.dataset.s === 'journal'));
  showJournalLockPanel();
}

function nextPrompt(){
  promptIdx = (promptIdx + 1) % PROMPTS.length;
  document.getElementById('journalPrompt').textContent = PROMPTS[promptIdx];
}
async function saveEntry(){
  if(!isJournalUnlocked()){
    toast('Unlock your journal first.');
    updateJournalAccess();
    return;
  }
  const txt = document.getElementById('journalText').value.trim();
  if(!txt){ toast('Write a little something first 🌱'); return; }
  await appendJournalEntry(txt);
  document.getElementById('journalText').value = '';
  renderEntries();
  toast(SITE.privacy.journalSavedToast || 'Saved — encrypted on this device.');
}

function deleteEntry(id){
  if(!isJournalUnlocked()) return;
  removeJournalEntry(id);
  if(activeJournalEntryId === id){
    activeJournalEntryId = null;
    backToJournal();
  }
  renderEntries();
}

function fitJournalField(ta){
  ta.style.height = 'auto';
  ta.style.height = ta.scrollHeight + 'px';
}

function formatEntryDate(entry){
  const d = parseEntryDate(entry);
  if(!d) return entry.date || '';
  const label = formatDailyLabel(d);
  if(d.getFullYear() !== new Date().getFullYear()) return label + ', ' + d.getFullYear();
  return label;
}

function parseEntryDate(entry){
  const key = entry.dateKey || entry.date;
  if(typeof key === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(key)){
    const parts = key.split('-').map(Number);
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }
  if(entry.date){
    const parsed = Date.parse(entry.date);
    if(!isNaN(parsed)) return new Date(parsed);
  }
  return null;
}

function showJournalEntryScreen(){
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const screen = document.getElementById('screen-journal-entry');
  screen.classList.add('active');
  screen.scrollTop = 0;
  document.querySelectorAll('nav button').forEach(b => b.classList.toggle('sel', b.dataset.s === 'journal'));
  bumpJournalActivity();
}

function backToJournal(){
  go('journal');
}

async function openJournalEntry(id){
  if(!isJournalUnlocked()) return;
  if(!journalEntriesCache.length) journalEntriesCache = await getDecryptedJournal();
  let entry = journalEntriesCache.find(e => e.id === id);
  if(!entry){
    journalEntriesCache = await getDecryptedJournal();
    entry = journalEntriesCache.find(e => e.id === id);
  }
  if(!entry){
    toast('Entry not found.');
    return;
  }
  activeJournalEntryId = id;
  document.getElementById('journalEntryDate').textContent = formatEntryDate(entry);
  const ta = document.getElementById('journalEntryBody');
  ta.value = entry.text || '';
  ta.setAttribute('aria-label', 'Journal entry from ' + formatEntryDate(entry));
  showJournalEntryScreen();
  fitJournalField(ta);
  bumpJournalActivity();
}

function deleteActiveJournalEntry(){
  if(!activeJournalEntryId) return;
  deleteEntry(activeJournalEntryId);
}

async function renderEntries(){
  const list = document.getElementById('entryList');
  journalEntriesCache = isJournalUnlocked() ? await getDecryptedJournal() : [];
  if(!journalEntriesCache.length){
    list.innerHTML = '<p class="empty-note">No entries yet. Whenever you\'re ready,<br>this page is yours.</p>';
    return;
  }
  list.innerHTML = '';
  const wrap = document.createElement('div');
  wrap.className = 'entry-list';
  journalEntriesCache.forEach(e => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'entry-link';
    btn.setAttribute('aria-label', 'Open entry from ' + formatEntryDate(e));

    const date = document.createElement('span');
    date.className = 'entry-link-date';
    date.textContent = formatEntryDate(e);

    const arrow = document.createElement('span');
    arrow.className = 'entry-link-arrow';
    arrow.setAttribute('aria-hidden', 'true');
    arrow.textContent = '›';

    btn.appendChild(date);
    btn.appendChild(arrow);
    btn.onclick = () => openJournalEntry(e.id);
    wrap.appendChild(btn);
  });
  list.appendChild(wrap);
}

/* ───────── Alumnae events (Google Sheet) ─────────
   Staff maintain events in a Google Sheet published to the web as CSV.
   Columns (first row must be headers): Title, Date, Time, Location, Description
   Date format: YYYY-MM-DD (e.g. 2026-06-18).
   To connect the sheet: File → Share → Publish to web → choose the sheet +
   "Comma-separated values (.csv)", publish, and paste the URL below. */
const EVENTS_SHEET_CSV_URL = SITE.eventsSheetUrl;

const DEFAULT_EVENTS = [
  { title:'Alumnae Connection Circle', date:'2026-06-18', time:'6:00\u20137:30 PM', location:'Aurora, Danvers',
    description:'Our monthly peer support circle \u2014 a facilitated space to reconnect, share where you are, and be reminded you\u2019re not walking this path alone. Held the third Thursday of every month.' },
  { title:'Sunrise Walk & Brunch', date:'2026-06-27', time:'8:30 AM', location:'Salem Willows Park',
    description:'A gentle seaside walk followed by brunch together \u2014 movement, fresh air, and good company to welcome the summer. Family and loved ones welcome.' },
  { title:'Creative Healing Workshop', date:'2026-07-15', time:'5:30\u20137:00 PM', location:'Aurora, Danvers',
    description:'An evening of expressive art and journaling led by our clinical team. No artistic experience needed \u2014 just curiosity and an open heart. Materials provided.' }
];

function parseCSV(text){
  const rows = [];
  let row = [], field = '', inQuotes = false;
  for(let i = 0; i < text.length; i++){
    const ch = text[i];
    if(inQuotes){
      if(ch === '"'){
        if(text[i+1] === '"'){ field += '"'; i++; }
        else inQuotes = false;
      } else field += ch;
    } else if(ch === '"') inQuotes = true;
    else if(ch === ','){ row.push(field); field = ''; }
    else if(ch === '\n' || ch === '\r'){
      if(ch === '\r' && text[i+1] === '\n') i++;
      row.push(field); field = '';
      if(row.some(f => f.trim() !== '')) rows.push(row);
      row = [];
    } else field += ch;
  }
  row.push(field);
  if(row.some(f => f.trim() !== '')) rows.push(row);
  return rows;
}

function sheetRowsToEvents(rows){
  if(rows.length < 2) return [];
  const headers = rows[0].map(h => h.trim().toLowerCase());
  const col = name => headers.indexOf(name);
  const iTitle = col('title'), iDate = col('date'), iTime = col('time'),
        iLoc = col('location'), iDesc = col('description');
  if(iTitle === -1) return [];
  return rows.slice(1).map(r => ({
    title: (r[iTitle] || '').trim(),
    date: iDate !== -1 ? (r[iDate] || '').trim() : '',
    time: iTime !== -1 ? (r[iTime] || '').trim() : '',
    location: iLoc !== -1 ? (r[iLoc] || '').trim() : '',
    description: iDesc !== -1 ? (r[iDesc] || '').trim() : ''
  })).filter(e => e.title);
}

const MONTH_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function renderEvents(events){
  const list = document.getElementById('eventList');
  if(!list) return;

  // Hide past events; keep undated ones (e.g. "every third Thursday")
  const today = todayKey();
  const upcoming = events
    .filter(e => !/^\d{4}-\d{2}-\d{2}$/.test(e.date) || e.date >= today)
    .sort((a, b) => (a.date || '9999') < (b.date || '9999') ? -1 : 1);

  list.innerHTML = '';
  if(!upcoming.length){
    list.innerHTML = '<p class="empty-note">New gatherings are being planned \u2014 check back soon,<br>or reach out and we\u2019ll keep you posted.</p>';
    return;
  }

  upcoming.forEach(e => {
    let mon = '\u2022\u2022\u2022', day = '\u2014';
    if(/^\d{4}-\d{2}-\d{2}$/.test(e.date)){
      mon = MONTH_ABBR[parseInt(e.date.slice(5,7), 10) - 1];
      day = String(parseInt(e.date.slice(8,10), 10));
    }
    const card = document.createElement('div');
    card.className = 'card event';

    const cal = document.createElement('div');
    cal.className = 'cal';
    cal.innerHTML = '<div class="mon"></div><div class="day"></div>';
    cal.querySelector('.mon').textContent = mon;
    cal.querySelector('.day').textContent = day;

    const body = document.createElement('div');
    const h3 = document.createElement('h3');
    h3.textContent = e.title;
    body.appendChild(h3);

    if(e.time || e.location){
      const meta = document.createElement('div');
      meta.className = 'meta';
      if(e.time){
        const s = document.createElement('span');
        s.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';
        s.appendChild(document.createTextNode(e.time));
        meta.appendChild(s);
      }
      if(e.location){
        const s = document.createElement('span');
        s.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10z"/><circle cx="12" cy="11" r="2.2"/></svg>';
        s.appendChild(document.createTextNode(e.location));
        meta.appendChild(s);
      }
      body.appendChild(meta);
    }

    if(e.description){
      const p = document.createElement('p');
      p.textContent = e.description;
      body.appendChild(p);
    }

    const rsvp = document.createElement('a');
    rsvp.className = 'btn btn-navy';
    rsvp.style.textDecoration = 'none';
    rsvp.href = 'mailto:' + SITE.email + '?subject=' + encodeURIComponent('RSVP: ' + e.title);
    rsvp.textContent = 'RSVP';
    body.appendChild(rsvp);

    card.appendChild(cal);
    card.appendChild(body);
    list.appendChild(card);
  });
}

async function loadEvents(){
  renderEvents(store.get('events', DEFAULT_EVENTS));
  if(!EVENTS_SHEET_CSV_URL) return;
  try{
    const res = await fetch(EVENTS_SHEET_CSV_URL, { cache:'no-store' });
    if(!res.ok) return;
    const events = sheetRowsToEvents(parseCSV(await res.text()));
    if(events.length){
      store.set('events', events);
      renderEvents(events);
    }
  }catch(e){ /* offline — cached or default events stay on screen */ }
}

function bootApp(){
  applySiteBranding();
  bindActions();
  bindJournalLock();
  initLastSeen();

  if(!privacyAccepted()){
    showPrivacyNotice(false);
  }else if(store.get('onboarded', false)){
    go('home');
    if(!store.get('installDismissed') && !isStandalone()){
      setTimeout(maybeShowInstall, 1400);
    }
  }else{
    document.getElementById('screen-welcome').classList.add('active');
  }

  const deferBoot = () => {
    mountSoundPickers();
    initJournalIdleLock();
    buildCheckin();
    renderGround();
    initToolSound();
    initRest();
    ensureDailyContent();
    updateInstallUI();
    loadEvents();
    prefetchDailyMeditations();
    if('serviceWorker' in navigator) initServiceWorker();
  };

  if(typeof requestIdleCallback === 'function'){
    requestIdleCallback(deferBoot, { timeout: 1500 });
  }else{
    setTimeout(deferBoot, 0);
  }

  document.addEventListener('visibilitychange', () => {
    if(document.visibilityState !== 'visible') return;
    ensureDailyContent();
    if(document.getElementById('screen-home')?.classList.contains('active')) renderHome();
  });
}

if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootApp);
else bootApp();
