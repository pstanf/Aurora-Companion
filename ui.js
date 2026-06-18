/* DOM helpers — branding, sound pickers, delegated actions */
'use strict';

function heroBrandHtml(){
  return '<div class="hero-brand">' +
    '<img src="' + SITE.emblem + '" alt="" class="hero-logo" width="32" height="32">' +
    '<div class="hero-brand-text">' +
    '<span class="hero-name">' + SITE.name + '</span>' +
    '<span class="hero-tagline">' + SITE.tagline + '</span>' +
    '</div></div>';
}

function applySiteBranding(){
  document.title = SITE.companionTitle + ' — ' + SITE.tagline;
  const desc = document.querySelector('meta[name="description"]');
  if(desc) desc.content = SITE.pageDescription;
  const theme = document.querySelector('meta[name="theme-color"]');
  if(theme) theme.setAttribute('content', SITE.themeColor);
  document.querySelectorAll('.hero-brand-mount').forEach(el => { el.innerHTML = heroBrandHtml(); });
  document.querySelectorAll('[data-site-name]').forEach(el => { el.textContent = SITE.name; });
  document.querySelectorAll('[data-site-phone]').forEach(el => {
    if(el.tagName === 'A'){ el.href = 'tel:' + SITE.phone; el.textContent = SITE.phoneDisplay; }
    else el.textContent = SITE.phoneDisplay;
  });
  document.querySelectorAll('[data-site-email]').forEach(el => {
    if(el.tagName === 'A'){ el.href = 'mailto:' + SITE.email; el.textContent = SITE.email; }
  });
  document.querySelectorAll('[data-site-web]').forEach(el => {
    if(el.tagName === 'A'){ el.href = SITE.website; el.textContent = SITE.websiteDisplay; }
  });
  const welcome = document.getElementById('welcomeTitle');
  if(welcome) welcome.textContent = SITE.nameUpper;
  const wtag = document.getElementById('welcomeTag');
  if(wtag) wtag.textContent = SITE.welcomeTagline;
  const wlead = document.getElementById('welcomeLead');
  if(wlead) wlead.textContent = SITE.welcomeLead;
  applyPrivacyCopy();
  applySupportCopy();
  applyPrivacyNoticeCopy();
}

function applyPrivacyNoticeCopy(){
  const p = SITE.privacy;
  if(!p || !p.noticeVersion) return;
  const set = (id, text) => { const el = document.getElementById(id); if(el && text) el.textContent = text; };
  set('privacyNoticeTitle', p.noticeTitle);
  set('privacyNoticeSubtitle', p.noticeSubtitle);
  set('privacyNoticeIntro', p.noticeIntro);
  set('privacyNoticeWellness', p.noticeWellness);
  set('privacyNoticeEmergency', p.noticeEmergency);
  set('privacyNoticeFine', p.noticeFinePrint);
  set('privacyNoticeVersion', 'Privacy notice v' + p.noticeVersion + ' · Last updated ' + p.noticeUpdated);
  set('privacyAcceptLabel', p.noticeAcceptLabel);
  const acceptBtn = document.getElementById('privacyAcceptBtn');
  if(acceptBtn && p.noticeAcceptBtn) acceptBtn.textContent = p.noticeAcceptBtn;
  const reviewBtn = document.querySelector('#privacyReviewBlock [data-action="privacy-close"]');
  if(reviewBtn && p.noticeReviewBtn) reviewBtn.textContent = p.noticeReviewBtn;
  set('privacyReviewLink', p.connectReviewLink);
  const list = document.getElementById('privacyNoticeList');
  if(list && p.noticeBullets){
    list.innerHTML = p.noticeBullets.map(item => '<li>' + item + '</li>').join('');
  }
}

function applySupportCopy(){
  const s = SITE.support;
  if(!s) return;
  const set = (id, text) => { const el = document.getElementById(id); if(el && text) el.textContent = text; };
  set('supportConnectTitle', s.connectTitle);
  set('supportConnectBody', s.connectBody);
  set('supportConnectEmergency', s.connectEmergency);
  set('support988Note', s.lifelineNote);
  const aurora = document.getElementById('supportAuroraCall');
  if(aurora && SITE.phone){
    aurora.href = 'tel:' + SITE.phone;
    aurora.textContent = 'Call Aurora';
  }
}

function applyPrivacyCopy(){
  const p = SITE.privacy;
  if(!p) return;
  const set = (id, text) => { const el = document.getElementById(id); if(el && text) el.textContent = text; };
  set('welcomeClinicalNote', p.welcomeClinical);
  set('welcomePrivacyNote', p.welcomeStorage);
  set('checkinPrivacyNote', p.checkinInline);
  set('journalSub', p.journalSub);
  set('journalPrivacyTitle', p.journalTitle);
  set('journalPrivacyBody', p.journalBody);
  set('privacyCardBody', p.connectBody);
  set('appDisclaimer', p.disclaimer);
}

function soundPickerHtml(extraClass){
  return SITE.ambientSounds.map(s =>
    '<button type="button" class="sound-opt' + (extraClass ? ' ' + extraClass : '') + '" data-action="sound" data-sound="' + s.id + '">' + s.label + '</button>'
  ).join('');
}

function mountSoundPickers(){
  document.querySelectorAll('[data-sound-picker]').forEach(el => {
    el.innerHTML = soundPickerHtml(el.dataset.extraClass || '');
  });
}

const ACTIONS = {
  'nav': (el) => go(el.dataset.screen),
  'tool': (el) => pickTool(el.dataset.tool),
  'sound': (el) => pickSound(el.dataset.sound),
  'rest-dur': (el) => pickRestDuration(+el.dataset.min),
  'breath-toggle': () => toggleBreath(),
  'ground-next': () => nextGround(),
  'rest-btn': () => restBtnClick(),
  'affirm-next': () => nextAffirm(),
  'prompt-next': () => nextPrompt(),
  'journal-save': () => saveEntry(),
  'journal-entry-delete': () => deleteActiveJournalEntry(),
  'journal-lock': () => lockJournalNow(),
  'checkin-save': () => saveCheckin(),
  'calm-save': () => saveCalmPlan(),
  'calm-launch': () => launchCalmTool(),
  'calm-tool': (el) => toggleCalmTool(el.dataset.tool),
  'daily-prev': () => shiftDaily(-1),
  'daily-next': () => shiftDaily(1),
  'daily-today': () => goDailyToday(),
  'daily-fav': () => toggleDailyFavorite(),
  'welcome-finish': () => finishWelcome(),
  'privacy-accept': () => finishPrivacyAccept(),
  'privacy-review': () => showPrivacyNotice(true),
  'privacy-close': () => closePrivacyReview(),
  'install-show': () => showInstallPrompt(),
  'install-dismiss': () => dismissInstall(),
  'install-app': () => installApp(),
  'home-checkin': () => go('checkin'),
  'home-tool': (el) => { go('tools'); pickTool(el.dataset.tool); },
  'home-daily': () => openDailyToday(),
  'home-journal': () => go('journal'),
  'home-connect': () => go('connect'),
  'home-calm': () => go('calm'),
  'journal-from-daily': () => go('journal')
};

function bindActions(){
  document.querySelector('.phone')?.addEventListener('click', e => {
    const el = e.target.closest('[data-action]');
    if(!el) return;
    const fn = ACTIONS[el.dataset.action];
    if(fn) fn(el);
  });
  document.getElementById('installBackdrop')?.addEventListener('click', e => {
    if(e.target.id === 'installBackdrop') dismissInstall();
  });
  const privacyCheck = document.getElementById('privacyAcceptCheck');
  const privacyBtn = document.getElementById('privacyAcceptBtn');
  if(privacyCheck && privacyBtn){
    privacyCheck.addEventListener('change', () => {
      privacyBtn.disabled = !privacyCheck.checked;
    });
  }
  const hzSel = document.getElementById('spiritHzSelect');
  if(hzSel) hzSel.addEventListener('change', () => pickSpiritHz(+hzSel.value));
}

Object.assign(window, {
  go, pickTool, pickSound, pickRestDuration, toggleBreath, nextGround, restBtnClick,
  nextAffirm, nextPrompt, saveEntry, deleteActiveJournalEntry, openJournalEntry,
  submitJournalLock, lockJournalNow, saveCheckin, saveCalmPlan, launchCalmTool,
  toggleCalmTool, shiftDaily, goDailyToday, toggleDailyFavorite, finishWelcome,
  showInstallPrompt, dismissInstall, installApp, openDailyToday,
  showPrivacyNotice, finishPrivacyAccept, closePrivacyReview, privacyAccepted
});
