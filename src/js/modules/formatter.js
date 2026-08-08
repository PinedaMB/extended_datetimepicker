/**
 * Formatea un objeto Date según la plantilla dada.
 * @param {Date} date 
 * @param {string} format - Ej: 'YYYY-MM-DD', 'DD/MM/YYYY'
 * @returns {string} Fecha formateada
 */
export function formatDate(date, format = 'YYYY-MM-DD') {
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