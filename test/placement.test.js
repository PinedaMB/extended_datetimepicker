import test from 'node:test';
import assert from 'node:assert/strict';
import { popupPlacement } from '../src/js/modules/placement.js';

test('popup stays below when it fits', () => {
    assert.deepEqual(popupPlacement(500, 400, 300), { openAbove: false, maxHeight: 396 });
});

test('popup opens above when below is insufficient', () => {
    assert.deepEqual(popupPlacement(400, 100, 300), { openAbove: true, maxHeight: 396 });
});

test('oversized popup uses the larger side with internal scrolling', () => {
    assert.deepEqual(popupPlacement(250, 180, 600), { openAbove: true, maxHeight: 246 });
    assert.deepEqual(popupPlacement(180, 250, 600), { openAbove: false, maxHeight: 246 });
    assert.deepEqual(popupPlacement(-10, 2, 600), { openAbove: false, maxHeight: 0 });
});
