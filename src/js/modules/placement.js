// Keep the popup inside the available viewport without moving the page.
export function popupPlacement(spaceAbove, spaceBelow, height, gap = 4) {
    const above = Math.max(0, spaceAbove - gap);
    const below = Math.max(0, spaceBelow - gap);
    const openAbove = height > below && above > below;
    return { openAbove, maxHeight: openAbove ? above : below };
}

export function horizontalPlacement(inputLeft, inputRight, width, viewportWidth, padding = 8) {
    const available = Math.max(0, viewportWidth - padding * 2);
    const popupWidth = Math.min(width, available);
    let left = inputLeft;
    if (left + popupWidth > viewportWidth - padding) left = inputRight - popupWidth;
    return Math.max(padding, Math.min(left, viewportWidth - padding - popupWidth));
}
