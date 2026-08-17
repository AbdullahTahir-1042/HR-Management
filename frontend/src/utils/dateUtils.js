export const formatDate = (dateInput) => {
    if (!dateInput) return '—';
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return '—';
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return dd + '/' + mm + '/' + yyyy;
};

export const formatDateTime = (dateInput) => {
    if (!dateInput) return '—';
    const dateStr = formatDate(dateInput);
    const timeStr = formatTime(dateInput);
    return `${dateStr} ${timeStr}`;
};

export const formatTime = (dateInput) => {
    if (!dateInput) return '—';
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase().replace(' ', '');
};