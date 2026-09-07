import test from 'node:test';
import assert from 'node:assert/strict';
import {installTouchRecovery} from '../src/touch.js';

class FakeTarget {
  constructor() { this.listeners = new Map(); this.visibilityState = 'visible'; }
  addEventListener(type, fn) { if (!this.listeners.has(type)) this.listeners.set(type, new Set()); this.listeners.get(type).add(fn); }
  removeEventListener(type, fn) { this.listeners.get(type)?.delete(fn); }
  dispatchEvent(event) {
    if (!event.target) event.target = this;
    for (const fn of [...(this.listeners.get(event.type) || [])]) fn(event);
    return true;
  }
}
class FakePointerEvent {
  constructor(type, init={}) { this.type=type; Object.assign(this, init); this.target=null; }
}
const pointer=(type,id,isPrimary=true,target=null)=>({type,pointerId:id,pointerType:'touch',isPrimary,clientX:10,clientY:20,target});

test('touch recovery cancels stale captured touches without disturbing normal ends', () => {
  const canvas=new FakeTarget(), doc=new FakeTarget(), win=new FakeTarget();
  win.document=doc; win.PointerEvent=FakePointerEvent;
  const cancelled=[]; canvas.addEventListener('pointercancel',e=>cancelled.push(e.pointerId));
  const dispose=installTouchRecovery(canvas,win);

  canvas.dispatchEvent(pointer('pointerdown',1,true));
  canvas.dispatchEvent(pointer('pointerdown',2,true));
  assert.deepEqual(cancelled,[1]);

  canvas.dispatchEvent(pointer('pointerup',2,true));
  canvas.dispatchEvent(pointer('lostpointercapture',2,true));
  assert.deepEqual(cancelled,[1]);

  canvas.dispatchEvent(pointer('pointerdown',3,true));
  canvas.dispatchEvent(pointer('lostpointercapture',3,true));
  assert.deepEqual(cancelled,[1,3]);

  canvas.dispatchEvent(pointer('pointerdown',4,true));
  doc.dispatchEvent(pointer('pointerup',4,true,doc));
  assert.deepEqual(cancelled,[1,3,4]);

  canvas.dispatchEvent(pointer('pointerdown',5,true));
  doc.visibilityState='hidden'; doc.dispatchEvent({type:'visibilitychange',target:doc});
  assert.deepEqual(cancelled,[1,3,4,5]);

  dispose();
});
