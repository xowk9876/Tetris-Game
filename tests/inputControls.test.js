import test from 'node:test';
import assert from 'node:assert/strict';
import { createGesture, createRepeater } from '../src/utils/inputControls.js';
for (const [label,x,y,time,expected] of [['tap',2,3,80,'rotate'],['up',0,-80,200,'hold'],['flick down',0,100,100,'hardDrop'],['slow down',0,80,500,'softDrop']]) {
 test(label,()=>{const out=[],g=createGesture(a=>out.push(a));g.start(1,0,0,0);g.end(1,x,y,time);assert.deepEqual(out,[expected]);});
}
test('cancelled gesture never drops or rotates',()=>{const out=[],g=createGesture(a=>out.push(a));g.start(1,0,0,0);g.cancel();g.end(1,0,100,50);assert.deepEqual(out,[]);});
test('second pointer cannot steal or finish a gesture',()=>{const out=[],g=createGesture(a=>out.push(a));g.start(1,0,0,0);g.start(2,0,0,0);g.end(2,0,100,50);assert.deepEqual(out,[]);g.end(1,0,0,100);assert.deepEqual(out,['rotate']);});
test('horizontal swipe accumulates cells and never becomes a drop',()=>{const out=[],g=createGesture(a=>out.push(a));g.start(1,0,0,0);g.move(1,55,0);g.end(1,55,150,100);assert.deepEqual(out,['right','right']);});
test('repeat stops on release, replacement or cleanup with no orphan timers',()=>{
 const pending=new Map(),out=[];let id=0;
 const timers={setTimeout:fn=>{pending.set(++id,fn);return id;},clearTimeout:n=>pending.delete(n),setInterval:fn=>{pending.set(++id,fn);return id;},clearInterval:n=>pending.delete(n)};
 const repeat=createRepeater(a=>out.push(a),timers);repeat.start('left');assert.deepEqual(out,['left']);repeat.stop();assert.equal(pending.size,0);
 repeat.start('left');const [n,fn]=[...pending][0];pending.delete(n);fn();assert.equal(pending.size,1);
 repeat.start('right');assert.equal(pending.size,1);repeat.stop();repeat.stop();assert.equal(pending.size,0);assert.equal(out.at(-1),'right');
});
