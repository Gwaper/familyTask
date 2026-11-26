/** Emojis proposés dans le sélecteur (aucune bibliothèque, emojis natifs de l'appareil). */

export const TASK_EMOJIS = [
  '🧸', '📚', '🛏️', '🪥', '🦷', '🛁', '🚿', '🧼', '👕', '🧦', '👟', '🧥', '🎒', '🧺',
  '🍽️', '🥄', '🥣', '🍎', '🥕', '🥛', '💧', '🌱', '🪴', '🐶', '🐱', '🐟', '🗑️', '🧹',
  '🧽', '🪣', '🚽', '🖍️', '✏️', '🎨', '🎹', '⚽', '🚲', '🧩', '🪀', '🚗', '🛒', '💤',
];

/** Teints de peau Unicode : sur Apple, ils changent aussi la couleur des cheveux (🏽 = châtain). */
const SKIN_TONES = ['🏻', '🏼', '🏽', '🏾', '🏿'];
const PEOPLE = ['👨', '👩', '🧔', '👴', '👵', '👦', '👧', '🧒', '👶'];
const withSkinTones = (emoji: string) => [emoji, ...SKIN_TONES.map((tone) => emoji + tone)];

export const MEMBER_EMOJIS = [
  ...PEOPLE.flatMap(withSkinTones), '👱‍♀️',
  '🐻', '🦊', '🐱', '🐶', '🐰', '🐼', '🐨', '🦁', '🐯', '🐸', '🐵', '🦄', '🐙', '🦖', '🐢', '🐝', '🦋', '🌟',
];

export const MEMBER_COLORS = [
  '#4f7cff', '#ff8a3d', '#22a55a', '#b061ff', '#ffbf1f', '#2ec4d6', '#ff6fb5', '#8d6e63',
];
