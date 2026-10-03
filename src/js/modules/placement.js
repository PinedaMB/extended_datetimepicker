// Keep the popup inside the available viewport without moving the page.
export function popupPlacement(spaceAbove, spaceBelow, height, gap = 4) {
    const above = Math.max(0, spaceAbove - gap);
    const below = Math.max(0, spaceBelow - gap);
    const openAbove = height > below && above > below;
    return { openAbove, maxHeight: openAbove ? above : below };
}
