import $ from 'jquery';
import { parseDate, isDateAllowed, shiftMonth } from './modules/dates.js';
import '../css/jquery.extended.datetimepicker.css';
import { renderCalendar } from './modules/calendar.js';
import { initClock } from './modules/clock.js';
import { initBirthday } from './modules/birthday.js';
import { i18n } from './modules/i18n.js';
import { formatDate } from './modules/formatter.js';

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
            const isVertical = !isHorizontal;

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
                    $(document).off(`click.dtpInputClose_${instanceId}`);
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

                $(document).off(`click.dtpInputClose_${instanceId}`).on(`click.dtpInputClose_${instanceId}`, function () {
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