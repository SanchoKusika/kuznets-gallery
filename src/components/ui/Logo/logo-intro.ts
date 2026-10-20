/** Set on <html> for the first page of a visit: the header logo builds itself (Logo.module.scss). */
export const LOGO_INTRO_ATTR = "data-logo-intro";

/** Long enough for the whole build; then the attribute goes, so a logo shown later doesn't replay it. */
export const LOGO_INTRO_MS = 2000;

/** Runs in <head> before first paint, so the logo starts hidden instead of flashing finished. */
export const LOGO_INTRO_SCRIPT = `(function(){try{var k="kz-logo-intro";if(!matchMedia("(prefers-reduced-motion: reduce)").matches&&!sessionStorage.getItem(k)){sessionStorage.setItem(k,"1");document.documentElement.setAttribute("${LOGO_INTRO_ATTR}","")}}catch(e){}})()`;
