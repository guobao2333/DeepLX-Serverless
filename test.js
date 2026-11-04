/**
 * translate() 回归测试（需要能访问 oneshot-free.www.deepl.com）
 *
 * 覆盖的故障：v4.0.0 把语言码转成大写后发给 oneshot 接口，
 * 接口不报错、HTTP 仍为 200，但把原文当译文返回。
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { translate } from './src/translate.js';

const EN = 'Hello, world. This is a test.';
const CJK = /[\u4e00-\u9fa5]/;

test('target_lang=ZH 返回中文译文，而不是回显原文', async () => {
  const r = await translate(EN, undefined, 'ZH');
  assert.equal(r.code, 200);
  assert.notEqual(r.data, EN);
  assert.match(r.data, CJK);
});

test('target_lang 大小写与区域变体都能翻译', async () => {
  for (const target of ['zh-Hans', 'ZH-HANS', 'zh-hans', 'ZH-CN', 'zh']) {
    const r = await translate(EN, undefined, target);
    assert.equal(r.code, 200, `target=${target}`);
    assert.notEqual(r.data, EN, `target=${target} 回显了原文`);
    assert.match(r.data, CJK, `target=${target}`);
  }
});

test('target_lang=ZH-TW 走繁体中文', async () => {
  const r = await translate(EN, undefined, 'ZH-TW');
  assert.equal(r.code, 200);
  assert.notEqual(r.data, EN);
  assert.match(r.data, CJK);
});

test('target_lang=DE 返回德语，不再回显原文', async () => {
  const r = await translate(EN, 'EN', 'DE');
  assert.equal(r.code, 200);
  assert.notEqual(r.data, EN);
});

test('响应回显调用方传入的语言写法（与 v3.x 一致）', async () => {
  const r = await translate(EN, 'EN', 'ZH');
  assert.equal(r.target_lang, 'ZH');
  assert.equal(r.source_lang, 'EN');
});

test('源语言为 AUTO 时回显检测到的语言（大写）', async () => {
  const r = await translate(EN, 'AUTO', 'JA');
  assert.equal(r.code, 200);
  assert.equal(r.source_lang, 'EN');
  assert.equal(r.target_lang, 'JA');
});

test('无法识别的目标语言返回 400，不落到上游', async () => {
  const r = await translate(EN, undefined, 'JP');
  assert.equal(r.code, 400);
});

test('空文本返回 400', async () => {
  const r = await translate('   ', undefined, 'ZH');
  assert.equal(r.code, 400);
});
