export function buildReconstruction(type) {
  return [
    "Redessiner le schéma logique de mémoire.",
    "Réexpliquer le cours à voix haute avec la méthode Feynman.",
    "Créer 3 questions: définition, relation, application.",
    "Refaire un exercice ou un mini-cas sans correction.",
    type.isHumanities ? "Faire un plan en 2 ou 3 axes avant d’écrire." : "Vérifier que chaque règle est appuyée par un exemple concret.",
  ];
}
