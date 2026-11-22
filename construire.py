# Fabrique index.html à partir de gabarit.html, moteur.js, niveaux.json et textes.json.
import os
d=os.path.dirname(os.path.abspath(__file__))
lire=lambda f:open(os.path.join(d,f),encoding='utf-8').read()
s=lire('gabarit.html')
for marque,fichier in(('/*MOTEUR*/','moteur.js'),('/*DONNEES*/null','niveaux.json'),('/*TEXTES*/null','textes.json')):
    assert s.count(marque)==1,marque
    s=s.replace(marque,lire(fichier))
open(os.path.join(d,'index.html'),'w',encoding='utf-8').write(s)
