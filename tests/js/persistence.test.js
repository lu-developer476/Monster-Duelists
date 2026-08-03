import { describe, expect, it } from 'vitest';
import { createSavePayload, restoreMatch, saveMatch } from '../../core/static/core/js/game/persistence.js';
const match = { host: {}, guest: {}, turn: { number: 1 } };
const config = { initialHandSize: 2, deckMode: 'random', deckScope: 'all', deckTier: 'all' };
const storage = (raw = null) => { let value = raw; return { getItem: () => value, setItem: (_k,v) => { value=v; }, removeItem: () => { value=null; }, value: () => value }; };
describe('persistencia versionada', () => {
 it('guarda y restaura una partida válida', () => { const s=storage(); saveMatch(s,{match,matchConfig:config,roomCode:'x'}); expect(restoreMatch(s).ok).toBe(true); });
 it('descarta JSON corrupto', () => expect(restoreMatch(storage('{')).reason).toBe('corrupt'));
 it('rechaza campos ausentes', () => expect(restoreMatch(storage(JSON.stringify({schemaVersion:4}))).reason).toBe('invalid'));
 it('migra un guardado legacy', () => expect(restoreMatch(storage(JSON.stringify({match,roomCode:'x'}))).payload.schemaVersion).toBe(4));
 it('rechaza versión futura', () => expect(restoreMatch(storage(JSON.stringify({...createSavePayload({match,matchConfig:config}),schemaVersion:99}))).reason).toBe('invalid'));
 it('rechaza partida parcial', () => expect(restoreMatch(storage(JSON.stringify(createSavePayload({match:{host:{}},matchConfig:config})))).ok).toBe(false));
});
