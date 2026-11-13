const base = { fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }

export const IconDash = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" strokeWidth="2" {...base}>
    <rect x="3" y="3" width="7" height="9" rx="2" /><rect x="14" y="3" width="7" height="5" rx="2" />
    <rect x="14" y="12" width="7" height="9" rx="2" /><rect x="3" y="16" width="7" height="5" rx="2" />
  </svg>
)
export const IconEnc = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" strokeWidth="2" {...base}>
    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="1" /><path d="M9 12h6M9 16h4" />
  </svg>
)
export const IconUsr = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" strokeWidth="2" {...base}>
    <circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18.5 20a6.5 6.5 0 0 0-3-5.5" />
  </svg>
)
export const IconPlus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" strokeWidth="2.4" fill="none" stroke="currentColor" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
)
export const IconFilter = () => (
  <svg className="ic" width="16" height="16" viewBox="0 0 24 24" strokeWidth="2" {...base}><path d="M3 5h18l-7 8v6l-4 2v-8z" /></svg>
)
export const IconClose = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" strokeWidth="2" fill="none" stroke="currentColor" strokeLinecap="round" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12" /></svg>
)
export const IconChat = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" strokeWidth="2" {...base}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
)