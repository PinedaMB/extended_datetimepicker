(function ($) {
    'use strict';

    function parseDate(value) {
        if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
        const [year, month, day] = value.split('-').map(Number);
        const date = new Date(0);
        date.setFullYear(year, month - 1, day);
        date.setHours(0, 0, 0, 0);
        return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null;
    }

    function isDateAllowed(value, settings) {
        const date = parseDate(value);
        return !!date && !(settings.minDate && value < settings.minDate)
            && !(settings.maxDate && value > settings.maxDate)
            && !(settings.disableWeekends && [0, 6].includes(date.getDay()))
            && !(Array.isArray(settings.disabledDates) && settings.disabledDates.includes(value));
    }

    function shiftMonth(date, amount) {
        const result = new Date(date);
        result.setDate(1);
        result.setMonth(result.getMonth() + amount);
        return result;
    }

    // Keep the popup inside the available viewport without moving the page.
    function popupPlacement(spaceAbove, spaceBelow, height, gap = 4) {
        const above = Math.max(0, spaceAbove - gap);
        const below = Math.max(0, spaceBelow - gap);
        const openAbove = height > below && above > below;
        return { openAbove, maxHeight: openAbove ? above : below };
    }

    function renderCalendar($container, currentDate, settings, selectedDates, hoverDate, $, i18nData) {
        if (settings.doubleMonth) {
            const nextMonthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);

            const month1Html = buildSingleMonthHtml(currentDate, settings, selectedDates, hoverDate, i18nData, 'first');
            const month2Html = buildSingleMonthHtml(nextMonthDate, settings, selectedDates, hoverDate, i18nData, 'second');

            const doubleMonthHtml = `
            <div class="dtp-calendar-wrapper d-flex gap-4">
                <div class="dtp-month-container flex-fill">${month1Html}</div>
                <div class="dtp-month-container flex-fill border-start ps-4">${month2Html}</div>
            </div>
        `;
            $container.html(doubleMonthHtml);
        } else {
            const singleMonthHtml = buildSingleMonthHtml(currentDate, settings, selectedDates, hoverDate, i18nData, 'single');
            // AHORA ENVOLVEMOS SIEMPRE EN .dtp-month-container
            $container.html(`
            <div class="dtp-calendar-wrapper">
                <div class="dtp-month-container w-100">${singleMonthHtml}</div>
            </div>
        `);
        }
    }

    function buildSingleMonthHtml(dateObj, settings, selectedDates, hoverDate, i18nData, position = 'single') {
        const year = dateObj.getFullYear();
        const month = dateObj.getMonth();

        const monthNames = (i18nData && i18nData.calendar && i18nData.calendar.months)
            ? i18nData.calendar.months
            : ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

        const dayNames = (i18nData && i18nData.calendar && i18nData.calendar.weekdaysShort)
            ? i18nData.calendar.weekdaysShort
            : ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'];

        const firstDayIndex = new Date(year, month, 1).getDay();
        const totalDays = new Date(year, month + 1, 0).getDate();
        const prevMonthDays = new Date(year, month, 0).getDate();

        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

        let showPrev = position === 'single' || position === 'first';
        let showNext = position === 'single' || position === 'second';

        let headerHtml = `
        <div class="d-flex align-items-center justify-content-between mb-3 w-100">
            <div>
                ${showPrev ? `
                    <button type="button" class="btn btn-sm bg-body-tertiary text-body rounded-circle dtp-prev p-0 d-flex align-items-center justify-content-center" aria-label="${i18nData.calendar.previous || 'Previous month'}" style="width: 32px; height: 32px;">
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/></svg>
                    </button>` : '<div style="width: 32px;"></div>'}
            </div>
            <div class="fw-bold text-body fs-6 text-center">${monthNames[month]} ${year}</div>
            <div>
                ${showNext ? `
                    <button type="button" class="btn btn-sm bg-body-tertiary text-body rounded-circle dtp-next p-0 d-flex align-items-center justify-content-center" aria-label="${i18nData.calendar.next || 'Next month'}" style="width: 32px; height: 32px;">
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1 .708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/></svg>
                    </button>` : '<div style="width: 32px;"></div>'}
            </div>
        </div>
    `;

        let daysHeaderHtml = '<div class="dtp-weekdays-grid mb-2 text-center fw-medium text-body-secondary fs-7">';
        dayNames.forEach(day => {
            daysHeaderHtml += `<div class="d-flex align-items-center justify-content-center">${day}</div>`;
        });
        daysHeaderHtml += '</div>';

        let daysGridHtml = '<div class="dtp-days-grid text-center align-items-center">';
        let dayCount = 1;
        let nextMonthDayCount = 1;

        for (let i = 0; i < 42; i++) {
            if (i < firstDayIndex) {
                const prevDayNum = prevMonthDays - firstDayIndex + i + 1;
                daysGridHtml += `
                <div class="py-1 text-body-secondary opacity-25 fs-7 d-flex align-items-center justify-content-center">
                    <div style="width: 32px; height: 32px;" class="d-flex align-items-center justify-content-center">
                        ${prevDayNum}
                    </div>
                </div>`;
            } else if (dayCount <= totalDays) {
                const formattedMonth = String(month + 1).padStart(2, '0');
                const formattedDay = String(dayCount).padStart(2, '0');
                const dateKey = `${year}-${formattedMonth}-${formattedDay}`;

                const currentObj = new Date(year, month, dayCount);
                currentObj.getDay();
                const isDisabled = !isDateAllowed(dateKey, settings);

                let isSelected = selectedDates.includes(dateKey);
                let isInRange = false;
                let isRangeStart = false;
                let isRangeEnd = false;

                if (settings.mode === 'range' && !isDisabled) {
                    if (selectedDates.length === 2) {
                        const start = selectedDates[0];
                        const end = selectedDates[1];
                        isInRange = dateKey > start && dateKey < end;
                        isRangeStart = dateKey === start;
                        isRangeEnd = dateKey === end;
                    } else if (selectedDates.length === 1 && hoverDate) {
                        const start = selectedDates[0];
                        const min = start < hoverDate ? start : hoverDate;
                        const max = start < hoverDate ? hoverDate : start;

                        isInRange = dateKey > min && dateKey < max;
                        isRangeStart = dateKey === min;
                        isRangeEnd = dateKey === max;
                    }
                }

                let classes = 'dtp-day rounded-circle fs-7 user-select-none d-flex align-items-center justify-content-center mx-auto ';

                if (isDisabled) {
                    classes += 'text-body-secondary opacity-50 pe-none ';
                } else if (isSelected || isRangeStart || isRangeEnd) {
                    classes += `dtp-selected bg-${settings.themeColor} text-white fw-bold shadow-sm `;
                } else if (isInRange) {
                    classes += `bg-${settings.themeColor}-subtle text-${settings.themeColor} fw-medium `;
                } else if (dateKey === todayStr) {
                    classes += `border border-${settings.themeColor} fw-bold text-${settings.themeColor} `;
                } else {
                    classes += 'text-body ';
                }

                daysGridHtml += `
                <div class="py-1 d-flex align-items-center justify-content-center">
                    <button type="button" ${isDisabled ? 'disabled' : ''} aria-label="${dateKey}" aria-pressed="${isSelected}" class="border-0 ${classes}" style="width: 32px; height: 32px; ${isDisabled ? '' : 'cursor: pointer;'}" data-date="${dateKey}">
                        ${dayCount}
                    </button>
                </div>`;
                dayCount++;
            } else {
                daysGridHtml += `
                <div class="py-1 text-body-secondary opacity-25 fs-7 d-flex align-items-center justify-content-center">
                    <div style="width: 32px; height: 32px;" class="d-flex align-items-center justify-content-center">
                        ${nextMonthDayCount}
                    </div>
                </div>`;
                nextMonthDayCount++;
            }
        }
        daysGridHtml += '</div>';

        return headerHtml + daysHeaderHtml + daysGridHtml;
    }

    function initClock($parent, settings, $, i18nData, onTimeChange) {
        let $clockWrapper = $parent.find('.dtp-clock-wrapper');
        if ($clockWrapper.length > 0) {
            $clockWrapper.remove();
        }

        const lang = i18nData.clock;
        const is24h = settings.format24h;
        const isRange = settings.mode === 'range';

        const arrowUp = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chevron-up" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M7.646 4.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1-.708.708L8 5.707l-5.646 5.647a.5.5 0 0 1-.708-.708z"/></svg>`;
        const arrowDown = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chevron-down" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708"/></svg>`;

        // --- LÓGICA DE PARSEO DE defaultTime ---
        const parseTime = (timeStr, defaultH, defaultM) => {
            if (typeof timeStr === 'string') {
                const parts = timeStr.split(':');
                if (parts.length === 2 && /^\d{2}:\d{2}$/.test(timeStr)) {
                    const h = parseInt(parts[0], 10);
                    const m = parseInt(parts[1], 10);
                    if (!isNaN(h) && !isNaN(m) && h >= 0 && h <= 23 && m >= 0 && m <= 59) {
                        return { h, m };
                    }
                }
            }
            return { h: defaultH, m: defaultM };
        };

        const formatToState = (parsed) => {
            if (is24h) return { hour: parsed.h, minute: parsed.m };
            return {
                hour: parsed.h % 12 || 12,
                minute: parsed.m,
                ampm: parsed.h >= 12 ? 'PM' : 'AM'
            };
        };

        // Construcción del estado inicial basado en la configuración del usuario
        let state;
        if (isRange) {
            const t1 = Array.isArray(settings.defaultTime) ? settings.defaultTime[0] : settings.defaultTime;
            const t2 = Array.isArray(settings.defaultTime) ? settings.defaultTime[1] : settings.defaultTime;
            state = [
                formatToState(parseTime(t1, 0, 0)),    // Fallback: 00:00 (12:00 AM)
                formatToState(parseTime(t2, 23, 59))   // Fallback: 23:59 (11:59 PM)
            ];
        } else {
            const t1 = Array.isArray(settings.defaultTime) ? settings.defaultTime[0] : settings.defaultTime;
            state = [
                formatToState(parseTime(t1, 6, 0))     // Fallback: 06:00 (6:00 AM)
            ];
        }

        const renderClockControls = (idx, title) => `
        <div class="dtp-clock-instance mb-3" data-idx="${idx}">
            <h6 class="fw-bold mb-2 text-start fs-7 text-body">${title}</h6>
            <div class="row text-center mb-1 fs-7 text-body-secondary fw-medium">
                <div class="${is24h ? 'col-6' : 'col-4'}">${lang.hour}</div>
                <div class="${is24h ? 'col-6' : 'col-4'}">${lang.minute}</div>
                ${!is24h ? `<div class="col-4">${lang.ampm}</div>` : ''}
            </div>
            <div class="row text-center align-items-center g-2">
                <div class="${is24h ? 'col-6' : 'col-4'} d-flex flex-column align-items-center">
                    <button type="button" class="btn bg-body-tertiary border-0 btn-sm w-100 py-1 mb-1 rounded-3 text-body dtp-btn-up-hour">${arrowUp}</button>
                    <input type="text" class="form-control text-center fw-bold fs-5 bg-body-subtle text-body shadow-sm py-2 dtp-input-hour" maxLength="2">
                    <button type="button" class="btn bg-body-tertiary border-0 btn-sm w-100 py-1 mt-1 rounded-3 text-body dtp-btn-down-hour">${arrowDown}</button>
                </div>
                <div class="${is24h ? 'col-6' : 'col-4'} d-flex flex-column align-items-center">
                    <button type="button" class="btn bg-body-tertiary border-0 btn-sm w-100 py-1 mb-1 rounded-3 text-body dtp-btn-up-minute">${arrowUp}</button>
                    <input type="text" class="form-control text-center fw-bold fs-5 bg-body-subtle text-body shadow-sm py-2 dtp-input-minute" maxLength="2">
                    <button type="button" class="btn bg-body-tertiary border-0 btn-sm w-100 py-1 mt-1 rounded-3 text-body dtp-btn-down-minute">${arrowDown}</button>
                </div>
                ${!is24h ? `
                <div class="col-4 d-flex flex-column align-items-center">
                    <button type="button" class="btn bg-body-tertiary border-0 btn-sm w-100 py-1 mb-1 rounded-3 text-body dtp-btn-toggle-ampm">${arrowUp}</button>
                    <button type="button" class="btn btn-outline-secondary w-100 border text-center fw-bold fs-5 bg-body-subtle text-body shadow-sm py-2 dtp-btn-ampm-val dtp-btn-toggle-ampm"></button>
                    <button type="button" class="btn bg-body-tertiary border-0 btn-sm w-100 py-1 mt-1 rounded-3 text-body dtp-btn-toggle-ampm">${arrowDown}</button>
                </div>` : ''}
            </div>
        </div>
    `;

        let clocksHtml = '';
        if (isRange) {
            const startTitle = lang && lang.start ? lang.start : 'Hora Inicio';
            const endTitle = lang && lang.end ? lang.end : 'Hora Fin';
            
            clocksHtml += renderClockControls(0, startTitle);
            clocksHtml += renderClockControls(1, endTitle);
        } else {
            clocksHtml += renderClockControls(0, lang.title);
        }

        $clockWrapper = $(`<div class="dtp-clock-wrapper d-flex flex-column flex-grow-1 w-100">${clocksHtml}</div>`);
        $parent.append($clockWrapper);

        const notifyChange = () => {
            if (typeof onTimeChange === 'function') {
                const result = state.map(s => ({
                    hour: s.hour,
                    minute: s.minute,
                    ...(is24h ? {} : { ampm: s.ampm })
                }));
                // Emitimos el arreglo completo si es rango, o solo el objeto si es single
                onTimeChange(isRange ? result : result[0]);
            }
        };

        const updateDisplay = () => {
            $clockWrapper.find('.dtp-clock-instance').each(function () {
                const idx = $(this).data('idx');
                const s = state[idx];
                $(this).find('.dtp-input-hour').val(String(s.hour).padStart(2, '0'));
                $(this).find('.dtp-input-minute').val(String(s.minute).padStart(2, '0'));
                if (!is24h) $(this).find('.dtp-btn-ampm-val').text(s.ampm);
            });
            notifyChange();
        };

        const getIdx = (el) => $(el).closest('.dtp-clock-instance').data('idx');

        $clockWrapper.on('input', '.dtp-input-hour', function () {
            let val = parseInt($(this).val(), 10);
            let idx = getIdx(this);
            if (!isNaN(val)) {
                if (is24h) state[idx].hour = val > 23 ? 23 : (val < 0 ? 0 : val);
                else state[idx].hour = val > 12 ? 12 : (val < 1 ? 1 : val);
                notifyChange();
            }
        });

        $clockWrapper.on('blur', '.dtp-input-hour', function () {
            let idx = getIdx(this);
            if (isNaN(state[idx].hour)) state[idx].hour = is24h ? 0 : 12;
            updateDisplay();
        });

        $clockWrapper.on('input', '.dtp-input-minute', function () {
            let val = parseInt($(this).val(), 10);
            let idx = getIdx(this);
            if (!isNaN(val)) {
                state[idx].minute = val > 59 ? 59 : (val < 0 ? 0 : val);
                notifyChange();
            }
        });

        $clockWrapper.on('blur', '.dtp-input-minute', function () {
            let idx = getIdx(this);
            if (isNaN(state[idx].minute)) state[idx].minute = 0;
            updateDisplay();
        });

        $clockWrapper.on('click', '.dtp-btn-up-hour', function (e) {
            e.stopPropagation(); let idx = getIdx(this);
            state[idx].hour = is24h ? (state[idx].hour >= 23 ? 0 : state[idx].hour + 1) : (state[idx].hour >= 12 ? 1 : state[idx].hour + 1);
            updateDisplay();
        });

        $clockWrapper.on('click', '.dtp-btn-down-hour', function (e) {
            e.stopPropagation(); let idx = getIdx(this);
            state[idx].hour = is24h ? (state[idx].hour <= 0 ? 23 : state[idx].hour - 1) : (state[idx].hour <= 1 ? 12 : state[idx].hour - 1);
            updateDisplay();
        });

        $clockWrapper.on('click', '.dtp-btn-up-minute', function (e) {
            e.stopPropagation(); let idx = getIdx(this);
            state[idx].minute = state[idx].minute >= 59 ? 0 : state[idx].minute + 1;
            updateDisplay();
        });

        $clockWrapper.on('click', '.dtp-btn-down-minute', function (e) {
            e.stopPropagation(); let idx = getIdx(this);
            state[idx].minute = state[idx].minute <= 0 ? 59 : state[idx].minute - 1;
            updateDisplay();
        });

        if (!is24h) {
            $clockWrapper.on('click', '.dtp-btn-toggle-ampm', function (e) {
                e.stopPropagation(); let idx = getIdx(this);
                state[idx].ampm = state[idx].ampm === 'AM' ? 'PM' : 'AM';
                updateDisplay();
            });
        }

        $parent.off('dtp:set-now').on('dtp:set-now', function () {
            const now = new Date();
            let h = now.getHours();
            let m = now.getMinutes();
            state.forEach(s => {
                s.minute = m;
                if (is24h) {
                    s.hour = h;
                } else {
                    s.ampm = h >= 12 ? 'PM' : 'AM';
                    s.hour = h % 12 || 12;
                }
            });
            updateDisplay();
        });

        for (const field of ['hour', 'minute']) {
            $clockWrapper.find('.dtp-input-' + field).attr({ 'aria-label': lang[field], inputmode: 'numeric' });
            $clockWrapper.find('.dtp-btn-up-' + field).attr('aria-label', (lang.increase || 'Increase') + ' ' + lang[field]);
            $clockWrapper.find('.dtp-btn-down-' + field).attr('aria-label', (lang.decrease || 'Decrease') + ' ' + lang[field]);
        }
        $clockWrapper.find('.dtp-btn-toggle-ampm').attr('aria-label', lang.ampm);
        $parent.on('dtp:clear', () => { $clockWrapper.find('input').val(''); $clockWrapper.find('.dtp-btn-ampm-val').text('—'); });
        updateDisplay();
    }

    function initBirthday($parent, settings, $, i18nData, onDateChange) {
        let $birthdayWrapper = $parent.find('.dtp-birthday-wrapper');
        const lang = i18nData.birthday;
        const months = i18nData.calendar.monthsShort;

        const arrowUp = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chevron-up" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M7.646 4.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1-.708.708L8 5.707l-5.646 5.647a.5.5 0 0 1-.708-.708z"/></svg>`;
        const arrowDown = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chevron-down" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708"/></svg>`;

        if ($birthdayWrapper.length === 0) {
            $birthdayWrapper = $(`
            <div class="dtp-birthday-wrapper">
                <h6 class="fw-bold mb-3 text-start fs-6 text-body">${lang.title}</h6>
                
                <div class="row text-center mb-2 fs-7 text-body-secondary fw-medium">
                    <div class="col-4">${lang.day}</div>
                    <div class="col-4">${lang.month}</div>
                    <div class="col-4">${lang.year}</div>
                </div>

                <div class="row text-center align-items-center g-2 mb-2">
                    <div class="col-4 d-flex flex-column align-items-center">
                        <button type="button" class="btn bg-body-tertiary border-0 btn-sm w-100 py-1 mb-1 rounded-3 text-body dtp-btn-up-day">${arrowUp}</button>
                        <input type="text" class="form-control text-center fw-bold fs-5 bg-body-subtle text-body shadow-sm py-2 dtp-input-day" maxLength="2" value="01">
                        <button type="button" class="btn bg-body-tertiary border-0 btn-sm w-100 py-1 mt-1 rounded-3 text-body dtp-btn-down-day">${arrowDown}</button>
                    </div>

                    <div class="col-4 d-flex flex-column align-items-center">
                        <button type="button" class="btn bg-body-tertiary border-0 btn-sm w-100 py-1 mb-1 rounded-3 text-body dtp-btn-up-month">${arrowUp}</button>
                        <button type="button" class="btn btn-outline-secondary w-100 border text-center fw-bold fs-6 bg-body-subtle text-body shadow-sm py-2 dtp-btn-month-val dtp-btn-up-month">${months[0]}</button>
                        <button type="button" class="btn bg-body-tertiary border-0 btn-sm w-100 py-1 mt-1 rounded-3 text-body dtp-btn-down-month">${arrowDown}</button>
                    </div>

                    <div class="col-4 d-flex flex-column align-items-center">
                        <button type="button" class="btn bg-body-tertiary border-0 btn-sm w-100 py-1 mb-1 rounded-3 text-body dtp-btn-up-year">${arrowUp}</button>
                        <input type="text" class="form-control text-center fw-bold fs-5 bg-body-subtle text-body shadow-sm py-2 dtp-input-year" maxLength="4" value="2000">
                        <button type="button" class="btn bg-body-tertiary border-0 btn-sm w-100 py-1 mt-1 rounded-3 text-body dtp-btn-down-year">${arrowDown}</button>
                    </div>
                </div>
            </div>
        `);
            $parent.append($birthdayWrapper);
        }

        const currentYear = new Date().getFullYear();
        const initial = parseDate(settings.selectedDates[0]) || parseDate(settings.minDate) || new Date(2000, 0, 1);
        let state = { day: initial.getDate(), month: initial.getMonth(), year: initial.getFullYear() };

        const $inputDay = $birthdayWrapper.find('.dtp-input-day');
        const $btnMonth = $birthdayWrapper.find('.dtp-btn-month-val');
        const $inputYear = $birthdayWrapper.find('.dtp-input-year');

        const getMaxDays = (month, year) => new Date(year, month + 1, 0).getDate();

        const notifyChange = () => {
            if (typeof onDateChange === 'function') {
                const formattedMonth = String(state.month + 1).padStart(2, '0');
                const formattedDay = String(state.day).padStart(2, '0');
                const key = String(state.year).padStart(4, '0') + '-' + formattedMonth + '-' + formattedDay;
                const valid = state.year >= 1900 && state.year <= currentYear && isDateAllowed(key, settings);
                $birthdayWrapper.find('input').attr('aria-invalid', String(!valid));
                if (valid) onDateChange(key, { ...state });
            }
        };

        const updateDisplay = () => {
            const maxDays = getMaxDays(state.month, state.year);
            if (state.day > maxDays) state.day = maxDays;

            $inputDay.val(String(state.day).padStart(2, '0'));
            $btnMonth.text(months[state.month]);
            $inputYear.val(state.year);

            notifyChange();
        };

        // --- EVENTOS DE TECLADO / EDICIÓN MANUALLY ---

        // Edición manual del día
        $inputDay.off('input').on('input', function () {
            let val = parseInt($(this).val(), 10);
            if (!isNaN(val) && val >= 1) {
                const maxDays = getMaxDays(state.month, state.year);
                state.day = val > maxDays ? maxDays : val;
                notifyChange();
            }
        });

        $inputDay.off('blur').on('blur', function () {
            if (isNaN(state.day) || state.day < 1) state.day = 1;
            updateDisplay();
        });

        // Edición manual del año
        $inputYear.off('input').on('input', function () {
            let val = parseInt($(this).val(), 10);
            if (!isNaN(val)) {
                state.year = Math.max(1900, Math.min(currentYear, val));
                state.day = Math.min(state.day, getMaxDays(state.month, state.year));
                notifyChange();
            }
        });

        $inputYear.off('blur').on('blur', function () {
            if (isNaN(state.year) || state.year < 1900) {
                state.year = 1900;
            } else if (state.year > currentYear) {
                state.year = currentYear;
            }
            updateDisplay();
        });

        // --- EVENTOS DE BOTONES (FLECHAS) ---

        $birthdayWrapper.off('click', '.dtp-btn-up-day').on('click', '.dtp-btn-up-day', function (e) {
            e.stopPropagation();
            const max = getMaxDays(state.month, state.year);
            state.day = state.day >= max ? 1 : state.day + 1;
            updateDisplay();
        });

        $birthdayWrapper.off('click', '.dtp-btn-down-day').on('click', '.dtp-btn-down-day', function (e) {
            e.stopPropagation();
            const max = getMaxDays(state.month, state.year);
            state.day = state.day <= 1 ? max : state.day - 1;
            updateDisplay();
        });

        $birthdayWrapper.off('click', '.dtp-btn-up-month').on('click', '.dtp-btn-up-month', function (e) {
            e.stopPropagation();
            state.month = state.month >= 11 ? 0 : state.month + 1;
            updateDisplay();
        });

        $birthdayWrapper.off('click', '.dtp-btn-down-month').on('click', '.dtp-btn-down-month', function (e) {
            e.stopPropagation();
            state.month = state.month <= 0 ? 11 : state.month - 1;
            updateDisplay();
        });

        $birthdayWrapper.off('click', '.dtp-btn-up-year').on('click', '.dtp-btn-up-year', function (e) {
            e.stopPropagation();
            if (state.year < currentYear) state.year++;
            updateDisplay();
        });

        $birthdayWrapper.off('click', '.dtp-btn-down-year').on('click', '.dtp-btn-down-year', function (e) {
            e.stopPropagation();
            if (state.year > 1900) state.year--;
            updateDisplay();
        });

        $inputDay.attr({ 'aria-label': lang.day, inputmode: 'numeric' });
        $inputYear.attr({ 'aria-label': lang.year, inputmode: 'numeric' });
        for (const field of ['day', 'month', 'year']) {
            $birthdayWrapper.find('.dtp-btn-up-' + field).attr('aria-label', (lang.increase || 'Increase') + ' ' + lang[field]);
            $birthdayWrapper.find('.dtp-btn-down-' + field).attr('aria-label', (lang.decrease || 'Decrease') + ' ' + lang[field]);
        }
        $parent.on('dtp:clear', () => { $inputDay.val(''); $inputYear.val(''); $btnMonth.text('—'); });
        $inputDay.val(String(state.day).padStart(2, '0'));
        $inputYear.val(state.year);
        $btnMonth.text(months[state.month]);
    }

    const i18n = {
        es: {
            code: "es",
            calendar: {
                months: ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"],
                monthsShort: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"],
                weekdaysShort: ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sá"],
                title: "Fecha y hora", previous: "Mes anterior", next: "Mes siguiente",
                rangeSeparator: "a"
            },
            clock: { increase: "Aumentar", decrease: "Disminuir", title: "Reloj", hour: "Hora", minute: "Minuto", ampm: "AM / PM", start: "Hora inicio", end: "Hora fin" },
            birthday: { increase: "Aumentar", decrease: "Disminuir", title: "Fecha de Nacimiento", day: "Día", month: "Mes", year: "Año" },
            actions: { today: "Hoy", now: "Ahora", clear: "Limpiar", done: "Aceptar", close: "Cerrar" }
        },
        en: {
            code: "en",
            calendar: {
                months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
                monthsShort: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
                weekdaysShort: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
                title: "Date and time", previous: "Previous month", next: "Next month",
                rangeSeparator: "to"
            },
            clock: { title: "Clock", hour: "Hour", minute: "Minute", ampm: "AM / PM", start: "Start Time", end: "End Time" },
            birthday: { title: "Date of Birth", day: "Day", month: "Month", year: "Year" },
            actions: { today: "Today", now: "Now", clear: "Clear", done: "Done", close: "Close" }
        }
    };

    /**
     * Formatea un objeto Date según la plantilla dada.
     * @param {Date} date 
     * @param {string} format - Ej: 'YYYY-MM-DD', 'DD/MM/YYYY'
     * @returns {string} Fecha formateada
     */
    function formatDate(date, format = 'YYYY-MM-DD') {
        if (!(date instanceof Date) || isNaN(date)) return '';

        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();

        const map = {
            YYYY: year,
            YY: String(year).slice(-2),
            MM: String(month).padStart(2, '0'),
            M: month,
            DD: String(day).padStart(2, '0'),
            D: day
        };

        return format.replace(/YYYY|YY|MM|M|DD|D/g, matched => map[matched]);
    }

    const activePickers = new Set();
    (function ($) {
        $.fn.extendedDateTimePicker = function (options) {
            return this.each(function () {
                const $target = $(this);
                let instance = $target.data('datetimepicker');

                // --- MANEJO DE MÉTODOS PÚBLICOS COMO CADENAS DE TEXTO ---
                if (typeof options === 'string') {
                    if (!['open', 'close', 'destroy'].includes(options)) throw new Error(`Unknown picker method: ${options}`);
                    if (!instance) return;
                    if (options === 'open') instance.open();
                    if (options === 'close') instance.close();
                    if (options === 'destroy') instance.destroy();
                    return;
                }

                // Destrucción previa si se vuelve a llamar con un objeto de configuración
                if (instance) {
                    instance.destroy();
                }

                const settings = $.extend({
                    mode: 'single',
                    layout: 'vertical',
                    showClock: true,
                    showCalendar: true,
                    themeColor: 'success',
                    format24h: true,
                    defaultTime: null,
                    actions: ['close', 'today', 'now', 'clear'],
                    selectedDates: [],
                    minDate: null,
                    maxDate: null,
                    disableWeekends: false,
                    disabledDates: [],
                    doubleMonth: false,
                    dateFormat: 'YYYY-MM-DD',
                    lang: 'es',
                    onOpen: function () { },
                    onClose: function () { },
                    onSelectDate: null,
                    onSelectTime: null
                }, options);

                if (!['single', 'multiple', 'range', 'birthday'].includes(settings.mode)) throw new Error('Invalid picker mode');
                for (const key of ['minDate', 'maxDate']) {
                    if (settings[key] != null && !parseDate(settings[key])) throw new Error('Invalid ' + key);
                }
                if (settings.minDate && settings.maxDate && settings.minDate > settings.maxDate) throw new Error('minDate exceeds maxDate');
                const i18nData = $.extend(true, {}, i18n.es, typeof settings.lang === 'object' && settings.lang ? settings.lang : (i18n[settings.lang] || {}));

                const isInput = $target.is('input');
                const isBirthdayMode = settings.mode === 'birthday';
                let currentDate = shiftMonth(new Date(), 0);
                let selectedDatesState = [...new Set(Array.isArray(settings.selectedDates) ? settings.selectedDates : [])].filter(d => isDateAllowed(d, settings));
                if (settings.mode !== 'multiple') selectedDatesState = selectedDatesState.slice(0, settings.mode === 'range' ? 2 : 1);
                if (settings.mode === 'range') selectedDatesState.sort();
                if (isBirthdayMode) selectedDatesState = selectedDatesState.filter(d => parseDate(d).getFullYear() >= 1900 && parseDate(d).getFullYear() <= new Date().getFullYear());
                settings.selectedDates = [...selectedDatesState];
                if (selectedDatesState.length) currentDate = shiftMonth(parseDate(selectedDatesState[0]), 0);
                let hoverDateState = null;
                let currentTimeState = null;
                let initializing = true;
                let cleared = false;
                let isOpen = false;

                const isHorizontal = settings.layout === 'horizontal' && settings.showCalendar && settings.showClock && !isBirthdayMode;

                // Determinamos el layout CSS
                const layoutClass = isHorizontal ? 'dtp-layout-horizontal' : 'dtp-layout-vertical';

                let maxCardWidth = '340px';
                if (isHorizontal) {
                    maxCardWidth = settings.doubleMonth ? '960px' : '650px';
                } else if (settings.doubleMonth && !isBirthdayMode) {
                    maxCardWidth = '620px';
                }

                let actionButtonsHtml = '';
                if (Array.isArray(settings.actions)) {
                    settings.actions.forEach(action => {
                        if (action === 'today' && settings.showCalendar && !isBirthdayMode) {
                            actionButtonsHtml += `
                            <div class="col">
                                <button type="button" class="btn bg-body-tertiary border-0 w-100 py-2 fw-semibold text-body rounded-3 dtp-btn-today">${i18nData.actions.today}</button>
                            </div>
                        `;
                        } else if (action === 'now' && settings.showClock) {
                            actionButtonsHtml += `
                            <div class="col">
                                <button type="button" class="btn bg-body-tertiary border-0 w-100 py-2 fw-semibold text-body rounded-3 dtp-btn-now">${i18nData.actions.now}</button>
                            </div>
                        `;
                        } else if (action === 'clear') {
                            actionButtonsHtml += `
                            <div class="col">
                                <button type="button" class="btn bg-body-tertiary border-0 w-100 py-2 fw-semibold text-danger rounded-3 dtp-btn-clear">${i18nData.actions.clear}</button>
                            </div>
                        `;
                        } else if (action === 'close') {
                            const closeText = (i18nData && i18nData.actions && i18nData.actions.close)
                                ? i18nData.actions.close
                                : 'Close'; // Fallback neutral por si falta la clave en el diccionario

                            actionButtonsHtml += `
                            <div class="col">
                                <button type="button" class="btn bg-body-tertiary border-0 w-100 py-2 fw-semibold text-body rounded-3 dtp-btn-close-action">${closeText}</button>
                            </div>
                        `;
                        }
                    });
                }

                const actionsHtml = actionButtonsHtml ? `
                <div class="dtp-actions-footer pt-2 mt-2 border-top">
                    <div class="row g-2">
                        ${actionButtonsHtml}
                    </div>
                </div>
            ` : '';

                // CONSTRUCCIÓN DE LA TARJETA USANDO maxCardWidth CORRECTAMENTE
                const $card = $(`
                <div class="card shadow-sm dtp-card ${layoutClass}" style="--dtp-width: ${maxCardWidth};">
                    <div class="card-body p-3 dtp-card-body">
                        ${isBirthdayMode ? '<div class="dtp-birthday-section w-100"></div>' : ''}
                        ${(settings.showCalendar && !isBirthdayMode) ? '<div class="dtp-calendar-section w-100"></div>' : ''}
                        ${settings.showClock ? '<div class="dtp-clock-section"></div>' : ''}
                    </div>
                    <div class="card-footer bg-transparent border-0 px-3 pb-3 pt-0">
                        ${actionsHtml}
                    </div>
                </div>
            `);

                // --- OBTENCIÓN DE NODOS INTERNOS DEL DOM ---
                const $bdayContainer = $card.find('.dtp-birthday-section');
                const $calContainer = $card.find('.dtp-calendar-section');
                const $clockContainer = $card.find('.dtp-clock-section');

                let $wrapper;
                const instanceId = Math.random().toString(36).substring(2, 9);

                const originalAttrs = Object.fromEntries(['readonly', 'autocomplete', 'aria-expanded', 'aria-controls', 'aria-haspopup'].map(key => [key, $target.attr(key)]));
                let ownsWrapper = false;
                $card.attr({ id: 'dtp-' + instanceId, role: isInput ? 'dialog' : 'group', 'aria-label': i18nData.calendar.title || 'Date and time' });
                if (isInput) {
                    $target.attr({ 'aria-expanded': 'false', 'aria-controls': 'dtp-' + instanceId, 'aria-haspopup': 'dialog' });
                    $target.attr('readonly', true);
                    $target.attr('autocomplete', 'off');

                    if (!$target.parent().hasClass('dtp-input-wrapper')) {
                        ownsWrapper = true;
                        $target.wrap('<div class="dtp-input-wrapper position-relative" style="display: inline-block; width: 100%;"></div>');
                    }
                    $wrapper = $target.parent();

                    $card.css({
                        position: 'absolute',
                        top: '100%',
                        left: '0',
                        zIndex: 1050,
                        marginTop: '0.25rem',
                        display: 'none'
                    });

                    $wrapper.append($card);
                } else {
                    $card.addClass('dtp-card-static').css({
                        position: 'relative',
                        display: 'block',
                        opacity: 1,
                        zIndex: 1,
                        width: '100%'
                    });

                    $target.empty().addClass('dtp-static-container').append($card);
                    isOpen = true;
                }

                // --- DESTRUCCIÓN SEGURA DE INSTANCIA ---
                const destroyPicker = () => {
                    activePickers.delete(instance);
                    if (isInput) {
                        for (const [key, value] of Object.entries(originalAttrs)) {
                            if (value === undefined) $target.removeAttr(key); else $target.attr(key, value);
                        }
                        $target.off('.dtp');
                        $(document).off(`pointerdown.dtpInputClose_${instanceId}`);
                        $card.remove();
                        if (ownsWrapper && $target.parent().hasClass('dtp-input-wrapper')) {
                            $target.unwrap();
                        }
                    } else {
                        $target.empty().removeClass('dtp-static-container');
                    }
                    $target.removeData('datetimepicker');
                };

                const openPicker = () => {
                    if (isOpen) return;
                    activePickers.forEach(other => { if (other !== instance) other.close(); });

                    if (isInput) {
                        $card.css({
                            top: '100%',
                            bottom: 'auto',
                            left: '0',
                            right: 'auto',
                            marginTop: '0.25rem',
                            marginBottom: '0',
                            maxHeight: 'none',
                            overflowY: 'visible'
                        });

                        $card.css({ display: 'block', opacity: 0 });

                        const targetOffset = $target.offset();
                        const inputHeight = $target.outerHeight();
                        const cardWidth = $card.outerWidth();
                        const cardHeight = $card.outerHeight();

                        const $window = $(window);
                        const windowWidth = $window.width();
                        const windowHeight = $window.height();
                        const scrollTop = $window.scrollTop();
                        const scrollLeft = $window.scrollLeft();

                        if (windowWidth > 680) {
                            const inputRightRelativeToViewport = targetOffset.left + cardWidth - scrollLeft;
                            if (inputRightRelativeToViewport > windowWidth) {
                                $card.css({ left: 'auto', right: '0' });
                            }
                        }

                        const spaceBelow = windowHeight - ((targetOffset.top - scrollTop) + inputHeight);
                        const spaceAbove = targetOffset.top - scrollTop;

                        const placement = popupPlacement(spaceAbove, spaceBelow, cardHeight);
                        if (placement.openAbove) {
                            $card.css({
                                top: 'auto',
                                bottom: '100%',
                                marginTop: '0',
                                marginBottom: '0.25rem'
                            });
                        }

                        $card.css({ maxHeight: `${placement.maxHeight}px`, overflowY: 'auto', overscrollBehavior: 'contain' });

                        $card.css({ opacity: 1, display: 'none' }).stop(true, true).fadeIn(150);
                    } else {
                        $card.stop(true, true).fadeIn(150);
                    }

                    isOpen = true;
                    if (isInput) $target.attr('aria-expanded', 'true');
                    if (typeof settings.onOpen === 'function') settings.onOpen.call($target[0]);
                };

                const closePicker = () => {
                    if (!isOpen) return;
                    $card.stop(true, true).fadeOut(150);
                    isOpen = false;
                    if (isInput) $target.attr('aria-expanded', 'false');
                    if (typeof settings.onClose === 'function') settings.onClose.call($target[0]);
                };

                const writeValue = value => {
                    const changed = $target.val() !== value;
                    $target.val(value);
                    if (changed && !initializing) $target.trigger('input').trigger('change');
                };
                const updateInputValue = () => {
                    if (!isInput) return;

                    if (cleared || (selectedDatesState.length === 0 && (settings.showCalendar || isBirthdayMode))) {
                        writeValue('');
                        return;
                    }

                    const dateObjects = selectedDatesState.map(dStr => {
                        return parseDate(dStr);
                    });

                    const formattedDates = dateObjects.map(dObj => formatDate(dObj, settings.dateFormat));

                    // Helper para convertir el objeto tiempo a string
                    const formatTimeObj = (tObj) => {
                        if (!tObj) return '';
                        const h = String(tObj.hour).padStart(2, '0');
                        const m = String(tObj.minute).padStart(2, '0');
                        return settings.format24h ? `${h}:${m}` : `${h}:${m} ${tObj.ampm}`;
                    };

                    if (settings.mode === 'range' && formattedDates.length === 2) {
                        const separator = i18nData.calendar?.rangeSeparator || ' - ';
                        let startStr = formattedDates[0];
                        let endStr = formattedDates[1];

                        if (settings.showClock && currentTimeState) {
                            if (Array.isArray(currentTimeState) && currentTimeState.length === 2) {
                                // Se aplican las horas individuales
                                startStr += ' ' + formatTimeObj(currentTimeState[0]);
                                endStr += ' ' + formatTimeObj(currentTimeState[1]);
                            } else {
                                // Fallback de seguridad
                                startStr += ' ' + formatTimeObj(currentTimeState);
                                endStr += ' ' + formatTimeObj(currentTimeState);
                            }
                        }

                        writeValue(`${startStr} ${separator} ${endStr}`);
                    } else {
                        let datePart = formattedDates.join(', ');
                        let timePart = '';

                        if (settings.showClock && currentTimeState) {
                            // Maneja estado de array o único para modo single/multiple
                            timePart = formatTimeObj(Array.isArray(currentTimeState) ? currentTimeState[0] : currentTimeState);
                        }

                        const fullValue = [datePart, timePart].filter(Boolean).join(' ');
                        writeValue(fullValue);
                    }
                };

                // INICIALIZADORES DE MÓDULOS
                if (isBirthdayMode) {
                    initBirthday($bdayContainer, settings, $, i18nData, function (dateStr) {
                        cleared = false;
                        selectedDatesState = [dateStr];
                        updateInputValue();

                        if (!initializing && typeof settings.onSelectDate === 'function') {
                            const dateObj = parseDate(dateStr);
                            const formatted = formatDate(dateObj, settings.dateFormat);
                            settings.onSelectDate(dateObj, [formatted]);
                        }
                    });
                }

                if (settings.showCalendar && !isBirthdayMode) {
                    const updateCalendar = () => {
                        const $scrollContainer = $calContainer.find('.dtp-calendar-wrapper').length
                            ? $calContainer.find('.dtp-calendar-wrapper')
                            : $calContainer;

                        const scrollTop = $scrollContainer.scrollTop();
                        const scrollLeft = $scrollContainer.scrollLeft();

                        renderCalendar($calContainer, currentDate, settings, selectedDatesState, hoverDateState, $, i18nData);

                        const $newScrollContainer = $calContainer.find('.dtp-calendar-wrapper').length
                            ? $calContainer.find('.dtp-calendar-wrapper')
                            : $calContainer;

                        $newScrollContainer.scrollTop(scrollTop);
                        $newScrollContainer.scrollLeft(scrollLeft);
                    };

                    updateCalendar();
                    $calContainer.on('keydown.dtp', '.dtp-day', function (e) {
                        const offsets = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
                        if (!(e.key in offsets)) return;
                        e.preventDefault();
                        const days = $calContainer.find('.dtp-day');
                        const step = offsets[e.key];
                        for (let next = days.index(this) + step; next >= 0 && next < days.length; next += step) {
                            if (!days[next].disabled) { days[next].focus(); break; }
                        }
                    });

                    $calContainer.off('click', '.dtp-prev').on('click', '.dtp-prev', function (e) {
                        e.stopPropagation();
                        currentDate = shiftMonth(currentDate, -1);
                        updateCalendar();
                    });

                    $calContainer.off('click', '.dtp-next').on('click', '.dtp-next', function (e) {
                        e.stopPropagation();
                        currentDate = shiftMonth(currentDate, 1);
                        updateCalendar();
                    });

                    $calContainer.off('mouseenter', '.dtp-day').on('mouseenter', '.dtp-day', function (e) {
                        if (settings.mode === 'range' && selectedDatesState.length === 1) {
                            const hoverDate = $(this).attr('data-date');
                            if (!hoverDate) return;

                            const startDate = selectedDatesState[0];
                            const min = startDate < hoverDate ? startDate : hoverDate;
                            const max = startDate < hoverDate ? hoverDate : startDate;

                            $calContainer.find('.dtp-day').each(function () {
                                const $day = $(this);
                                const dateKey = $day.attr('data-date');

                                if (!dateKey || $day.hasClass('pe-none')) return;
                                if (dateKey === startDate) return;

                                if (dateKey > min && dateKey < max) {
                                    $day.addClass(`bg-${settings.themeColor}-subtle text-${settings.themeColor} fw-medium`);
                                } else {
                                    $day.removeClass(`bg-${settings.themeColor}-subtle text-${settings.themeColor} fw-medium`);
                                }
                            });
                        }
                    });

                    $calContainer.off('mouseleave', '.dtp-calendar-wrapper').on('mouseleave', '.dtp-calendar-wrapper', function () {
                        if (settings.mode === 'range' && selectedDatesState.length === 1) {
                            $calContainer.find('.dtp-day').each(function () {
                                const dateKey = $(this).attr('data-date');
                                if (dateKey !== selectedDatesState[0]) {
                                    $(this).removeClass(`bg-${settings.themeColor}-subtle text-${settings.themeColor} fw-medium`);
                                }
                            });
                            hoverDateState = null;
                        }
                    });

                    $calContainer.off('click', '.dtp-day').on('click', '.dtp-day', function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        if ($(this).hasClass('pe-none')) return;

                        const dateKey = $(this).attr('data-date');
                        if (!isDateAllowed(dateKey, settings)) return;
                        cleared = false;

                        const [y, m] = dateKey.split('-').map(Number);
                        if (settings.doubleMonth) {
                            const currentMonth = currentDate.getMonth();
                            const currentYear = currentDate.getFullYear();
                            const clickedMonthIndex = m - 1;

                            if (y !== currentYear || (clickedMonthIndex !== currentMonth && clickedMonthIndex !== (currentMonth + 1) % 12)) {
                                currentDate = new Date(y, clickedMonthIndex, 1);
                            }
                        } else {
                            currentDate = new Date(y, m - 1, 1);
                        }

                        if (settings.mode === 'single') {
                            selectedDatesState = [dateKey];
                        } else if (settings.mode === 'multiple') {
                            const index = selectedDatesState.indexOf(dateKey);
                            if (index > -1) {
                                selectedDatesState.splice(index, 1);
                            } else {
                                selectedDatesState.push(dateKey);
                            }
                        } else if (settings.mode === 'range') {
                            if (selectedDatesState.length !== 1) {
                                selectedDatesState = [dateKey];
                                hoverDateState = null;
                            } else {
                                const firstDate = selectedDatesState[0];
                                if (dateKey < firstDate) {
                                    selectedDatesState = [dateKey, firstDate];
                                } else {
                                    selectedDatesState = [firstDate, dateKey];
                                }
                                hoverDateState = null;
                            }
                        }

                        updateCalendar();
                        $calContainer.find(`[data-date="${dateKey}"]`).trigger("focus");
                        updateInputValue();

                        if (!initializing && typeof settings.onSelectDate === 'function') {
                            const dateObjects = selectedDatesState.map(dStr => {
                                return parseDate(dStr);
                            });
                            const formattedDates = dateObjects.map(dObj => formatDate(dObj, settings.dateFormat));
                            let result = settings.mode === 'single' ? dateObjects[0] : dateObjects;
                            settings.onSelectDate(result, formattedDates);
                        }
                    });
                }

                if (settings.showClock) {
                    initClock($clockContainer, settings, $, i18nData, function (timeState) {
                        currentTimeState = timeState;
                        if (!initializing) { cleared = false; updateInputValue(); }

                        if (!initializing && typeof settings.onSelectTime === 'function') {
                            settings.onSelectTime(timeState);
                        }
                    });
                }

                // BOTONES DE ACCIÓN (TODAY, NOW, CLEAR)
                $card.on('click', '.dtp-btn-today', function (e) {
                    e.stopPropagation();
                    const today = new Date();
                    const y = today.getFullYear();
                    const m = String(today.getMonth() + 1).padStart(2, '0');
                    const d = String(today.getDate()).padStart(2, '0');

                    const todayKey = `${y}-${m}-${d}`;
                    if (!isDateAllowed(todayKey, settings)) return;
                    cleared = false;
                    hoverDateState = null;
                    selectedDatesState = [todayKey];
                    currentDate = shiftMonth(today, 0);
                    if (settings.showCalendar && !isBirthdayMode) {
                        renderCalendar($calContainer, currentDate, settings, selectedDatesState, hoverDateState, $, i18nData);
                    }
                    updateInputValue();
                    if (typeof settings.onSelectDate === 'function') settings.onSelectDate(settings.mode === 'single' ? parseDate(todayKey) : [parseDate(todayKey)], [formatDate(parseDate(todayKey), settings.dateFormat)]);
                });

                $card.on('click', '.dtp-btn-now', function (e) {
                    e.stopPropagation();
                    if (settings.showClock) {
                        $clockContainer.trigger('dtp:set-now');
                    }
                });

                $card.on('click', '.dtp-btn-clear', function (e) {
                    e.stopPropagation();
                    cleared = true;
                    selectedDatesState = [];
                    $bdayContainer.trigger("dtp:clear");
                    $clockContainer.trigger("dtp:clear");
                    currentTimeState = null;
                    hoverDateState = null;
                    if (settings.showCalendar && !isBirthdayMode) {
                        renderCalendar($calContainer, currentDate, settings, selectedDatesState, hoverDateState, $, i18nData);
                    }
                    updateInputValue();

                    if (!initializing && typeof settings.onSelectDate === 'function') {
                        settings.onSelectDate(null, []);
                    }
                });

                if (isInput) {
                    $target.off('focus.dtp click.dtp').on('focus.dtp click.dtp', function (e) {
                        e.stopPropagation();
                        openPicker();
                    });

                    $card.off('click.dtpCard').on('click.dtpCard', function (e) {
                        e.stopPropagation();
                    });

                    $(document).on(`pointerdown.dtpInputClose_${instanceId}`, function (e) {
                        if (e.target === $target[0] || $card[0].contains(e.target)) return;
                        closePicker();
                    });

                    $card.on('click', '.dtp-btn-close-action', function (e) {
                        e.stopPropagation();
                        closePicker();
                    });
                }

                $card.add($target).on('keydown.dtp', function (e) {
                    if (e.key === 'Escape' && isInput) {
                        e.preventDefault();
                        $target[0].focus();
                        closePicker();
                    }
                });
                if (selectedDatesState.length || (!settings.showCalendar && !isBirthdayMode && settings.showClock)) updateInputValue();
                initializing = false;
                instance = { open: openPicker, close: closePicker, destroy: destroyPicker };
                $target.data('datetimepicker', instance);
                if (isInput) activePickers.add(instance);
            });
        };
    })($);

})(jQuery);
