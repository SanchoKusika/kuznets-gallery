/** Set on <html> for the first page of a visit: the header logo builds itself (Logo.module.scss). */
export const LOGO_INTRO_ATTR = "data-logo-intro";

/** Longer than the whole build; then the attribute goes, so a logo shown later doesn't replay it. */
const LOGO_INTRO_MS = 2000;

/**
 * Runs in <head> before first paint, so the logo starts hidden instead of flashing finished. Once
 * per session, not in the admin (no header there), not with reduced motion.
 */
export const LOGO_INTRO_SCRIPT = `(function(){try{var k="kz-logo-intro",h=document.documentElement;if(location.pathname.indexOf("/admin")!==0&&!matchMedia("(prefers-reduced-motion: reduce)").matches&&!sessionStorage.getItem(k)){sessionStorage.setItem(k,"1");h.setAttribute("${LOGO_INTRO_ATTR}","");setTimeout(function(){h.removeAttribute("${LOGO_INTRO_ATTR}")},${LOGO_INTRO_MS})}}catch(e){}})()`;
