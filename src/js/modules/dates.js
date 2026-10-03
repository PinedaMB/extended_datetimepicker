export function parseDate(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(0);
    date.setFullYear(year, month - 1, day);
    date.setHours(0, 0, 0, 0);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null;
}

export function dateKey(date) {
    return `${String(date.getFullYear()).padStart(4, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function isDateAllowed(value, settings) {
    const date = parseDate(value);
    return !!date && !(settings.minDate && value < settings.minDate)
        && !(settings.maxDate && value > settings.maxDate)
        && !(settings.disableWeekends && [0, 6].includes(date.getDay()))
        && !(Array.isArray(settings.disabledDates) && settings.disabledDates.includes(value));
}

export function shiftMonth(date, amount) {
    const result = new Date(date);
    result.setDate(1);
    result.setMonth(result.getMonth() + amount);
    return result;
}
