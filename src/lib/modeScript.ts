/**
 * The stored theme onto <html> before the first paint (layout.tsx runs it
 * inline in <head>; docs: preventing flash before hydration). Kept apart
 * from theme.ts, a client module, so the server layout can read the string.
 */
export const MODE_KEY = "surreal-mode";

export const MODE_SCRIPT = `(function(){try{var m=JSON.parse(localStorage.getItem("${MODE_KEY}")||'"light"');if(m==="dark"||m==="light")document.documentElement.setAttribute("data-mode",m)}catch(e){}})()`;
