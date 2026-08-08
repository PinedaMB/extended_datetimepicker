export function initClock($parent, settings, $, i18nData, onTimeChange) {
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