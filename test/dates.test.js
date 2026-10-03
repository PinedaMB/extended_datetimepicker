import test from 'node:test';
import assert from 'node:assert/strict';
import { parseDate, dateKey, isDateAllowed, shiftMonth } from '../src/js/modules/dates.js';
import { renderCalendar } from '../src/js/modules/calendar.js';
import { i18n } from '../src/js/modules/i18n.js';

test('strict dates and leap years', () => {
    for (const value of ['2026-02-29', '2026-04-31', '2026-13-01', '2026-1-01', null]) assert.equal(parseDate(value), null);
    assert.equal(dateKey(parseDate('2024-02-29')), '2024-02-29');
    assert.equal(dateKey(parseDate('0099-01-01')), '0099-01-01');
});
test('month navigation never overflows or mutates input', () => {
    const start = new Date(2026, 0, 31);
    assert.equal(dateKey(shiftMonth(start, 1)), '2026-02-01');
    assert.equal(dateKey(start), '2026-01-31');
    assert.equal(dateKey(shiftMonth(new Date(2026, 11, 31), 1)), '2027-01-01');
    assert.equal(dateKey(shiftMonth(new Date(2026, 2, 31), -1)), '2026-02-01');
});
test('all selection paths can share date restrictions', () => {
    const settings = { minDate: '2026-10-01', maxDate: '2026-10-31', disableWeekends: true, disabledDates: ['2026-10-05'] };
    for (const value of ['2026-09-30', '2026-11-01', '2026-10-03', '2026-10-05']) assert.equal(isDateAllowed(value, settings), false);
    assert.equal(isDateAllowed('2026-10-06', settings), true);
});
test('calendar exposes real buttons, disabled state and selected state', () => {
    let html;
    renderCalendar({ html: value => { html = value; } }, new Date(2026, 9, 1), { mode: 'single', themeColor: 'primary', disabledDates: ['2026-10-05'] }, ['2026-10-06'], null, null, i18n.es);
    assert.match(html, /<button type="button" disabled aria-label="2026-10-05"/);
    assert.match(html, /aria-label="2026-10-06" aria-pressed="true"/);
    assert.match(html, /aria-label="Mes anterior"/);
    assert.match(html, /aria-label="Mes siguiente"/);
    assert.equal((html.match(/<button/g) || []).length, (html.match(/<\/button>/g) || []).length);
});
