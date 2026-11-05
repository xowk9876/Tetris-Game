import assert from 'node:assert/strict';
import test from 'node:test';
import { getEventListeners } from 'node:events';
import { registerHooks } from 'node:module';
import Emitter from 'phaser/src/events/EventEmitter.js';

// Load the real Scene and lifecycle events without the DOM-dependent Phaser renderer.
const sceneUrl = import.meta.resolve('phaser/src/scene/Scene.js');
const eventsUrl = import.meta.resolve('phaser/src/scene/events/index.js');
const nodePhaser = `import Scene from '${sceneUrl}'; import Events from '${eventsUrl}'; export default { Scene, Scenes: { Events } };`;
const hook = registerHooks({
    resolve(specifier, context, next) {
        if (specifier !== 'phaser') return next(specifier, context);
        return { url: 'data:text/javascript,' + encodeURIComponent(nodePhaser), shortCircuit: true };
    }
});
const { default: TetrisScene, TetrisRenderer } = await import('../src/utils/gameClassesFull.js');
hook.deregister();

function setup(t, muted = true) {
    globalThis.window = new EventTarget();
    globalThis.document = new EventTarget();
    const media = [];
    globalThis.Audio = class {
        constructor() { this.paused = true; media.push(this); }
        play() { this.paused = false; return new Promise(() => {}); }
        pause() { this.paused = true; }
        removeAttribute(name) { delete this[name]; }
        load() {}
    };
    t.after(() => {
        delete globalThis.window;
        delete globalThis.document;
        delete globalThis.Audio;
    });
    t.mock.method(TetrisRenderer.prototype, 'update', () => {});
    const scene = new TetrisScene();
    scene.soundEnabled = !muted;
    scene.events = new Emitter();
    scene.game = { events: new Emitter() };
    scene.tweens = { pauseAll() {}, resumeAll() {} };
    scene.showOverlay = () => [];
    scene.create();
    return { scene, media };
}

function key(type, code, repeat = false) {
    window.dispatchEvent(Object.assign(new Event(type, { cancelable: true }), { code, repeat }));
}

test('a down-arrow tap between frames moves one cell, with repeats only while held', t => {
    const { scene } = setup(t);
    const piece = scene.gameState.currentBlock;
    key('keydown', 'ArrowDown');
    key('keyup', 'ArrowDown');
    assert.equal(piece.y, 1);
    scene.update(0, 16);
    assert.equal(piece.y, 1);
    key('keydown', 'ArrowDown');
    key('keydown', 'ArrowDown', true);
    assert.equal(piece.y, 2);
    scene.update(0, 29);
    assert.equal(piece.y, 2);
    scene.update(0, 1);
    assert.equal(piece.y, 3);
    key('keyup', 'ArrowDown');
});

test('restart and final destruction release native handlers and pending media', t => {
    const { scene, media } = setup(t, false);
    const checkListeners = expected => {
        for (const event of ['keydown', 'keyup', 'blur', 'storage']) {
            assert.equal(getEventListeners(window, event).length, expected, event);
        }
        assert.equal(getEventListeners(document, 'visibilitychange').length, expected);
        assert.equal(scene.events.listenerCount('destroy'), expected);
        assert.equal(scene.events.listenerCount('shutdown'), expected);
    };
    checkListeners(1);
    assert.equal(media.length, 1);
    assert.ok(scene.gameState.canAct());
    for (const event of ['shutdown', 'destroy']) {
        scene.events.emit(event);
        checkListeners(0);
        assert.ok(media.every(track => track.paused && !track.src));
        if (event === 'shutdown') {
            scene.create();
            checkListeners(1);
            assert.equal(media.filter(track => !track.paused).length, 1);
        }
    }
});

test('a muted start, pause, and game over never start background sound', t => {
    const { scene, media } = setup(t);
    assert.ok(scene.gameState.canAct());
    scene.executeAction('hardDrop');
    assert.equal(media.length, 0);
    scene.toggleAudio();
    const music = media[0];
    assert.equal(music.paused, false);
    scene.setPaused(true);
    assert.ok(music.paused);
    scene.toggleAudio();
    scene.toggleAudio();
    assert.ok(music.paused);
    scene.setPaused(false);
    assert.equal(music.paused, false);
    scene.gameOver();
    assert.ok(music.paused);
    scene.toggleAudio();
    assert.ok(media.every(track => track.paused));
    scene.toggleAudio();
    assert.ok(music.paused);
});

test('autoplay denial can recover on the next gameplay input', async t => {
    const { scene, media } = setup(t);
    const play = t.mock.method(Audio.prototype, 'play', () => Promise.reject(new Error('autoplay blocked')), { times: 1 });
    scene.toggleAudio();
    await Promise.resolve();
    assert.ok(media[0].paused);
    assert.equal(play.mock.callCount(), 1);
    key('keydown', 'ArrowRight');
    assert.equal(media[0].paused, false);
});
