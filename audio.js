/* Ambient + Rest audio */
'use strict';

const A4 = 440;

/* ───────── Tools: ambient sounds (Breathe & Ground) ───────── */
/* Solfeggio + 432 Hz — Rest tab meditation tracks (sounds/{hz}.mp3) */
const SPIRIT_HZ = [
  { hz: 174, tag: 'Grounding',   meaning: 'Grounding · safety and ease in the body' },
  { hz: 285, tag: 'Renewal',     meaning: 'Renewal · gentle restoration' },
  { hz: 396, tag: 'Release',     meaning: 'Release · letting go of fear and worry' },
  { hz: 417, tag: 'Change',      meaning: 'Change · openness to what comes next' },
  { hz: 432, tag: 'Harmony',     meaning: 'Harmony · natural balance and calm' },
  { hz: 528, tag: 'Love',        meaning: 'Love · warmth, connection, and wholeness' },
  { hz: 639, tag: 'Connection',  meaning: 'Connection · harmony in relationships' },
  { hz: 741, tag: 'Clarity',     meaning: 'Clarity · intuition and honest expression' },
  { hz: 852, tag: 'Presence',    meaning: 'Presence · returning to inner stillness' },
  { hz: 963, tag: 'Awakening',   meaning: 'Awakening · spacious awareness' }
];

function hzTrackFile(hz){ return 'sounds/' + hz + 'hz.mp3'; }

function getSpiritHzEntry(hz){
  const n = hz != null ? hz : spiritHz;
  return SPIRIT_HZ.find(h => h.hz === n) || SPIRIT_HZ.find(h => h.hz === 528);
}

const SOUND_SOURCES = {
  soundbath: SITE.soundFiles.soundbath,
  meditation: SITE.soundFiles.meditation,
  ocean: {},
  rain: {}
};

const Ambient = {
  ctx: null,
  master: null,
  nodes: [],
  id: 'none',
  mediaEl: null,
  mediaFade: null,
  _warm: {},

  async ensure(){
    if(!this.boot()) return false;
    if(this.ctx.state === 'suspended') await this.ctx.resume();
    return this.ctx.state === 'running';
  },

  /* Sync setup — must run inside the user tap that starts Breathe/Ground (iOS Safari). */
  boot(){
    const AC = window.AudioContext || window.webkitAudioContext;
    if(!AC) return false;
    if(!this.ctx){
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0;
      this.master.connect(this.ctx.destination);
    }
    if(this.ctx.state === 'suspended') this.ctx.resume();
    this.warmMedia('soundbath');
    this.warmMedia('meditation');
    return true;
  },

  warmMedia(id){
    const file = SOUND_SOURCES[id]?.file;
    if(!file || this._warm[id]) return;
    const a = new Audio(file);
    a.preload = 'auto';
    a.load();
    this._warm[id] = a;
  },

  alreadyLive(id){
    if(this.id !== id) return false;
    if(this.mediaEl && !this.mediaEl.paused && this.mediaEl.readyState >= 2) return true;
    return this.nodes.length > 0;
  },

  startProceduralSync(id){
    if(this.mediaEl){
      const el = this.mediaEl;
      this.mediaEl = null;
      try { el.pause(); el.src = ''; } catch(e){}
    }
    if(!this.boot()) return;
    if(this.ctx.state === 'suspended') this.ctx.resume();
    this.build(id);
    const vol = id === 'soundbath' ? 0.62 : id === 'meditation' ? 0.58 : 0.42;
    this.fadeTo(vol, 1.6);
  },

  /* Synchronous — must run directly inside onclick (no await before play() on iOS). */
  playFromTap(id){
    if(id === 'none'){
      this.stop(false);
      this.id = 'none';
      return;
    }
    if(this.alreadyLive(id)) return;

    this.stop(false);
    this.id = id;
    this.boot();

    const src = SOUND_SOURCES[id];
    if(src?.file){
      const a = new Audio(src.file);
      a.loop = true;
      a.volume = 0;
      a.preload = 'auto';
      a.playsInline = true;
      a.setAttribute('playsinline', '');
      this.mediaEl = a;

      const fallback = () => {
        if(this.id !== id) return;
        if(this.mediaEl === a){
          this.mediaEl = null;
          try { a.pause(); a.src = ''; } catch(e){}
        }
        this.startProceduralSync(id);
      };

      a.addEventListener('playing', () => this.fadeMedia(src.vol, 1800), { once: true });
      a.addEventListener('error', fallback, { once: true });

      const p = a.play();
      if(p && typeof p.catch === 'function') p.catch(fallback);
      return;
    }

    this.startProceduralSync(id);
  },

  async start(id){
    this.playFromTap(id);
  },

  addReverb(inputGain){
    const delay = this.ctx.createDelay(2.5);
    delay.delayTime.value = 0.72;
    const fb = this.ctx.createGain();
    fb.gain.value = 0.38;
    const wet = this.ctx.createGain();
    wet.gain.value = 0.55;
    const dry = this.ctx.createGain();
    dry.gain.value = 0.65;
    inputGain.connect(dry);
    dry.connect(this.master);
    inputGain.connect(wet);
    wet.connect(delay);
    delay.connect(fb);
    fb.connect(delay);
    delay.connect(this.master);
    this.nodes.push(delay, fb, wet, dry);
  },

  addDrone(freq, vol, type, dest, opts){
    opts = opts || {};
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    if(opts.drift){
      const lfo = this.ctx.createOscillator();
      lfo.frequency.value = opts.driftRate || 0.035;
      const lg = this.ctx.createGain();
      lg.gain.value = opts.driftDepth || 1.2;
      lfo.connect(lg);
      lg.connect(osc.frequency);
      lfo.start();
      this.nodes.push(lfo, lg);
    }
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 1.8);
    if(opts.breathe){
      const bg = this.ctx.createOscillator();
      bg.frequency.value = opts.breatheRate || 0.022;
      const bgg = this.ctx.createGain();
      bgg.gain.value = vol * (opts.breatheDepth || 0.35);
      bg.connect(bgg);
      bgg.connect(g.gain);
      bg.start();
      this.nodes.push(bg, bgg);
    }
    osc.connect(g);
    g.connect(dest);
    osc.start();
    this.nodes.push(osc, g);
    return g;
  },

  noiseBuffer(seconds, color){
    const len = this.ctx.sampleRate * seconds;
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    let brown = 0;
    for(let i = 0; i < len; i++){
      const w = Math.random() * 2 - 1;
      if(color === 'brown'){
        brown = (brown + 0.02 * w) / 1.02;
        d[i] = brown * 4;
      } else if(color === 'pink'){
        b0 = 0.99886 * b0 + w * 0.0555179;
        b1 = 0.99332 * b1 + w * 0.0750759;
        b2 = 0.969 * b2 + w * 0.153852;
        b3 = 0.8665 * b3 + w * 0.3104856;
        b4 = 0.55 * b4 + w * 0.5329522;
        b5 = -0.7616 * b5 - w * 0.016898;
        d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
        b6 = w * 0.115926;
      } else {
        d[i] = w * 0.35;
      }
    }
    return buf;
  },

  loopNoise(color, vol, filterSetup){
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer(6, color);
    src.loop = true;
    const g = this.ctx.createGain();
    g.gain.value = vol;
    const filter = this.ctx.createBiquadFilter();
    filterSetup(filter);
    src.connect(filter);
    filter.connect(g);
    g.connect(this.master);
    src.start();
    this.nodes.push(src, filter, g);
  },

  buildSoundBath(root){
    root = root || A4;
    const bus = this.ctx.createGain();
    bus.gain.value = 1;
    const tone = this.ctx.createBiquadFilter();
    tone.type = 'lowpass';
    tone.frequency.value = 1100;
    tone.Q.value = 0.35;
    bus.connect(tone);
    const toneLfo = this.ctx.createOscillator();
    toneLfo.frequency.value = 0.016;
    const toneLfoG = this.ctx.createGain();
    toneLfoG.gain.value = 320;
    toneLfo.connect(toneLfoG);
    toneLfoG.connect(tone.frequency);
    toneLfo.start();
    this.nodes.push(tone, toneLfo, toneLfoG);
    this.addReverb(tone);
    [[root * 0.5, 0.048, 'sine', {drift:true, driftRate:0.028}],
     [root, 0.062, 'sine', {drift:true, driftDepth:0.9}],
     [root * 1.0015, 0.038, 'sine', {drift:true, driftRate:0.041}],
     [root * 0.9985, 0.038, 'sine', {drift:true, driftRate:0.039}],
     [root * 1.5, 0.028, 'triangle', {breathe:true}],
     [root * 2, 0.016, 'sine', {}],
     [root * 3, 0.008, 'sine', {}]].forEach(([f, v, type, opts]) => {
      this.addDrone(f, v, type, bus, opts);
    });
    const shimmer = this.ctx.createGain();
    shimmer.gain.value = 0.012;
    shimmer.connect(bus);
    const shSrc = this.ctx.createBufferSource();
    shSrc.buffer = this.noiseBuffer(6, 'pink');
    shSrc.loop = true;
    const shF = this.ctx.createBiquadFilter();
    shF.type = 'bandpass';
    shF.frequency.value = 2800;
    shF.Q.value = 0.55;
    shSrc.connect(shF);
    shF.connect(shimmer);
    shSrc.start();
    this.nodes.push(shSrc, shF, shimmer);
    this.loopNoise('pink', 0.018, f => {
      f.type = 'lowpass';
      f.frequency.value = 520;
      f.Q.value = 0.35;
    });
  },

  buildMeditation(root){
    root = root || A4;
    const bus = this.ctx.createGain();
    bus.gain.value = 1;
    const tone = this.ctx.createBiquadFilter();
    tone.type = 'lowpass';
    tone.frequency.value = 880;
    tone.Q.value = 0.4;
    bus.connect(tone);
    this.addReverb(tone);
    [[root * 0.5, 0.038, 'triangle', {breathe:true, breatheRate:0.018}],
     [root * 0.667, 0.042, 'triangle', {drift:true, driftRate:0.025}],
     [root * 0.833, 0.034, 'sine', {drift:true}],
     [root, 0.028, 'sine', {breathe:true}],
     [root * 1.25, 0.018, 'sine', {}],
     [root * 1.5, 0.012, 'sine', {}]].forEach(([f, v, type, opts]) => {
      this.addDrone(f, v, type, bus, opts);
    });
    this.loopNoise('brown', 0.014, f => {
      f.type = 'lowpass';
      f.frequency.value = 380;
    });
  },

  async startAtHz(hz){
    this.stop(false);
    this.id = 'hz-' + hz;
    if(!(await this.ensure())) return;
    this.buildSoundBath(hz);
    this.fadeTo(0.58, 2.2);
  },

  build(id){
    if(id === 'soundbath') this.buildSoundBath();
    else if(id === 'meditation') this.buildMeditation();
    else if(id === 'ocean'){
      this.loopNoise('brown', 0.38, f => { f.type = 'lowpass'; f.frequency.value = 520; f.Q.value = 0.6; });
      const lfo = this.ctx.createOscillator();
      lfo.frequency.value = 0.09;
      const lg = this.ctx.createGain();
      lg.gain.value = 0.07;
      lfo.connect(lg);
      lg.connect(this.master.gain);
      lfo.start();
      this.nodes.push(lfo, lg);
    } else if(id === 'rain'){
      this.loopNoise('pink', 0.32, f => { f.type = 'bandpass'; f.frequency.value = 1800; f.Q.value = 0.45; });
    }
  },

  fadeTo(level, sec){
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setValueAtTime(this.master.gain.value, t);
    this.master.gain.linearRampToValueAtTime(level, t + sec);
  },

  fadeMedia(to, ms){
    if(!this.mediaEl) return;
    const start = this.mediaEl.volume;
    const t0 = performance.now();
    cancelAnimationFrame(this.mediaFade);
    const step = now => {
      const p = Math.min((now - t0) / ms, 1);
      this.mediaEl.volume = start + (to - start) * p;
      if(p < 1) this.mediaFade = requestAnimationFrame(step);
    };
    this.mediaFade = requestAnimationFrame(step);
  },

  stop(fade){
    if(this.mediaFade) cancelAnimationFrame(this.mediaFade);
    if(this.mediaEl){
      const el = this.mediaEl;
      this.mediaEl = null;
      if(fade !== false){
        this.fadeMedia(0, 600);
        setTimeout(() => { el.pause(); el.src = ''; }, 650);
      } else {
        el.pause();
        el.src = '';
      }
    }
    if(!this.ctx || !this.master) return;
    if(fade !== false){
      this.fadeTo(0, 0.8);
      const nodes = this.nodes.slice();
      setTimeout(() => {
        nodes.forEach(n => { try{ n.stop && n.stop(); n.disconnect(); }catch(e){} });
      }, 850);
    } else {
      this.nodes.forEach(n => { try{ n.stop && n.stop(); n.disconnect(); }catch(e){} });
    }
    this.nodes = [];
    if(fade === false && this.master) this.master.gain.value = 0;
    this.id = 'none';
  }
};

let toolSound = store.get('toolSound', store.get('breathSound', 'none'));
if(toolSound === 'pad') toolSound = 'meditation';
if(toolSound === 'bowl') toolSound = 'soundbath';
store.set('toolSound', toolSound);

function pickSound(id){
  toolSound = id;
  store.set('toolSound', id);
  document.querySelectorAll('#pane-breathe .sound-opt, #pane-ground .sound-opt').forEach(b =>
    b.classList.toggle('sel', b.dataset.sound === id)
  );
  const breathePane = document.getElementById('pane-breathe')?.classList.contains('active');
  const groundPane = document.getElementById('pane-ground')?.classList.contains('active');
  if(id === 'none'){
    if(!restActive) Ambient.stop();
    return;
  }
  if(breathTimer || groundActive || ((breathePane || groundPane) && !restActive)){
    Ambient.playFromTap(id);
  }
}

function initToolSound(){
  document.querySelectorAll('#pane-breathe .sound-opt, #pane-ground .sound-opt').forEach(b =>
    b.classList.toggle('sel', b.dataset.sound === toolSound)
  );
}

/* ───────── Tools: rest ───────── */
let spiritHz = store.get('spiritHz', 528);
if(!SPIRIT_HZ.some(h => h.hz === +spiritHz)) spiritHz = 528;
store.set('spiritHz', spiritHz);

let restTimer = null;
let restActive = false;
let restRemaining = 0;
let restTotal = 0;
let restDuration = store.get('restDuration', 5);
let restDoneVisible = false;

const RestAudio = {
  el: null,
  elB: null,
  fade: null,
  loopListener: null,
  targetVol: 0.72,
  fadeInMs: 3200,
  fadeOutMs: 2000,
  loopCrossfadeSec: 4,

  ease(p){
    return p * p * (3 - 2 * p);
  },

  fadeVol(el, to, ms, onDone){
    if(!el) return;
    const start = el.volume;
    const t0 = performance.now();
    if(this.fade) cancelAnimationFrame(this.fade);
    const step = now => {
      const p = Math.min((now - t0) / ms, 1);
      el.volume = start + (to - start) * this.ease(p);
      if(p < 1) this.fade = requestAnimationFrame(step);
      else if(onDone) onDone();
    };
    this.fade = requestAnimationFrame(step);
  },

  clearLoopListener(){
    if(this.loopListener && this.el){
      this.el.removeEventListener('timeupdate', this.loopListener);
    }
    this.loopListener = null;
  },

  attachSeamlessLoop(a){
    this.clearLoopListener();
    const cross = this.loopCrossfadeSec;
    this.loopListener = () => {
      if(!restActive || restRemaining <= 0 || this.el !== a) return;
      const dur = a.duration;
      if(!dur || isNaN(dur) || dur <= cross + 2) return;
      if(a.currentTime < dur - cross) return;
      if(this.elB) return;
      const b = new Audio(a.src);
      b.preload = 'auto';
      b.volume = 0;
      this.elB = b;
      b.play().catch(() => { this.elB = null; });
      const t0 = performance.now();
      const ms = cross * 1000;
      const startA = a.volume;
      const tick = now => {
        const p = Math.min((now - t0) / ms, 1);
        const e = this.ease(p);
        if(a) a.volume = startA * (1 - e);
        if(b) b.volume = this.targetVol * e;
        if(p < 1) requestAnimationFrame(tick);
        else{
          try{ a.pause(); }catch(e){}
          this.el = b;
          this.elB = null;
          b.volume = this.targetVol;
          this.attachSeamlessLoop(b);
        }
      };
      requestAnimationFrame(tick);
    };
    a.addEventListener('timeupdate', this.loopListener);
  },

  stop(fade){
    if(this.fade) cancelAnimationFrame(this.fade);
    this.clearLoopListener();
    const els = [this.el, this.elB].filter(Boolean);
    this.el = null;
    this.elB = null;
    if(!els.length) return;
    if(fade === false){
      els.forEach(el => { el.pause(); el.src = ''; });
      return;
    }
    const ms = this.fadeOutMs;
    els.forEach(el => {
      const start = el.volume;
      const t0 = performance.now();
      const step = now => {
        const p = Math.min((now - t0) / ms, 1);
        el.volume = start * (1 - this.ease(p));
        if(p < 1) requestAnimationFrame(step);
        else { el.pause(); el.src = ''; }
      };
      requestAnimationFrame(step);
    });
  },

  async start(hz){
    this.stop(false);
    const a = new Audio(hzTrackFile(hz));
    a.loop = false;
    a.preload = 'auto';
    this.el = a;
    try{
      await a.play();
      a.volume = 0;
      await new Promise(resolve => {
        if(a.duration && !isNaN(a.duration)) resolve();
        else a.addEventListener('loadedmetadata', resolve, { once: true });
      });
      const dur = a.duration;
      const sessionSec = restDuration * 60;
      if(dur && !isNaN(dur) && dur < sessionSec + 30){
        this.attachSeamlessLoop(a);
      }else{
        a.loop = true;
      }
      this.fadeVol(a, this.targetVol, this.fadeInMs);
      return true;
    }catch(e){
      this.el = null;
      return false;
    }
  }
};

function pickSpiritHz(hz){
  spiritHz = +hz;
  store.set('spiritHz', spiritHz);
  updateSpiritHzUI();
  if(restActive) startRestAudio();
}

function updateSpiritHzUI(){
  const e = getSpiritHzEntry();
  const el = document.getElementById('spiritHzMeaning');
  if(el) el.textContent = e.meaning;
}

function initSpiritHz(){
  const sel = document.getElementById('spiritHzSelect');
  if(!sel) return;
  sel.innerHTML = SPIRIT_HZ.map(h =>
    `<option value="${h.hz}">${h.hz} Hz · ${h.tag}</option>`
  ).join('');
  sel.value = String(spiritHz);
  updateSpiritHzUI();
}

async function startRestAudio(){
  Ambient.stop(false);
  if(await RestAudio.start(spiritHz)) return;
  await Ambient.startAtHz(spiritHz);
}

function stopRestAudio(fade){
  RestAudio.stop(fade);
  Ambient.stop(fade);
}

function updateRestActiveHint(){
  const e = getSpiritHzEntry();
  const hint = document.getElementById('restActiveHint');
  if(hint) hint.textContent = e.hz + ' Hz · ' + e.tag + ' — just space and music. End early anytime.';
}

function formatRestTime(sec){
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m + ':' + (s < 10 ? '0' : '') + s;
}

function updateRestRing(){
  const pct = restTotal ? ((restTotal - restRemaining) / restTotal * 100) : 0;
  const fill = document.getElementById('restRingFill');
  if(fill) fill.style.setProperty('--progress', pct + '%');
  const timeEl = document.getElementById('restTime');
  if(timeEl) timeEl.textContent = formatRestTime(restRemaining);
}

function updateRestIdleDisplay(){
  if(restActive) return;
  restRemaining = restDuration * 60;
  const timeEl = document.getElementById('restTime');
  if(timeEl) timeEl.textContent = restDuration + ':00';
  const status = document.getElementById('restStatus');
  if(status) status.textContent = 'Ready';
  const fill = document.getElementById('restRingFill');
  if(fill) fill.style.setProperty('--progress', '0%');
}

function pickRestDuration(min){
  if(restActive) return;
  restDuration = min;
  store.set('restDuration', min);
  document.querySelectorAll('.rest-dur').forEach(b =>
    b.classList.toggle('sel', +b.dataset.min === min)
  );
  updateRestIdleDisplay();
}

function initRest(){
  document.querySelectorAll('.rest-dur').forEach(b =>
    b.classList.toggle('sel', +b.dataset.min === restDuration)
  );
  initSpiritHz();
  updateRestIdleDisplay();
}

function setRestView(idle, active, done){
  document.getElementById('restIdle').style.display = idle ? 'block' : 'none';
  document.getElementById('restActive').style.display = active ? 'block' : 'none';
  document.getElementById('restDone').style.display = done ? 'block' : 'none';
  document.getElementById('restStage').classList.toggle('running', active);
  const sel = document.getElementById('spiritHzSelect');
  if(sel) sel.disabled = active;
  document.querySelectorAll('.rest-dur').forEach(b => { b.disabled = active; });
  restDoneVisible = done;
}

function startRest(){
  restTotal = restDuration * 60;
  restRemaining = restTotal;
  restActive = true;
  setRestView(false, true, false);
  document.getElementById('restStatus').textContent = getSpiritHzEntry().hz + ' Hz';
  document.getElementById('restBtn').textContent = 'End Early';
  updateRestActiveHint();
  startRestAudio();
  updateRestRing();
  restTimer = setInterval(() => {
    restRemaining--;
    updateRestRing();
    if(restRemaining <= 0) completeRest();
  }, 1000);
}

function completeRest(){
  if(restTimer){ clearInterval(restTimer); restTimer = null; }
  restActive = false;
  stopRestAudio();
  document.getElementById('restStatus').textContent = 'Complete';
  setRestView(false, false, true);
  document.getElementById('restBtn').textContent = 'Rest Again';
}

function stopRest(reset){
  if(restTimer){ clearInterval(restTimer); restTimer = null; }
  if(restActive){
    restActive = false;
    stopRestAudio();
  }
  if(reset){
    setRestView(true, false, false);
    document.getElementById('restBtn').textContent = 'Begin Rest';
    updateRestIdleDisplay();
  }
}

function restBtnClick(){
  if(restDoneVisible){
    startRest();
    return;
  }
  if(restActive) stopRest(true);
  else startRest();
}

