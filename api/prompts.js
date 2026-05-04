export const prompts = {
  courseTransformer: (subject, title, notes) => `Transforme ce cours pour ${subject} en une structure d'apprentissage avec :\n1. Idée centrale\n2. Concepts clés\n3. Relations fonctionnelles\n4. Compression intelligente\n5. Reconstruction\n\nTitre : ${title}\nCours : ${notes}`,
};
