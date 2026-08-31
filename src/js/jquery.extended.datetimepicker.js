import '../css/jquery.extended.datetimepicker.css';
import { renderCalendar } from './modules/calendar.js';
import { initClock } from './modules/clock.js';
import { initBirthday } from './modules/birthday.js';
import { i18n } from './modules/i18n.js';
import { formatDate } from './modules/formatter.js';

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
                defaultTime: null,
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
            const isVertical = !isHorizontal;

            // Determinamos el layout CSS
            const layoutClass = isHorizontal ? 'dtp-layout-horizontal' : 'dtp-layout-vertical';

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

            // --- OBTENCIÓN DE NODOS INTERNOS DEL DOM ---
            const $bdayContainer = $card.find('.dtp-birthday-section');
            const $calContainer = $card.find('.dtp-calendar-section');
            const $clockContainer = $card.find('.dtp-clock-section');

            let $wrapper;
            const instanceId = Math.random().toString(36).substring(2, 9);

            if (isInput) {
                $target.attr('readonly', true);
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

            // --- DESTRUCCIÓN SEGURA DE INSTANCIA ---
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

                    $target.val(`${startStr} ${separator} ${endStr}`);
                } else {
                    let datePart = formattedDates.join(', ');
                    let timePart = '';

                    if (settings.showClock && currentTimeState) {
                        // Maneja estado de array o único para modo single/multiple
                        timePart = formatTimeObj(Array.isArray(currentTimeState) ? currentTimeState[0] : currentTimeState);
                    }

                    const fullValue = [datePart, timePart].filter(Boolean).join(' ');
                    $target.val(fullValue);
                }
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