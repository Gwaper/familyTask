/** Adresses de la vue gestion (le serveur renvoie index.html pour toute adresse inconnue). */
export const MANAGE_PATH = '/gestion';
const MANAGE_PATHS = [MANAGE_PATH, '/manage'];

export const isManagePath = (pathname: string): boolean => MANAGE_PATHS.includes(pathname.replace(/\/+$/, ''));
