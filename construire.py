# Fabrique index.html à partir de gabarit.html, niveaux.json et consignes.json.
import os
d=os.path.dirname(os.path.abspath(__file__))
lire=lambda f:open(os.path.join(d,f),encoding='utf-8').read()
s=lire('gabarit.html').replace('/*DONNEES*/null',lire('niveaux.json')).replace('/*CONSIGNES*/null',lire('consignes.json'))
open(os.path.join(d,'index.html'),'w',encoding='utf-8').write(s)
