export function renderCalendar($container, currentDate, settings, selectedDates, hoverDate, $, i18nData) {
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