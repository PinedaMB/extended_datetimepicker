export function initBirthday($parent, settings, $, i18nData, onDateChange) {
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