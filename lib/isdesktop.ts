//check if the environment is desktop
export const isDesktopApp = () => {
  // If window is undefined (server-side rendering), we are not in Tauri
  if (typeof window === "undefined") return false;
  
  // If this variable exists, Tauri is running the app!
  return "__TAURI_INTERNALS__" in window;
};