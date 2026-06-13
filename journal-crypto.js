/* Journal encryption — Web Crypto API (AES-GCM + PBKDF2) */
'use strict';

const JOURNAL_VERIFIER = 'aurora-journal-v1';
const PBKDF2_ITERS = 120000;
const MIN_PASS_LEN = 4;

let journalKey = null;

function journalCryptoSupported(){
  return !!(window.crypto && crypto.subtle);
}

function b64FromBuf(buf){
  const bytes = new Uint8Array(buf);
  let s = '';
  for(let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

function bufFromB64(b64){
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for(let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

async function deriveJournalKey(passphrase, saltBuf){
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    'raw', enc.encode(passphrase), 'PBKDF2', false, ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: saltBuf, iterations: PBKDF2_ITERS, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encryptText(key, text){
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(text)
  );
  return { iv: b64FromBuf(iv), ct: b64FromBuf(ct) };
}

async function decryptText(key, ivB64, ctB64){
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(bufFromB64(ivB64)) },
    key,
    bufFromB64(ctB64)
  );
  return new TextDecoder().decode(plain);
}

function hasJournalVault(){
  return !!store.get('journalVault', null);
}

function isJournalUnlocked(){
  return !!journalKey;
}

function lockJournal(){
  journalKey = null;
}

async function setupJournalPasscode(passphrase){
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveJournalKey(passphrase, salt);
  const verifier = await encryptText(key, JOURNAL_VERIFIER);
  store.set('journalVault', { v: 1, salt: b64FromBuf(salt), verifier });
  await migratePlainJournal(key);
  journalKey = key;
}

async function unlockJournal(passphrase){
  const vault = store.get('journalVault', null);
  if(!vault) throw new Error('none');
  const key = await deriveJournalKey(passphrase, bufFromB64(vault.salt));
  const ok = await decryptText(key, vault.verifier.iv, vault.verifier.ct);
  if(ok !== JOURNAL_VERIFIER) throw new Error('bad');
  journalKey = key;
  await migratePlainJournal(key);
}

async function migratePlainJournal(key){
  const raw = store.get('journal', []);
  if(!raw.length || raw[0].ct) return;
  const encrypted = [];
  for(const e of raw){
    if(!e.text) continue;
    const { iv, ct } = await encryptText(key, e.text);
    encrypted.push({ id: e.id, date: e.date, dateKey: e.dateKey, iv, ct });
  }
  store.set('journal', encrypted);
}

async function getDecryptedJournal(){
  if(!journalKey) return [];
  const raw = store.get('journal', []);
  const out = [];
  for(const e of raw){
    if(!e.ct) continue;
    try{
      const text = await decryptText(journalKey, e.iv, e.ct);
      out.push({ id: e.id, date: e.date, dateKey: e.dateKey, text });
    }catch(err){ /* skip unreadable entries */ }
  }
  return out;
}

async function appendJournalEntry(text){
  if(!journalKey) throw new Error('locked');
  const { iv, ct } = await encryptText(journalKey, text);
  const entries = store.get('journal', []);
  entries.unshift({
    id: Date.now(),
    dateKey: todayKey(),
    iv,
    ct
  });
  store.set('journal', entries);
}

function removeJournalEntry(id){
  store.set('journal', store.get('journal', []).filter(e => e.id !== id));
}
