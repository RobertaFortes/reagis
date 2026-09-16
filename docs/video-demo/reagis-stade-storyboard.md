# Réagis — Publicité stade : storyboard révisé

## Scénario et corrections retenues

« Crée une publicité cinématographique réaliste de 36 secondes, verticale 9:16, pour présenter Réagis sur les réseaux sociaux. Mets en scène une finale fictive Espagne–Argentine 2026 : faute d’un joueur argentin, question sur l’écran géant, participation massive sur smartphones, votes en direct, résultat puis carton rouge. Commence par accueil.jpg et termine par logo.jpeg. Conserve les interfaces du skill, avec les correctifs validés : état EN DIRECT, compteurs animés jusqu’à 55 489 participants et 55 489 votants, barres finales Jaune 47 % et Rouge 53 %, résultat harmonisé. »

## Livrable et limite

Storyboard de production, prompts par plan et instructions de postproduction. Aucun film ni son n’a été généré. Aucun générateur vidéo n’est accessible dans cette session ; le présent document applique la solution de repli explicitement prévue par le skill. Une animation des images fixes ne démontrerait pas les actions demandées et n’est pas présentée comme une publicité achevée.

Les choix de réalisation ci-dessous sont des propositions pour cet exemple. La finale et le mécanisme d’arbitrage sont une fiction publicitaire.

## Inspection des douze références

| Fichier | Dimensions | Contenu observé et usage |
|---|---|---|
| accueil.jpg | 972 × 825 | Page sombre, logo orange, « Faites réagir votre public », boutons « COMMENCER GRATUITEMENT », « SE CONNECTER », rubriques « Temps réel », « Sans téléchargement », « Simple et rapide ». Ouverture exacte. |
| stade.png | 1344 × 768 | Stade nocturne plein, écran suspendu central, tribunes Espagne et Argentine, projecteurs. La référence montre un rassemblement sur le terrain : reprendre l’architecture et l’ambiance, générer le match en cours. |
| faute.jpeg | 2048 × 1143 | Duel au sol, arbitre en vert, écran VAR et score 0-1. Référence de cadrage uniquement : l’image fixe ne prouve pas clairement qui commet la faute. Générer une action argentine sans ambiguïté et des joueurs fictifs. |
| presentation_question.jpg | 1881 × 889 | « Espagne-Argentine 1/35m », « EN PAUSE », « Couleur du carton », « Jaune », « Rouge », 0 %, 0 votes, 0 participants, QR en bas à droite et RG-4TGJ. Source à corriger : état EN DIRECT, compteurs et barres animés selon les spécifications ci-dessous. |
| scan.jpg | 450 × 683 | « Rejoindre une session », « Aucun compte, aucun mot de passe nécessaire. », QR, RG-4TGJ, « Scannez pour rejoindre », saisie manuelle. Ce n’est pas une vue caméra de scanner : ne pas inventer de viseur. |
| presession.jpg | 618 × 585 | Session ESPAGNE-ARGENTINE 1/35M, flamme, « Réagissez en attendant ! », « En attente du présentateur… ». Deuxième interface mobile. |
| reponse.jpg | 517 × 597 | Question « Couleur du carton », Jaune et Rouge, Rouge déjà sélectionné, bouton « Voter ». Troisième interface mobile. |
| resultat.jpg | 1913 × 1073 | Session « TERMINÉE », Jaune 47 %, Rouge 53 %. Bandeau navigateur localhost:5173 visible ; « 1 question · 1 vote » et autres compteurs espacés incohérents. Source à harmoniser : 55 489 votes et 55 489 participants dans toutes les occurrences ; conserver TERMINÉE et 47 % / 53 %. |
| logo.jpeg | 2048 × 1143 | Emblème R orange avec flamme et ondes, nom Réagis en relief, fond sombre et halo orange. Source finale inchangée. |
| fan_voting_on.jpeg | 2048 × 1143 | Smartphone tenu devant un supporter espagnol, pouce devant le bouton, foule floue. Référence de proximité ; utiliser reponse.jpg pour les pixels de l’interface. |
| supporter_voting.jpeg | 2048 × 1143 | Téléphone au premier plan, tribunes et terrain derrière, supporters des deux camps. Référence de composition ; interface à remplacer par la source exacte en postproduction. |
| creer_question.jpg | 1942 × 927 | Tableau organisateur Réagis, MICHEL, brouillon, compteurs à zéro, question, QR RG-4TGJ. Consulté pour cohérence ; pas de séquence organisateur dans ce montage. |

## Storyboard minuté

Cible : 1080 × 1920, 30 images/s, 1 080 images, durée nette 36 s. Les transitions sont comprises dans ces intervalles et ne rallongent pas le film.

| Séquence | Temps | Image et action | Son |
|---|---|---|---|
| 1. Ouverture | 0–2,5 s | accueil.jpg entier, proportions conservées sur fond noir. Fondu court vers le stade en fin de plan. | Début d’ambiance de foule en anticipation. |
| 2. Stade | 2,5–7 s | Descente de caméra depuis les tribunes hautes, terrain et écran central visibles. Match en cours ; milliers de supporters. | Chants diffus, ambiance enveloppante, début de pulsation musicale. |
| 3. Faute | 7–10,5 s | Joueur argentin fictif accrochant clairement la jambe du joueur espagnol. Arbitre siffle, avance et désigne l’écran. | Contact, sifflet distinct, réaction collective ; musique abaissée. |
| 4. Question | 10,5–14 s | Approche de l’écran et incrustation de la version corrigée de presentation_question.jpg : EN DIRECT, compteurs à zéro et barres vides. Montrer la question, puis détail frontal du QR dans l’écran. | Tension légère ; foule en retrait. |
| 5. Participation | 14–22 s | 14–16 : vague de téléphones dans plusieurs tribunes. 16–18 : scan.jpg. 18–20 : presession.jpg. 20–22 : reponse.jpg, pouce appuyant sur Voter sans masquer longtemps le libellé. | Montée rythmique, rumeur de foule ; pas de notification fictive ajoutée à l’app. |
| 6. Votes en direct | 22–27 s | Retour à la vue question corrigée : progression des participants et votants jusqu’à 55 489 chacun ; barres et pourcentages synchronisés jusqu’à Jaune 47 %, Rouge 53 %. Maintien final de 0,5 s. | Accélération musicale modérée et montée d’attente. |
| 7. Résultat | 27–32 s | Résultat harmonisé 27–29 : TERMINÉE, 55 489 votes, 55 489 participants, Jaune 47 %, Rouge 53 % ; carton rouge 29–30 ; réactions 30–32. Supporters espagnols joyeux, argentins déçus. | Pic de foule, joie et déception naturelles. |
| 8. Conclusion | 32–36 s | 32–33,2 : élévation au-dessus du stade. 33,2–33,6 : fondu. 33,6–36 : logo.jpeg entier et centré, immobile. | Résolution musicale ; foule s’éloignant, extinction propre. |

## Prompts de génération

### Préfixe commun à tous les plans filmés

Publicité photoréaliste cinématographique verticale 9:16, stade nocturne inspiré de stade.png, même architecture et même écran géant, projecteurs blancs, couleurs de peau naturelles, supporters divers et crédibles. Finale fictive Espagne–Argentine 2026. Joueurs fictifs, aucune ressemblance reconnaissable avec un joueur réel. Ne pas ajouter de marque ni d’emblème officiel absent des références. Conserver les mêmes personnages, vêtements, positions et accessoires entre plans raccordés. Anatomie correcte, cinq doigts par main, téléphones rigides de géométrie constante. Caméra fluide et stable. Générer des surfaces d’écran neutres destinées au remplacement en postproduction : aucun texte, QR, résultat ou logo généré. Pas de style cartoon, pas de visage fondu, pas de foule dupliquée manifestement, pas de scintillement.

### 1 — Ouverture, 2,5 s

Pas de génération. Composer directement accueil.jpg, sans redessiner ni modifier le texte. Mise à l’échelle uniforme, fond noir pour compléter le cadre vertical. Garder le titre et les boutons visibles. Fondu global vers le plan suivant, sans animation interne du logo.

### 2 — Stade, 4,5 s

Appliquer le préfixe commun. Plan depuis les tribunes hautes d’un immense stade plein. Descente douce et légère avancée de caméra ; garder le terrain, l’écran suspendu et les deux groupes de supporters dans une composition verticale. Match réellement en cours, joueurs répartis sur le terrain. Écran central neutre, foule vivante, mouvements non synchronisés sauf action collective prévue au plan 5.

### 3 — Faute, 3,5 s

Appliquer le préfixe commun. Utiliser faute.jpeg comme référence de proximité et de lumière, sans copier les identités des joueurs. Le joueur en bleu ciel et blanc accroche de façon évidente la jambe du joueur en rouge ; chute crédible et compréhensible. Même arbitre en vert : il siffle, fait un pas vers eux puis désigne l’écran géant. Mouvement court et lisible, aucun contact violent graphique. Conserver une direction de jeu constante.

### 4 — Question, 3,5 s

Appliquer le préfixe commun. Caméra orientée vers le même écran géant rectangulaire neutre, mouvement d’approche régulier, façade presque frontale en fin de mouvement. Laisser des éléments de charpente et des tribunes reconnaître le stade. Prévoir en montage une vue générale de l’écran puis un détail frontal de sa zone inférieure droite pour rendre le QR grand sans déplacer l’interface.

### 5A — Foule, 2 s

Appliquer le préfixe commun. Plusieurs sections de tribunes sortent leur smartphone dans une vague collective ; des milliers de personnes participent avec un léger décalage naturel. Téléphones proportionnés, mains crédibles. Écran géant et terrain restent repérables à l’arrière-plan.

### 5B, 5C, 5D — Interfaces mobiles, 2 s chacune

Appliquer le préfixe commun. S’inspirer de supporter_voting.jpeg pour l’axe sur le terrain et de fan_voting_on.jpeg pour la proximité. Même supporter au maillot rouge, même bracelet rouge et jaune, même téléphone noir tenu dans la même main. Générer séparément trois clips raccordés à partir d’une même image de départ validée. Écran neutre, presque frontal, stable, sans déformation. B : présentation du téléphone, écran dégagé. C : maintien stable. D : pouce approchant puis touchant la zone du bouton située dans la moitié inférieure. Le pouce reste un calque d’occlusion devant l’interface incrustée. Aucun écran de confirmation inventé.

En postproduction, B reçoit scan.jpg, C presession.jpg, D reponse.jpg. Le choix Rouge est déjà présent dans la source : ne pas simuler une sélection supplémentaire.

### 6 — Votes, 5 s

Appliquer le préfixe commun. Reprendre l’axe et l’éclairage du plan 4, caméra quasi fixe sur l’écran neutre. Conserver l’écran assez frontal pour une lecture des barres. Pas de chiffres générés. Composer ensuite la vue presentation_question.jpg corrigée avec EN DIRECT. Animer les deux compteurs numériques, les deux barres et leurs pourcentages selon les jalons ci-dessous. Garder la mise en page fixe et le QR intact. Les chiffres sont composés en postproduction, jamais générés dans le clip.

### 7A — Résultat, 2 s

Reprendre le plan d’écran stable. Incruster la version harmonisée de resultat.jpg : TERMINÉE, « 1 question · 55 489 votes », « 55 489 votes » sous les barres, « 55 489 PARTICIPANTS » et résultat Jaune 47 % / Rouge 53 %. Reprendre exactement les valeurs de fin du plan 6, sans remise à zéro. Un cadrage d’approche améliore la lecture sans réorganiser l’interface. Le retrait du bandeau navigateur ne fait pas partie du correctif demandé.

### 7B — Carton rouge, 1 s

Appliquer le préfixe commun. Même arbitre, mêmes joueurs et même endroit du terrain que le plan 3. L’arbitre lève nettement un carton rouge vers le joueur argentin fictif, cadrage permettant de lire immédiatement le geste. Générer avec marges temporelles puis conserver une seconde lisible ; refaire le plan si le geste est trop rapide.

### 7C — Réactions, 2 s

Appliquer le préfixe commun. Retrouver les supporters établis au plan 5, mêmes places et habits. Les Espagnols se réjouissent, les Argentins baissent les bras ou montrent une déception naturelle. Ne pas inverser les camps ou transformer les visages. Téléphones toujours cohérents.

### 8 — Conclusion, 4 s dont 1,2 s de mouvement

Appliquer le préfixe commun pour le seul plan du stade. La caméra s’élève au-dessus du même stade illuminé, mouvement continu et calme. En montage, fondu global vers logo.jpeg. Maintenir la source entière avec ses proportions, son texte, ses couleurs et son halo ; aucune recréation, recoloration, déformation ou animation interne. Fond complémentaire sombre uni si nécessaire.

## Postproduction précise

1. Construire des plans indépendants et valider leurs images de raccord avant l’assemblage. Verrouiller les références de personnages et accessoires pour les plans liés.
2. Remplacer chaque écran par suivi planaire de ses quatre coins. Adapter uniformément le ratio de la source à une surface intérieure ; compléter par des marges sombres, sans étirer les interfaces presque carrées pour remplir le téléphone.
3. Séparer les masques du téléphone, des doigts et du pouce. Le doigt occulte l’interface ; il ne doit pas être effacé par l’incrustation. Reflets très légers et luminosité adaptée, sans nuire aux textes.
4. Pour le QR, privilégier une surface frontale et un plan stable. L’agrandissement ne crée pas de détails supplémentaires. Sa lecture automatique n’a pas été vérifiée ; ne pas annoncer qu’il est scannable.
5. Appliquer les correctifs autorisés aux états et compteurs, puis animer les nombres, les barres et leurs pourcentages selon la section ci-dessous. Conserver les pixels hors de ces zones. Adapter la largeur des cartouches uniquement si nécessaire pour afficher 55 489 sans chevauchement ; conserver leur ancrage et leur style.
6. Le score du sondage ne doit pas être confondu avec celui du match. Ne pas reprendre alternativement les scores incompatibles visibles dans les références d’ambiance ; garder les tableaux sportifs hors des gros plans ou choisir une continuité unique lors de la génération du décor.
7. Monter sur la timeline : 0 / 2,5 / 7 / 10,5 / 14 / 22 / 27 / 32 / 36 s. Transitions incluses ; vérifier 1 080 images à 30 images/s.
8. Ajouter de véritables éléments audio disponibles pour la production : stade, chants, sifflet, réactions et musique technologique. Aucun élément audio n’est fourni ou validé ici. Abaisser la musique au sifflet, limiter les crêtes et vérifier l’absence de saturation sur écouteurs et haut-parleur mobile.

## Correctifs des interfaces et animation

Ces corrections sont autorisées par les échanges avec l’utilisateur et remplacent, pour ce storyboard, la restriction initiale du skill limitant les modifications aux scores. Le présent travail décrit les corrections : les fichiers JPG et le skill lui-même ne sont pas modifiés.

### Vue presentation_question.jpg

- Remplacer « EN PAUSE » par « EN DIRECT », dans le même emplacement et le même style de badge ; ne pas conserver une icône pause contradictoire.
- Animer le compteur « votes » sous les réponses et le compteur « PARTICIPANTS » en bas à gauche. Conserver ces libellés et utiliser des espaces pour les milliers : « 55 489 ».
- Animer le remplissage des deux barres dans leurs cadres existants et les pourcentages adjacents. Les couleurs, les dimensions des cadres et leur disposition restent celles de l’interface.
- Conserver « Espagne-Argentine 1/35m », « Couleur du carton », « Jaune », « Rouge », le QR, RG-4TGJ et les autres éléments.
- Au plan 4 : zéro participant, zéro vote et barres vides. Les inscriptions et premiers votes commencent pendant le plan 5 ; au retour écran, les premiers compteurs sont donc déjà non nuls.

### Jalons proposés pour le plan 6, de 22 à 27 secondes

Les valeurs intermédiaires ci-dessous sont des données de mise en scène proposées pour l’animation, pas des mesures réelles. Les valeurs finales ont été fixées avec l’utilisateur. Les participants précèdent les votes ; les deux compteurs ne deviennent égaux qu’à la fin.

| Temps du film | Participants | Votes | Votes Jaune | Votes Rouge | Pourcentages affichés Jaune / Rouge |
|---|---:|---:|---:|---:|---|
| 22 s | 12 000 | 4 000 | 2 000 | 2 000 | 50 % / 50 % |
| 23 s | 28 000 | 16 000 | 7 840 | 8 160 | 49 % / 51 % |
| 24 s | 42 000 | 31 000 | 14 880 | 16 120 | 48 % / 52 % |
| 25 s | 51 000 | 45 000 | 21 150 | 23 850 | 47 % / 53 % |
| 26 s | 55 489 | 53 000 | 24 910 | 28 090 | 47 % / 53 % |
| 26,5 s | 55 489 | 55 489 | 26 080 | 29 409 | 47 % / 53 % |
| 26,5–27 s | 55 489 | 55 489 | 26 080 | 29 409 | Maintien 47 % / 53 % |

Interpoler les nombres de votes Jaune et Rouge en entiers croissants, puis calculer leur somme pour le compteur de votes. Interpoler les participants en garantissant participants ≥ votes à chaque image. Calculer les proportions des barres à partir de ces mêmes données ; arrondir le pourcentage Jaune à l’entier et afficher Rouge = 100 − Jaune. Les valeurs absolues par réponse servent au calcul et n’ajoutent pas de nouveaux champs dans l’interface.

Avec 55 489 votes, une répartition strictement exacte de 47 % / 53 % ne correspond pas à des nombres entiers de votes. Les valeurs proposées 26 080 et 29 409 totalisent exactement 55 489 et donnent les pourcentages affichés 47 % / 53 % après arrondi.

Animation fluide avec ralentissement final, sans dépassement ni retour arrière des compteurs. Les pourcentages peuvent évoluer dans les deux sens selon les votes, mais chaque nombre absolu de votes reste croissant. Conserver les valeurs finales durant la demi-seconde précédant le résultat.

### Vue resultat.jpg

- Conserver « TERMINÉE » et le résultat Jaune 47 % / Rouge 53 %.
- Remplacer « 1 question · 1 vote » par « 1 question · 55 489 votes ».
- Remplacer le compteur sous les barres par « 55 489 votes » et celui des participants par « 55 489 PARTICIPANTS ».
- Vérifier toutes les occurrences : aucun ancien compteur ne doit subsister.
- Conserver la mise en page, les autres textes, le QR et le logo. Les valeurs restent fixes pendant les deux secondes du résultat.

## Points restant à vérifier lors de la production

- Le bandeau navigateur visible dans resultat.jpg reste un défaut de la référence, distinct des correctifs de compteurs. Une capture propre serait nécessaire pour le retirer sans altérer l’interface ; sa suppression n’est pas incluse dans cette révision.
- Les interfaces larges sont difficiles à lire intégralement dans un film vertical. Combiner une vue entière et des détails de caméra sans réorganiser les écrans. La lisibilité des compteurs, pourcentages et boutons doit être contrôlée à la taille de diffusion.
- scan.jpg est un écran proposant un QR, pas un scanner caméra. Le montage conserve cette source et ne démontre pas techniquement un scan réel.

## Contrôle final du livrable préparatoire

| Contrôle | État |
|---|---|
| Douze références ouvertes et inspectées | Effectué |
| Huit séquences dans l’ordre imposé | Prévu dans le storyboard |
| Toutes les durées dans leurs fourchettes | Conforme à la timeline, total 36 s |
| Stade, faute, arbitre, carton rouge, foule | Décrits dans les prompts ; non générés |
| Trois interfaces mobiles exactes | Sources et ordre spécifiés ; incrustation non réalisée |
| Question et résultat corrigés ; logo inchangé | Corrections spécifiées ; images non retouchées dans ce livrable |
| Animation des participants, votes, barres et pourcentages | Jalons définis ; fin à 55 489 / 55 489 et 47 % / 53 % ; non exécutée |
| QR net et lisible automatiquement | Contrôle visuel final et décodage non effectués |
| Continuité, anatomie, téléphone | À vérifier image par image sur les futurs clips |
| Son, durée vidéo, format exporté | Aucun fichier vidéo ou audio à contrôler |
| Visionnage complet image par image | Non applicable au storyboard ; indispensable avant livraison du film |

Le livrable préparatoire est terminé. La production vidéo et sa validation restent à réaliser avec un générateur vidéo et un outil de compositing ; aucune conformité du film n’est revendiquée.
