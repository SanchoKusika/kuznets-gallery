/** Same storage key as the prototype, so a saved choice survives the migration. */
export const THEME_KEY = "kz_theme";

/** Runs in <head> before first paint (see app/layout.tsx). Light is the default. */
export const THEME_INIT_SCRIPT = `(function(){try{if(localStorage.getItem("${THEME_KEY}")==="dark")document.documentElement.setAttribute("data-theme","dark")}catch(e){}})()`;
