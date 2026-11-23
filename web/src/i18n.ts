/** Tous les textes de l'interface, en français et en espagnol. */
export interface Bilingual {
  fr: string;
  es: string;
}

export const t = {
  appName: { fr: 'Tâches de la famille', es: 'Tareas de la familia' },
  todo: { fr: 'À faire', es: 'Por hacer' },
  done: { fr: 'Fini !', es: '¡Terminado!' },
  whoDidIt: { fr: "Qui l'a fait ?", es: '¿Quién lo hizo?' },
  manage: { fr: 'Gérer', es: 'Gestionar' },
  back: { fr: 'Retour au tableau', es: 'Volver al tablero' },
  tasks: { fr: 'Tâches', es: 'Tareas' },
  members: { fr: 'Membres', es: 'Miembros' },
  addTask: { fr: 'Ajouter une tâche', es: 'Añadir una tarea' },
  addMember: { fr: 'Ajouter un membre', es: 'Añadir un miembro' },
  edit: { fr: 'Modifier', es: 'Editar' },
  remove: { fr: 'Supprimer', es: 'Eliminar' },
  moveUp: { fr: 'Monter', es: 'Subir' },
  moveDown: { fr: 'Descendre', es: 'Bajar' },
  save: { fr: 'Enregistrer', es: 'Guardar' },
  cancel: { fr: 'Annuler', es: 'Cancelar' },
  nameFr: { fr: 'Nom en français', es: 'Nombre en francés' },
  nameEs: { fr: 'Nom en espagnol (facultatif)', es: 'Nombre en español (opcional)' },
  firstName: { fr: 'Prénom', es: 'Nombre' },
  color: { fr: 'Couleur', es: 'Color' },
  picture: { fr: 'Image', es: 'Imagen' },
  emojis: { fr: 'Emojis', es: 'Emojis' },
  photos: { fr: 'Photos', es: 'Fotos' },
  noPhotos: {
    fr: 'Aucune photo : ajoutez-en dans /data/kanban/photos sur le serveur.',
    es: 'No hay fotos: añádalas en /data/kanban/photos en el servidor.',
  },
  recurring: { fr: 'Tous les jours', es: 'Todos los días' },
  listen: { fr: 'Écouter', es: 'Escuchar' },
  resetDay: { fr: 'Remettre les tâches du jour à zéro', es: 'Reiniciar las tareas del día' },
  confirmReset: {
    fr: 'Remettre toutes les tâches quotidiennes dans « À faire » ?',
    es: '¿Volver a poner todas las tareas diarias en «Por hacer»?',
  },
  confirmDeleteTask: { fr: 'Supprimer cette tâche ?', es: '¿Eliminar esta tarea?' },
  confirmDeleteMember: {
    fr: 'Supprimer ce membre ? Il sera retiré de ses tâches.',
    es: '¿Eliminar a este miembro? Se quitará de sus tareas.',
  },
  ok: { fr: 'OK', es: 'OK' },
} satisfies Record<string, Bilingual>;

/** « texte FR / texte ES », ou seulement le français si l'espagnol est vide ou identique. */
export const both = ({ fr, es }: Bilingual): string => (es && es !== fr ? `${fr} / ${es}` : fr);
