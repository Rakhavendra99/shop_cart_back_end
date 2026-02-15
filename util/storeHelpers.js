/**
 * Check if the store is currently open based on openTime and closeTime.
 * Handles same-day (e.g. 09:00-18:00) and overnight (e.g. 22:00-02:00) ranges.
 * @param {Object} store - Store model instance with openTime, closeTime (TIME or "HH:mm" / "HH:mm:ss")
 * @returns {boolean}
 */
export const isStoreOpen = (store) => {
    if (!store || store.openTime == null || store.closeTime == null) return true;
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const open = parseTimeToMinutes(store.openTime);
    const close = parseTimeToMinutes(store.closeTime);
    if (open <= close) {
        return currentMinutes >= open && currentMinutes <= close;
    }
    return currentMinutes >= open || currentMinutes <= close;
};

function parseTimeToMinutes(time) {
    if (typeof time === 'string') {
        const parts = time.trim().split(':');
        const h = parseInt(parts[0], 10) || 0;
        const m = parseInt(parts[1], 10) || 0;
        return h * 60 + m;
    }
    if (time && typeof time.getHours === 'function') {
        return time.getHours() * 60 + time.getMinutes();
    }
    return 0;
}
