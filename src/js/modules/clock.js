export function initClock($parent, settings, $, i18nData, onTimeChange) {
    let $clockWrapper = $parent.find('.dtp-clock-wrapper');
    if ($clockWrapper.length > 0) {
        $clockWrapper.remove();
    }

    const lang = i18nData.clock;
    const is24h = settings.format24h;
    const isRange = settings.mode === 'range';

    const arrowUp = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chevron-up" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M7.646 4.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1-.708.708L8 5.707l-5.646 5.647a.5.5 0 0 1-.708-.708z"/></svg>`;
    const arrowDown = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chevron-down" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708"/></svg>`;

    // El estado ahora es un array. 1 elemento para modo normal, 2 elementos para rango.
    let state = isRange 
        ? [{ hour: is24h ? 0 : 12, minute: 0, ampm: 'AM' }, { hour: is24h ? 23 : 11, minute: 59, ampm: 'PM' }]
        : [{ hour: is24h ? 0 : 6, minute: 0, ampm: 'PM' }];

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
        clocksHtml += renderClockControls(0, (i18nData.code === 'en' ? 'Start Time' : 'Hora Inicio'));
        clocksHtml += renderClockControls(1, (i18nData.code === 'en' ? 'End Time' : 'Hora Fin'));
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

    updateDisplay();
}