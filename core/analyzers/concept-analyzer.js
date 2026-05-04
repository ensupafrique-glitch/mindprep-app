export function buildSchema(mainIdea, type) {
  return type.isManagement
    ? `${mainIdea}\n        ↓\n  Données / faits\n   ↙        ↘\nMesure     Analyse\n   \\        /\n   Décision\n        ↓\n Performance`
    : `${mainIdea}\n        ↓\n  Notions clés\n   ↙        ↘\nContexte   Problème\n   \\        /\n Argumentation\n        ↓\n Application`;
}
