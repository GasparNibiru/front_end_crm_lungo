const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8');
const factory = vm.runInNewContext(source.slice(source.indexOf('  function createTrainingProgressSaver('), source.indexOf('  function saveTrainingPlayback(')) + '\ncreateTrainingProgressSaver');
function setup(send) {
  const calls = [], errors = [];
  return { calls, errors, saver: factory(async payload => { calls.push(payload); return send ? send(payload) : {}; }, () => {}, e => errors.push(e)) };
}
test('paused player does not repeatedly write unchanged progress', async () => {
  const { saver, calls } = setup();
  saver.sample(100, 0, false, 0); await saver.flush();
  for (let t = 3000; t <= 60000; t += 3000) { saver.sample(100, 0, false, t); await saver.flush(); }
  assert.equal(calls.length, 1);
});
test('12 second batches preserve time and pause flush includes final seconds', async () => {
  const { saver, calls } = setup();
  saver.sample(100, 0, true, 0); await saver.flush();
  for (let t = 3; t <= 12; t += 3) saver.sample(100, t, true, t * 1000);
  await saver.flush();
  saver.sample(100, 14, false, 14000); await saver.flush();
  assert.equal(calls.length, 3);
  assert.equal(calls.reduce((sum, p) => sum + p.watchedSecondsDelta, 0), 14);
});
test('seek does not count skipped content as watched; replay counts movement', async () => {
  const { saver, calls } = setup();
  saver.sample(100, 0, true, 0);
  saver.sample(100, 80, true, 3000); await saver.flush();
  assert.equal(calls[0].watchedSecondsDelta, 0);
  saver.sample(100, 10, true, 4000);
  saver.sample(100, 13, false, 7000); await saver.flush();
  assert.equal(calls[1].watchedSecondsDelta, 3);
});
test('close during in-flight save queues final snapshot without overlapping calls', async () => {
  let release, active = 0, peak = 0;
  const { saver, calls } = setup(async () => { active++; peak = Math.max(peak, active); if (calls.length === 1) await new Promise(r => release = r); active--; return {}; });
  saver.sample(100, 0, true, 0);
  const first = saver.flush(); await Promise.resolve();
  saver.sample(100, 3, false, 3000); const final = saver.flush();
  release(); await Promise.all([first, final]);
  assert.equal(peak, 1); assert.equal(calls.length, 2);
  assert.equal(calls[1].currentTime, 3); assert.equal(calls[1].watchedSecondsDelta, 3);
});
test('failed save retains unsaved seconds for a subsequent attempt', async () => {
  const { saver, calls, errors } = setup(() => { if (calls.length === 1) throw Error('offline'); return {}; });
  saver.sample(100, 0, true, 0); saver.sample(100, 12, false, 12000);
  await saver.flush(); await saver.flush();
  assert.equal(errors.length, 1); assert.equal(calls[1].watchedSecondsDelta, 12);
});
test('fast playback respects backend 15 second per-request cap without dropping seconds', async () => {
  const { saver, calls } = setup();
  saver.sample(100, 0, true, 0, 2); saver.sample(100, 24, false, 12000, 2);
  await saver.flush();
  assert.deepEqual(calls.map(p => p.watchedSecondsDelta), [15, 9]);
});

test('real player integration sends five periodic writes per minute and none while paused', async () => {
  let now = 0, currentTime = 0, state = 1;
  const calls = [];
  const playback = { id: 'lesson', token: 'synthetic', player: {
    getDuration: () => 600, getCurrentTime: () => currentTime,
    getPlayerState: () => state, getPlaybackRate: () => 1
  } };
  const context = vm.createContext({ performance: { now: () => now }, trainingPlayback: playback,
    $: () => null, window: { YT: { PlayerState: { PLAYING: 1 } }, LungoSupervisorApi: {
      updateTrainingProgress: async (id, payload, token) => { assert.equal(token, 'synthetic'); calls.push(payload); return { progress: { percent: 10 } }; }
    } } });
  vm.runInContext(source.slice(source.indexOf('  function createTrainingProgressSaver('), source.indexOf('  function closeTrainingPlayer(')), context);
  await context.saveTrainingPlayback(0, playback);
  for (now = 3000; now <= 60000; now += 3000) { currentTime = now / 1000; await context.saveTrainingPlayback(null, playback); }
  assert.equal(calls.length, 6);
  assert.equal(calls.reduce((sum, p) => sum + p.watchedSecondsDelta, 0), 60);
  state = 2; await context.saveTrainingPlayback(0, playback);
  for (now = 63000; now <= 120000; now += 3000) await context.saveTrainingPlayback(null, playback);
  assert.equal(calls.length, 6);
  state = 1; await context.saveTrainingPlayback(0, playback);
  now += 2000; currentTime += 2;
  await context.saveTrainingPlayback(0, playback);
  assert.equal(calls.at(-1).watchedSecondsDelta, 2);
});
