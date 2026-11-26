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
  newTask: { fr: 'Nouvelle tâche', es: 'Nueva tarea' },
  newMember: { fr: 'Nouveau membre', es: 'Nuevo miembro' },
  preview: { fr: 'Aperçu', es: 'Vista previa' },
  save: { fr: 'Enregistrer', es: 'Guardar' },
  cancel: { fr: 'Annuler', es: 'Cancelar' },
  nameFr: { fr: 'Nom en français', es: 'Nombre en francés' },
  nameEs: { fr: 'Nom en espagnol (facultatif)', es: 'Nombre en español (opcional)' },
  firstName: { fr: 'Prénom', es: 'Nombre' },
  color: { fr: 'Couleur', es: 'Color' },
  picture: { fr: 'Image', es: 'Imagen' },
  familyCode: { fr: 'Code de la famille', es: 'Código de la familia' },
  enter: { fr: 'Entrer', es: 'Entrar' },
  wrongCode: { fr: 'Ce n’est pas le bon code, réessayez.', es: 'No es el código correcto, inténtelo de nuevo.' },
  recurring: { fr: 'Tous les jours', es: 'Todos los días' },
  role: { fr: 'Adulte ou enfant', es: 'Adulto o niño' },
  adult: { fr: 'Adulte', es: 'Adulto' },
  child: { fr: 'Enfant', es: 'Niño' },
  crew: { fr: 'Qui peut la faire ?', es: '¿Quién puede hacerla?' },
  crewAdult: { fr: 'Un adulte', es: 'Un adulto' },
  crewChildAdult: { fr: 'Un enfant et un adulte', es: 'Un niño y un adulto' },
  crewChild: { fr: 'Un enfant seul', es: 'Un niño solo' },
  draw: { fr: 'Tirer au sort les tâches', es: 'Sortear las tareas' },
  listen: { fr: 'Écouter', es: 'Escuchar' },
  resetDay: { fr: 'Remettre à zéro', es: 'Reiniciar' },
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
