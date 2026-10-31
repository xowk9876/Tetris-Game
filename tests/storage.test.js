import test from 'node:test';
import assert from 'node:assert/strict';
import { readBestScore, readAudioEnabled, savePreference } from '../src/utils/storage.js';
const storage = value => () => ({ getItem: () => value });
for (const value of [null,'NaN','Infinity','-10','1.5','100junk','9007199254740992','']) test(`invalid saved score ${value} falls back to zero`,()=>assert.equal(readBestScore(storage(value)),0));
test('valid best score is preserved',()=>assert.equal(readBestScore(storage('1200')),1200));
test('blocked storage never stops the game',()=>{const denied=()=>{throw new Error('SecurityError');};assert.equal(readBestScore(denied),0);assert.equal(readAudioEnabled(denied),true);assert.equal(savePreference('score',10,denied),false);});
test('audio preference round trips',()=>{let value=null;const s=()=>({getItem:()=>value,setItem:(key,v)=>value=v});assert.equal(readAudioEnabled(s),true);savePreference('tetrisAudioEnabled',false,s);assert.equal(readAudioEnabled(s),false);});
