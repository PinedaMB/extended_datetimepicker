import test from 'node:test';
import assert from 'node:assert/strict';
import { popupPlacement, horizontalPlacement } from '../src/js/modules/placement.js';

test('popup stays below when it fits', () => {
    assert.deepEqual(popupPlacement(500, 400, 300), { openAbove: false, maxHeight: 396 });
});

test('popup keeps its own width even when the input is narrow', () => {
    assert.equal(horizontalPlacement(100, 180, 650, 1200), 100);
});

test('popup aligns to the right edge near the viewport boundary', () => {
    assert.equal(horizontalPlacement(1000, 1100, 650, 1200), 450);
});

test('popup clamps both edges and handles a panel wider than the screen', () => {
    assert.equal(horizontalPlacement(-20, 100, 340, 1200), 8);
    assert.equal(horizontalPlacement(450, 500, 650, 700), 8);
    assert.equal(horizontalPlacement(200, 280, 650, 320), 8);
    assert.equal(horizontalPlacement(1190, 1300, 340, 1200), 852);
});

test('popup opens above when below is insufficient', () => {
    assert.deepEqual(popupPlacement(400, 100, 300), { openAbove: true, maxHeight: 396 });
});

test('oversized popup uses the larger side with internal scrolling', () => {
    assert.deepEqual(popupPlacement(250, 180, 600), { openAbove: true, maxHeight: 246 });
    assert.deepEqual(popupPlacement(180, 250, 600), { openAbove: false, maxHeight: 246 });
    assert.deepEqual(popupPlacement(-10, 2, 600), { openAbove: false, maxHeight: 0 });
});
