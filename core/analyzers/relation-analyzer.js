export function buildRelations(type) {
  return type.isManagement
    ? [
        "Résultat = Revenus - Coûts",
        "Risque augmente quand les charges fixes augmentent",
        "Décision = information fiable + contrainte + objectif",
      ]
    : [
        "Problématique = notion + tension + enjeu",
        "Argument = idée + exemple + analyse",
        "Maîtrise = compréhension + méthode + application",
      ];
}
