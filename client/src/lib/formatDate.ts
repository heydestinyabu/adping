export function formatDateTimeOLD(dateString:string, options = {}) {
    if (!dateString) return '';
  
    const date = new Date(dateString);
  
    // Default formatting options
    const defaultOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false, // change to true if you prefer AM/PM
    };
  
    return date.toLocaleString('en-US', { ...defaultOptions, ...options });
  }



export function formatDateTime(dateString: string) {
  if (!dateString) return "";

  return new Date(dateString).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}
  