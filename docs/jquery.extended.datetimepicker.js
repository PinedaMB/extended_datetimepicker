(function () {
    'use strict';

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

        const dayNames = (i18nData && i18nData.calendar && i18nData.calendar.daysMin)
            ? i18nData.calendar.daysMin
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
                    <button type="button" class="btn btn-sm bg-body-tertiary text-body rounded-circle dtp-prev p-0 d-flex align-items-center justify-content-center" style="width: 32px; height: 32px;">
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/></svg>
                    </button>` : '<div style="width: 32px;"></div>'}
            </div>
            <div class="fw-bold text-body fs-6 text-center">${monthNames[month]} ${year}</div>
            <div>
                ${showNext ? `
                    <button type="button" class="btn btn-sm bg-body-tertiary text-body rounded-circle dtp-next p-0 d-flex align-items-center justify-content-center" style="width: 32px; height: 32px;">
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
            if (i >= 35 && dayCount > totalDays) break;

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
                const dayOfWeek = currentObj.getDay();
                let isDisabled = false;

                if (settings.disableWeekends && (dayOfWeek === 0 || dayOfWeek === 6)) isDisabled = true;
                if (settings.minDate && dateKey < settings.minDate) isDisabled = true;
                if (settings.maxDate && dateKey > settings.maxDate) isDisabled = true;
                if (Array.isArray(settings.disabledDates) && settings.disabledDates.includes(dateKey)) isDisabled = true;

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
                    <div class="${classes}" style="width: 32px; height: 32px; ${isDisabled ? '' : 'cursor: pointer;'}" data-date="${dateKey}">
                        ${dayCount}
                    </div>
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

        // Limpiar wrapper anterior si existe para forzar la re-creación correcta al cambiar de modo
        if ($clockWrapper.length > 0) {
            $clockWrapper.remove();
        }

        const lang = i18nData.clock;
        const is24h = settings.format24h;

        const arrowUp = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chevron-up" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M7.646 4.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1-.708.708L8 5.707l-5.646 5.647a.5.5 0 0 1-.708-.708z"/></svg>`;
        const arrowDown = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chevron-down" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708"/></svg>`;

        $clockWrapper = $(`
        <div class="dtp-clock-wrapper d-flex flex-column flex-grow-1 w-100">
            <h6 class="fw-bold mb-0 text-start fs-6 text-body">${lang.title}</h6>
            
            <div class="my-auto py-2">
                <div class="row text-center mb-2 fs-7 text-body-secondary fw-medium">
                    <div class="${is24h ? 'col-6' : 'col-4'}">${lang.hour}</div>
                    <div class="${is24h ? 'col-6' : 'col-4'}">${lang.minute}</div>
                    ${!is24h ? `<div class="col-4">${lang.ampm}</div>` : ''}
                </div>

                <div class="row text-center align-items-center g-2">
                    <div class="${is24h ? 'col-6' : 'col-4'} d-flex flex-column align-items-center">
                        <button type="button" class="btn bg-body-tertiary border-0 btn-sm w-100 py-1 mb-1 rounded-3 text-body dtp-btn-up-hour">${arrowUp}</button>
                        <input type="text" class="form-control text-center fw-bold fs-5 bg-body-subtle text-body shadow-sm py-2 dtp-input-hour" maxLength="2" value="${is24h ? '00' : '06'}">
                        <button type="button" class="btn bg-body-tertiary border-0 btn-sm w-100 py-1 mt-1 rounded-3 text-body dtp-btn-down-hour">${arrowDown}</button>
                    </div>

                    <div class="${is24h ? 'col-6' : 'col-4'} d-flex flex-column align-items-center">
                        <button type="button" class="btn bg-body-tertiary border-0 btn-sm w-100 py-1 mb-1 rounded-3 text-body dtp-btn-up-minute">${arrowUp}</button>
                        <input type="text" class="form-control text-center fw-bold fs-5 bg-body-subtle text-body shadow-sm py-2 dtp-input-minute" maxLength="2" value="00">
                        <button type="button" class="btn bg-body-tertiary border-0 btn-sm w-100 py-1 mt-1 rounded-3 text-body dtp-btn-down-minute">${arrowDown}</button>
                    </div>

                    ${!is24h ? `
                    <div class="col-4 d-flex flex-column align-items-center">
                        <button type="button" class="btn bg-body-tertiary border-0 btn-sm w-100 py-1 mb-1 rounded-3 text-body dtp-btn-toggle-ampm">${arrowUp}</button>
                        <button type="button" class="btn btn-outline-secondary w-100 border text-center fw-bold fs-5 bg-body-subtle text-body shadow-sm py-2 dtp-btn-ampm-val dtp-btn-toggle-ampm">PM</button>
                        <button type="button" class="btn bg-body-tertiary border-0 btn-sm w-100 py-1 mt-1 rounded-3 text-body dtp-btn-toggle-ampm">${arrowDown}</button>
                    </div>` : ''}
                </div>
            </div>
        </div>
    `);
        $parent.append($clockWrapper);

        let state = { hour: is24h ? 0 : 6, minute: 0, ampm: 'PM' };
        const $inputHour = $clockWrapper.find('.dtp-input-hour');
        const $inputMinute = $clockWrapper.find('.dtp-input-minute');
        const $btnAmpm = $clockWrapper.find('.dtp-btn-ampm-val');

        const notifyChange = () => {
            if (typeof onTimeChange === 'function') {
                const timeData = {
                    hour: state.hour,
                    minute: state.minute,
                    ...(is24h ? {} : { ampm: state.ampm })
                };
                onTimeChange(timeData);
            }
        };

        const updateDisplay = () => {
            $inputHour.val(String(state.hour).padStart(2, '0'));
            $inputMinute.val(String(state.minute).padStart(2, '0'));
            if (!is24h) $btnAmpm.text(state.ampm);

            notifyChange();
        };

        // --- EDICIÓN POR TECLADO ---

        // Teclado: Hora
        $inputHour.off('input').on('input', function () {
            let val = parseInt($(this).val(), 10);
            if (!isNaN(val)) {
                if (is24h) {
                    state.hour = val > 23 ? 23 : (val < 0 ? 0 : val);
                } else {
                    state.hour = val > 12 ? 12 : (val < 1 ? 1 : val);
                }
                notifyChange();
            }
        });

        $inputHour.off('blur').on('blur', function () {
            if (isNaN(state.hour)) {
                state.hour = is24h ? 0 : 12;
            }
            updateDisplay();
        });

        // Teclado: Minutos
        $inputMinute.off('input').on('input', function () {
            let val = parseInt($(this).val(), 10);
            if (!isNaN(val)) {
                state.minute = val > 59 ? 59 : (val < 0 ? 0 : val);
                notifyChange();
            }
        });

        $inputMinute.off('blur').on('blur', function () {
            if (isNaN(state.minute)) {
                state.minute = 0;
            }
            updateDisplay();
        });

        // --- EVENTOS DE FLECHAS ---

        $clockWrapper.off('click', '.dtp-btn-up-hour').on('click', '.dtp-btn-up-hour', function (e) {
            e.stopPropagation();
            if (is24h) {
                state.hour = state.hour >= 23 ? 0 : state.hour + 1;
            } else {
                state.hour = state.hour >= 12 ? 1 : state.hour + 1;
            }
            updateDisplay();
        });

        $clockWrapper.off('click', '.dtp-btn-down-hour').on('click', '.dtp-btn-down-hour', function (e) {
            e.stopPropagation();
            if (is24h) {
                state.hour = state.hour <= 0 ? 23 : state.hour - 1;
            } else {
                state.hour = state.hour <= 1 ? 12 : state.hour - 1;
            }
            updateDisplay();
        });

        $clockWrapper.off('click', '.dtp-btn-up-minute').on('click', '.dtp-btn-up-minute', function (e) {
            e.stopPropagation();
            state.minute = state.minute >= 59 ? 0 : state.minute + 1;
            updateDisplay();
        });

        $clockWrapper.off('click', '.dtp-btn-down-minute').on('click', '.dtp-btn-down-minute', function (e) {
            e.stopPropagation();
            state.minute = state.minute <= 0 ? 59 : state.minute - 1;
            updateDisplay();
        });

        if (!is24h) {
            $clockWrapper.off('click', '.dtp-btn-toggle-ampm').on('click', '.dtp-btn-toggle-ampm', function (e) {
                e.stopPropagation();
                state.ampm = state.ampm === 'AM' ? 'PM' : 'AM';
                updateDisplay();
            });
        }

        $parent.off('dtp:set-now').on('dtp:set-now', function () {
            const now = new Date();
            let h = now.getHours();
            state.minute = now.getMinutes();
            if (is24h) {
                state.hour = h;
            } else {
                state.ampm = h >= 12 ? 'PM' : 'AM';
                state.hour = h % 12 || 12;
            }
            updateDisplay();
        });

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
        let state = { day: 1, month: 0, year: 2000 };

        const $inputDay = $birthdayWrapper.find('.dtp-input-day');
        const $btnMonth = $birthdayWrapper.find('.dtp-btn-month-val');
        const $inputYear = $birthdayWrapper.find('.dtp-input-year');

        const getMaxDays = (month, year) => new Date(year, month + 1, 0).getDate();

        const notifyChange = () => {
            if (typeof onDateChange === 'function') {
                const formattedMonth = String(state.month + 1).padStart(2, '0');
                const formattedDay = String(state.day).padStart(2, '0');
                onDateChange(`${state.year}-${formattedMonth}-${formattedDay}`, state);
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
                state.year = val;
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

        updateDisplay();
    }

    const i18n = {
        es: {
            code: "es",
            calendar: {
                months: ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"],
                monthsShort: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"],
                weekdaysShort: ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sá"],
                rangeSeparator: "a"
            },
            clock: { title: "Reloj", hour: "Hora", minute: "Minuto", ampm: "AM / PM" },
            birthday: { title: "Fecha de Nacimiento", day: "Día", month: "Mes", year: "Año" },
            actions: { today: "Hoy", now: "Ahora", clear: "Limpiar", done: "Aceptar" }
        },
        en: {
            code: "en",
            calendar: {
                months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
                monthsShort: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
                weekdaysShort: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
                rangeSeparator: "to"
            },
            clock: { title: "Clock", hour: "Hour", minute: "Minute", ampm: "AM / PM" },
            birthday: { title: "Date of Birth", day: "Day", month: "Month", year: "Year" },
            actions: { today: "Today", now: "Now", clear: "Clear", done: "Done" }
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

    (function ($) {
        $.fn.extendedDateTimePicker = function (options, param) {
            return this.each(function () {
                const $target = $(this);
                let instance = $target.data('datetimepicker');

                // --- MANEJO DE MÉTODOS PÚBLICOS COMO CADENAS DE TEXTO ---
                if (typeof options === 'string' && instance) {
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

                const i18nData = typeof settings.lang === 'object'
                    ? settings.lang
                    : (i18n[settings.lang] || i18n.es);

                const isInput = $target.is('input');
                const isBirthdayMode = settings.mode === 'birthday';
                let currentDate = new Date();
                let selectedDatesState = Array.isArray(settings.selectedDates) ? [...settings.selectedDates] : [];
                let hoverDateState = null;
                let currentTimeState = settings.showClock ? { hour: 6, minute: 0, ampm: 'PM' } : null;
                let isOpen = false;

                const isHorizontal = settings.layout === 'horizontal' && settings.showCalendar && settings.showClock && !isBirthdayMode;

                // Determinamos el layout CSS
                const layoutClass = isHorizontal ? 'dtp-layout-horizontal' : 'dtp-layout-vertical';

                // --- DEFINICIÓN DE LA VARIABLE QUE FALTABA ---
                let maxCardWidth = '340px';
                if (isHorizontal) {
                    maxCardWidth = settings.doubleMonth ? '960px' : '650px';
                } else if (settings.doubleMonth && !isBirthdayMode) {
                    maxCardWidth = '620px';
                }

                const actionsHtml = `
                <div class="dtp-actions-footer pt-2 mt-2 border-top">
                    <div class="row g-2">
                        ${(settings.showCalendar && !isBirthdayMode) ? `
                            <div class="col">
                                <button type="button" class="btn bg-body-tertiary border-0 w-100 py-2 fw-semibold text-body rounded-3 dtp-btn-today">${i18nData.actions.today}</button>
                            </div>
                        ` : ''}
                        ${settings.showClock ? `
                            <div class="col">
                                <button type="button" class="btn bg-body-tertiary border-0 w-100 py-2 fw-semibold text-body rounded-3 dtp-btn-now">${i18nData.actions.now}</button>
                            </div>
                        ` : ''}
                        <div class="col">
                            <button type="button" class="btn bg-body-tertiary border-0 w-100 py-2 fw-semibold text-danger rounded-3 dtp-btn-clear">${i18nData.actions.clear}</button>
                        </div>
                    </div>
                </div>
            `;

                // CONSTRUCCIÓN DE LA TARJETA USANDO maxCardWidth CORRECTAMENTE
                const $card = $(`
                <div class="card shadow-sm dtp-card ${layoutClass}" style="min-width: ${maxCardWidth}; max-width: 100%;">
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

                // --- CORRECCIÓN CRÍTICA 1: OBTENCIÓN DE NODOS INTERNOS DEL DOM ---
                const $bdayContainer = $card.find('.dtp-birthday-section');
                const $calContainer = $card.find('.dtp-calendar-section');
                const $clockContainer = $card.find('.dtp-clock-section');

                let $wrapper;
                const instanceId = Math.random().toString(36).substring(2, 9);

                if (isInput) {
                    $target.attr('autocomplete', 'off');

                    if (!$target.parent().hasClass('dtp-input-wrapper')) {
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

                // --- CORRECCIÓN CRÍTICA 2: DESTRUCCIÓN SEGURA DE INSTANCIA ---
                const destroyPicker = () => {
                    if (isInput) {
                        $target.off('.dtp');
                        $(document).off(`click.dtpInputClose_${instanceId}`);
                        $card.remove();
                        if ($target.parent().hasClass('dtp-input-wrapper')) {
                            $target.unwrap();
                        }
                    } else {
                        $target.empty().removeClass('dtp-static-container');
                    }
                    $target.removeData('datetimepicker');
                };

                const openPicker = () => {
                    if (isOpen) return;
                    $('.dtp-card').not('.dtp-card-static').not($card).hide();

                    // Si estamos en un dispositivo móvil o pantalla estrecha, forzamos ancho completo adaptado
                    if (window.innerWidth <= 680) {
                        $card.css({
                            width: '100vw',
                            maxWidth: '100vw',
                            left: '0 !important',
                            right: '0 !important'
                        });
                    }

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

                        if (spaceBelow < cardHeight && spaceAbove >= cardHeight) {
                            $card.css({
                                top: 'auto',
                                bottom: '100%',
                                marginTop: '0',
                                marginBottom: '0.25rem'
                            });
                        } else if (spaceBelow < cardHeight) {
                            const currentScroll = $window.scrollTop();
                            const overflowAmount = cardHeight - spaceBelow + 20;

                            $('html, body').animate({
                                scrollTop: currentScroll + overflowAmount
                            }, 200);
                        }

                        $card.css({ opacity: 1, display: 'none' }).fadeIn(150);
                    } else {
                        $card.fadeIn(150);
                    }

                    isOpen = true;
                    if (typeof settings.onOpen === 'function') settings.onOpen.call($target[0]);
                };

                const closePicker = () => {
                    if (!isOpen) return;
                    $card.fadeOut(150);
                    isOpen = false;
                    if (typeof settings.onClose === 'function') settings.onClose.call($target[0]);
                };

                const updateInputValue = () => {
                    if (!isInput) return;

                    if (selectedDatesState.length === 0 && !settings.showClock) {
                        $target.val('');
                        return;
                    }

                    const dateObjects = selectedDatesState.map(dStr => {
                        const [y, m, d] = dStr.split('-').map(Number);
                        return new Date(y, m - 1, d);
                    });

                    const formattedDates = dateObjects.map(dObj => formatDate(dObj, settings.dateFormat));

                    let datePart = formattedDates.join(', ');
                    if (settings.mode === 'range' && formattedDates.length === 2) {
                        const separator = i18nData.calendar?.rangeSeparator || ' - ';
                        datePart = `${formattedDates[0]} ${separator} ${formattedDates[1]}`;
                    }

                    let timePart = '';
                    if (settings.showClock && currentTimeState) {
                        const h = String(currentTimeState.hour).padStart(2, '0');
                        const m = String(currentTimeState.minute).padStart(2, '0');

                        if (settings.format24h) {
                            timePart = `${h}:${m}`;
                        } else {
                            timePart = `${h}:${m} ${currentTimeState.ampm}`;
                        }
                    }

                    const fullValue = [datePart, timePart].filter(Boolean).join(' ');
                    $target.val(fullValue);
                };

                // INICIALIZADORES DE MÓDULOS
                if (isBirthdayMode) {
                    initBirthday($bdayContainer, settings, $, i18nData, function (dateStr) {
                        selectedDatesState = [dateStr];
                        updateInputValue();

                        if (typeof settings.onSelectDate === 'function') {
                            const [y, m, d] = dateStr.split('-').map(Number);
                            const dateObj = new Date(y, m - 1, d);
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

                    $calContainer.off('click', '.dtp-prev').on('click', '.dtp-prev', function (e) {
                        e.stopPropagation();
                        currentDate.setMonth(currentDate.getMonth() - 1);
                        updateCalendar();
                    });

                    $calContainer.off('click', '.dtp-next').on('click', '.dtp-next', function (e) {
                        e.stopPropagation();
                        currentDate.setMonth(currentDate.getMonth() + 1);
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
                        if (!dateKey) return;

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
                        updateInputValue();

                        if (typeof settings.onSelectDate === 'function') {
                            const dateObjects = selectedDatesState.map(dStr => {
                                const [y, m, d] = dStr.split('-').map(Number);
                                return new Date(y, m - 1, d);
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
                        updateInputValue();

                        if (typeof settings.onSelectTime === 'function') {
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

                    selectedDatesState = [`${y}-${m}-${d}`];
                    currentDate = new Date();
                    if (settings.showCalendar && !isBirthdayMode) {
                        renderCalendar($calContainer, currentDate, settings, selectedDatesState, hoverDateState, $, i18nData);
                    }
                    updateInputValue();
                });

                $card.on('click', '.dtp-btn-now', function (e) {
                    e.stopPropagation();
                    if (settings.showClock) {
                        $clockContainer.trigger('dtp:set-now');
                    }
                });

                $card.on('click', '.dtp-btn-clear', function (e) {
                    e.stopPropagation();
                    selectedDatesState = [];
                    hoverDateState = null;
                    if (settings.showCalendar && !isBirthdayMode) {
                        renderCalendar($calContainer, currentDate, settings, selectedDatesState, hoverDateState, $, i18nData);
                    }
                    updateInputValue();

                    if (typeof settings.onSelectDate === 'function') {
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

                    $(document).off(`click.dtpInputClose_${instanceId}`).on(`click.dtpInputClose_${instanceId}`, function () {
                        closePicker();
                    });
                }

                instance = { open: openPicker, close: closePicker, destroy: destroyPicker };
                $target.data('datetimepicker', instance);
            });
        };
    })(jQuery);

})();
