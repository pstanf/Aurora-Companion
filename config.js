/* Site template — customize per treatment center */
'use strict';

const SITE = {
  storagePrefix: 'aurora_',
  name: 'Aurora',
  nameUpper: 'AURORA',
  tagline: 'Healing & Recovery for Women',
  welcomeTagline: 'HEALING & RECOVERY FOR WOMEN',
  welcomeLead: 'A gentle daily companion for the moments between sessions — created with care by the team at Aurora.',
  companionTitle: 'Aurora Companion',
  pageDescription: 'A gentle daily companion from Aurora — Healing & Recovery for Women.',
  themeColor: '#e07a52',
  homeTagline: 'Small steps, taken gently, become real change.',
  journalIdleMinutes: 10,
  phone: '9787057304',
  phoneDisplay: '(978) 705-7304',
  email: 'Info@auroraforwomen.com',
  website: 'https://www.auroraforwomen.com',
  websiteDisplay: 'auroraforwomen.com',
  address: '75 Sylvan Street, Suite B-203\nDanvers, MA 01923',
  emblem: 'aurora-emblem.png',
  heroBg: 'hero-bg.svg',
  eventsSheetUrl: 'https://docs.google.com/spreadsheets/d/1B_Y_Y4iy8bMU5LZNZFxjrb0BO_zHczoXQBGlU0RPkqU/gviz/tq?tqx=out:csv&gid=0',
  trustBadges: [
    '100% Women-Owned & Operated',
    'Trauma-Informed, Whole-Person Care',
    'Private & Stored Only On Your Device'
  ],
  connectBadges: [
    '100% Women-Owned & Operated',
    'Trauma-Informed, Root-Cause Care',
    "Private Insurance Accepted — We'll Help Verify Benefits"
  ],
  ambientSounds: [
    { id: 'none', label: 'None' },
    { id: 'soundbath', label: 'Sound Bath' },
    { id: 'meditation', label: 'Meditation' },
    { id: 'ocean', label: 'Ocean' },
    { id: 'rain', label: 'Rain' }
  ],
  soundFiles: {
    soundbath: { file: 'sounds/sound-bath.mp3', vol: 0.72 },
    meditation: { file: 'sounds/meditation.mp3', vol: 0.68 }
  },
  privacy: {
    welcomeClinical: 'This companion supports — but never replaces — care from a licensed clinician.',
    welcomeStorage: 'Check-ins, journal entries, and calm plans are saved only on this device. Aurora does not collect, access, transmit, or store that information.',
    checkinInline: 'Saved only on this device — not sent to Aurora.',
    journalTitle: 'Before you write',
    journalBody: 'Entries are encrypted on this device with a passcode only you know. Aurora cannot read, back up, reset, or recover your passcode or entries. If others use or can unlock this device, they may still access your journal when it is unlocked — use a personal device with a passcode when you can.',
    journalSub: 'Encrypted on this device — only you can unlock it.',
    connectTitle: 'Your data & privacy',
    connectBody: 'Aurora Companion does not collect, access, transmit, or store your check-ins, journal entries, calm plans, or other personal content. Journal entries are encrypted on your device with a passcode you choose. We cannot recover lost passcodes or journal content. Other information stays on your device only. Data does not sync to other phones or computers. You are responsible for securing the device you use.',
    disclaimer: 'Aurora Companion offers supportive tools and is not a medical device, diagnosis, or substitute for professional mental health care. For mental health support, call or text 988. If you are in immediate danger, call 911. Aurora is not responsible for personal content stored on your device or for access by others who use or unlock your device.',
    noticeVersion: '1.0',
    noticeUpdated: 'June 2026',
    noticeTitle: 'Your privacy & safety come first',
    noticeSubtitle: 'Please read before you begin',
    noticeIntro: 'Welcome to the Aurora Companion — a gentle wellness tool from Aurora for Women.',
    noticeBullets: [
      'Check-ins, journal entries, calm plans, and notes are stored only on this device in your browser.',
      'Aurora does not collect, access, receive, store, or transmit your personal entries or mood data.',
      'This companion is not an electronic health record or medical record system.',
      'Journal entries can be protected with a passcode you choose. Check-ins and calm plans are not encrypted — anyone who can unlock this device may be able to see them.',
      'If you clear browser data, uninstall the app, lose your device, or forget your journal passcode, that information cannot be recovered by Aurora.',
      'You are responsible for securing the phone or computer you use.'
    ],
    noticeWellness: 'This app is a wellness companion only. It supports — but never replaces — care from a licensed clinician. It is not crisis intervention or medical advice.',
    noticeEmergency: 'For mental health support, call or text 988. If you are in immediate danger, call 911. The Aurora team is also here when you want to reach out.',
    noticeFinePrint: 'By continuing, you acknowledge that your entries stay on your device, Aurora cannot access or recover them, and you accept these terms for this version of the companion.',
    noticeAcceptLabel: 'I have read this notice. I understand my data stays only on my device, I am responsible for this device\'s security, and this app is a companion tool — not medical treatment.',
    noticeAcceptBtn: 'I understand — continue',
    noticeReviewBtn: 'Back to Connect',
    connectReviewLink: 'Read full privacy & safety notice'
  },
  support: {
    checkinStrugglingTitle: 'It sounds like today is heavy.',
    checkinStrugglingBody: 'You do not have to carry this alone. Free, confidential support is available 24/7 — and the Aurora team is here for you too.',
    checkinLowTitle: 'Thank you for checking in.',
    checkinLowBody: 'Hard days happen. The Aurora team is just a phone call away whenever you want to reach out.',
    lifelineNote: 'The 988 Suicide & Crisis Lifeline — call or text 988.',
    connectTitle: 'Support when you need it',
    connectBody: 'Free, confidential support is available 24/7. Call or text 988 to connect with the 988 Suicide & Crisis Lifeline.',
    connectEmergency: 'If you are in immediate danger, call 911.'
  }
};

const store = {
  get(k, fallback){
    try{
      const v = localStorage.getItem(SITE.storagePrefix + k);
      return v ? JSON.parse(v) : fallback;
    }catch(e){ return fallback; }
  },
  set(k, v){
    try{ localStorage.setItem(SITE.storagePrefix + k, JSON.stringify(v)); }catch(e){}
  }
};

function localDateKey(d){
  d = d || new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + day;
}

const todayKey = () => localDateKey();
const RETURN_AFTER_DAYS = 7;

/* ───────── Content ───────── */
const AFFIRMS = [
  '"I am allowed to begin from exactly where I am."',
  '"My feelings are information, not instructions."',
  '"Healing is not linear, and neither am I — that is okay."',
  '"I can do hard things gently."',
  '"Rest is part of the work, not a break from it."',
  '"I am more than my hardest days."',
  '"Asking for help is an act of strength."',
  '"Today, noticing is enough."',
  '"I am building safety inside myself, one breath at a time."',
  '"I deserve the same compassion I give to others."',
  '"My pace is valid, even when it feels slow."',
  '"I can hold uncertainty without abandoning myself."',
  '"I am learning to trust myself again."',
  '"It is okay to outgrow what no longer fits."',
  '"I do not have to earn the right to take up space."',
  '"Gentleness toward myself creates room for change."',
  '"I can feel afraid and still choose what matters to me."',
  '"My story is still being written — today is one page."',
  '"I am allowed to change my mind."',
  '"Progress can be quiet and still be real."',
  '"I can return to myself without shame."',
  '"Connection begins with how I speak to myself."',
  '"I am worthy of care on ordinary days, not only hard ones."',
  '"Each small step counts, even when no one else sees it."'
];

const PROMPTS = [
  'What is one thing your body is telling you today?',
  'Name something small that brought you a moment of ease this week.',
  'If your anxiety could speak kindly, what might it be trying to protect you from?',
  'What would you say to a dear friend feeling the way you feel right now?',
  'Describe a place — real or imagined — where you feel completely safe.',
  'What is one boundary you are proud of keeping, or want to begin keeping?',
  'What does "enough" look like for you today?',
  'Write about a moment you handled better than you would have a year ago.',
  'What emotion showed up most often this week — and what did it need from you?',
  'What is one thing you can release today, even if it is small?',
  'When did you last feel genuinely seen? What was that like?',
  'What part of you needs gentleness right now?',
  'Write a letter to your younger self — one paragraph is enough.',
  'What helps you feel grounded when the day feels heavy?',
  'What are you learning to accept about yourself?',
  'List three things that are true about you beyond your struggles.',
  'What would make today 1% kinder toward yourself?',
  'Who or what reminds you that you belong?'
];

const MOODS = [
  { v:1, name:'Struggling' },
  { v:2, name:'Low' },
  { v:3, name:'Okay' },
  { v:4, name:'Good' },
  { v:5, name:'Bright' }
];

let moodIconSeq = 0;

function moodIconHtml(v, size, light){
  size = size || 'md';
  const cls = 'mood-icon ' + size + (light ? ' light' : '');
  const ns = ' xmlns="http://www.w3.org/2000/svg"';

  if(!v){
    if(light){
      return '<svg class="' + cls + ' empty"' + ns + ' viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.55)" stroke-width="1.4" stroke-dasharray="3 2.5"/></svg>';
    }
    return '<svg class="' + cls + ' empty"' + ns + ' viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" fill="#f7f3ef" stroke="#ddd4cb" stroke-width="1.3" stroke-dasharray="3 2.5"/></svg>';
  }

  if(light){
    const p = {
      1: { main:'#eef3fa', drop:'#dce6f2' },
      2: { main:'#f2f6fb' },
      3: { main:'#eef2f8', sun:'#fff6ef' },
      4: { main:'#fde8d8', ray:'#fffaf6' },
      5: { main:'#f5c4a8', ray:'#fffaf6' }
    }[v];
    const shapes = {
      1: '<path fill="' + p.main + '" d="M5.5 13.5c0-3.6 2.9-6.5 6.5-6.5 1.6 0 3 .6 4.1 1.6.9-1.7 2.7-2.8 4.7-2.5 2.8.3 5 2.7 5 5.4H5.5z"/><ellipse cx="9.5" cy="17.2" rx="1" ry="1.6" fill="' + p.drop + '"/><ellipse cx="12" cy="18" rx="1" ry="1.6" fill="' + p.drop + '"/><ellipse cx="14.5" cy="17.2" rx="1" ry="1.6" fill="' + p.drop + '"/>',
      2: '<ellipse cx="12" cy="14" rx="8.2" ry="4.6" fill="' + p.main + '"/><ellipse cx="7.8" cy="12.2" rx="4.2" ry="3.6" fill="' + p.main + '"/><ellipse cx="15.5" cy="11.8" rx="5" ry="3.8" fill="' + p.main + '"/>',
      3: '<circle cx="17.5" cy="8.5" r="3.8" fill="' + p.sun + '"/><ellipse cx="11" cy="14.2" rx="8" ry="4.5" fill="' + p.main + '"/><ellipse cx="6.5" cy="12.5" rx="4" ry="3.4" fill="' + p.main + '"/>',
      4: '<circle cx="12" cy="12" r="4.2" fill="' + p.main + '"/><path fill="none" stroke="' + p.ray + '" stroke-width="2" stroke-linecap="round" d="M12 4.5v2.2M12 17.3v2.2M6.2 6.2l1.55 1.55M16.25 16.25l1.55 1.55M4.5 12h2.2M17.3 12h2.2"/>',
      5: '<circle cx="12" cy="12" r="4.5" fill="' + p.main + '"/><path fill="none" stroke="' + p.ray + '" stroke-width="2" stroke-linecap="round" d="M12 3.5v2.4M12 18.1v2.4M5.4 5.4l1.7 1.7M16.9 16.9l1.7 1.7M3.5 12h2.4M18.1 12h2.4M5.4 18.6l1.7-1.7M16.9 7.1l1.7-1.7"/>'
    };
    return '<svg class="' + cls + '"' + ns + ' viewBox="0 0 24 24" aria-hidden="true">' + shapes[v] + '</svg>';
  }

  const id = 'mi' + (++moodIconSeq);
  const p = {
    1: { a:'#a8b8d0', b:'#8498b8', drop:'#94a8c4', ray:'' },
    2: { a:'#bcc8dc', b:'#9aacc4', drop:'', ray:'' },
    3: { a:'#d0d8e8', b:'#b0bdd0', drop:'', ray:'#f5c4a8' },
    4: { a:'#f5c4a8', b:'#e8a882', drop:'', ray:'#fde8dc' },
    5: { a:'#f5c4a8', b:'#e07a52', drop:'', ray:'#fde8dc' }
  }[v];

  const defs = '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="' + p.a + '"/><stop offset="100%" stop-color="' + p.b + '"/></linearGradient></defs>';
  const g = 'url(#' + id + ')';

  const shapes = {
    1: '<path fill="' + g + '" d="M5.5 13.5c0-3.6 2.9-6.5 6.5-6.5 1.6 0 3 .6 4.1 1.6.9-1.7 2.7-2.8 4.7-2.5 2.8.3 5 2.7 5 5.4H5.5z"/><ellipse cx="9.5" cy="17.2" rx="1" ry="1.6" fill="' + p.drop + '"/><ellipse cx="12" cy="18" rx="1" ry="1.6" fill="' + p.drop + '"/><ellipse cx="14.5" cy="17.2" rx="1" ry="1.6" fill="' + p.drop + '"/>',
    2: '<ellipse cx="12" cy="14" rx="8.2" ry="4.6" fill="' + g + '"/><ellipse cx="7.8" cy="12.2" rx="4.2" ry="3.6" fill="' + g + '"/><ellipse cx="15.5" cy="11.8" rx="5" ry="3.8" fill="' + g + '"/>',
    3: '<circle cx="17.5" cy="8.5" r="3.8" fill="' + p.ray + '"/><ellipse cx="11" cy="14.2" rx="8" ry="4.5" fill="' + g + '"/><ellipse cx="6.5" cy="12.5" rx="4" ry="3.4" fill="' + g + '"/>',
    4: '<circle cx="12" cy="12" r="4.2" fill="' + g + '"/><path fill="none" stroke="' + p.ray + '" stroke-width="2" stroke-linecap="round" d="M12 4.5v2.2M12 17.3v2.2M6.2 6.2l1.55 1.55M16.25 16.25l1.55 1.55M4.5 12h2.2M17.3 12h2.2"/>',
    5: '<circle cx="12" cy="12" r="4.5" fill="' + g + '"/><path fill="none" stroke="' + p.ray + '" stroke-width="2" stroke-linecap="round" d="M12 3.5v2.4M12 18.1v2.4M5.4 5.4l1.7 1.7M16.9 16.9l1.7 1.7M3.5 12h2.4M18.1 12h2.4M5.4 18.6l1.7-1.7M16.9 7.1l1.7-1.7"/>'
  };

  return '<svg class="' + cls + '"' + ns + ' viewBox="0 0 24 24" aria-hidden="true">' + defs + shapes[v] + '</svg>';
}

const FEELINGS = ['Anxious','Tired','Hopeful','Overwhelmed','Calm','Sad','Grateful','Tense','Lonely','Proud','Numb','Steady'];

