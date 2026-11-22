# Réécriture

Casse-tête de réécriture de mots. On écrit des règles `motif > remplacement` ; elles s'appliquent
dans n'importe quel ordre et à n'importe quel endroit. Un niveau est réussi quand, pour chaque essai,
tous les ordres possibles s'arrêtent sur le mot attendu.

Le jeu est une page statique : `index.html`.

## Modifier

`index.html` est fabriqué ; ne pas l'éditer à la main.

    python3 construire.py

assemble `gabarit.html` (interface), `moteur.js` (moteur), `niveaux.json` (niveaux et essais) et
`textes.json` (noms, consignes et interface, par langue).
