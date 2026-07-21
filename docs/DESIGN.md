---
name: Kinetic Noir
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#3a3939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#e0c0b6'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#a78a82'
  outline-variant: '#58423b'
  surface-tint: '#ffb59e'
  primary: '#ffb59e'
  on-primary: '#5e1700'
  primary-container: '#ec683d'
  on-primary-container: '#521300'
  inverse-primary: '#a8380f'
  secondary: '#c8c6c5'
  on-secondary: '#313030'
  secondary-container: '#474746'
  on-secondary-container: '#b7b5b4'
  tertiary: '#c8c6c6'
  on-tertiary: '#303030'
  tertiary-container: '#919090'
  on-tertiary-container: '#292a2a'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdbd0'
  primary-fixed-dim: '#ffb59e'
  on-primary-fixed: '#3a0b00'
  on-primary-fixed-variant: '#852400'
  secondary-fixed: '#e5e2e1'
  secondary-fixed-dim: '#c8c6c5'
  on-secondary-fixed: '#1c1b1b'
  on-secondary-fixed-variant: '#474746'
  tertiary-fixed: '#e4e2e1'
  tertiary-fixed-dim: '#c8c6c6'
  on-tertiary-fixed: '#1b1c1c'
  on-tertiary-fixed-variant: '#474747'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
typography:
  headline-xl:
    fontFamily: Sora
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Sora
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Sora
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.2'
  body-md:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  body-sm:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-caps:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.1em
  mono-data:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: -0.02em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 16px
  md: 24px
  lg: 40px
  xl: 64px
  gutter: 16px
  margin-mobile: 20px
  margin-desktop: 48px

## Identité & style

Ce système de design est pensé pour une interaction en temps réel, à forts enjeux. Il cible un public qui valorise l'immédiateté et la précision technique, avec une réponse émotionnelle d'urgence maîtrisée et de contrôle sophistiqué.

L'esthétique mélange **minimalisme** et touches subtiles de **high-tech**. En misant sur un environnement sombre proche du vide, le système garantit que les actions orange et les visualisations de données en direct captent toute l'attention. Les mises en page sont débarrassées de tout ornement, avec un alignement strict et un mouvement au service du sens, pour guider l'utilisateur à travers des cycles de sondage et de réaction collective rapides. L'expérience se veut être celle d'un instrument de précision : net, réactif, et affirmé.

## Couleurs

La palette repose sur un orange primaire unique et énergique, posé sur un fond de noirs profonds et de gris sombres. Ce fort contraste garantit la lisibilité en environnement peu éclairé (comme un bar ou une salle de conférence) et signale l'état "en direct" de l'application.

- **Primaire (#D85A30) :** réservé exclusivement aux états interactifs, aux indicateurs "en direct" et aux barres de progression.
- **Niveaux de surface :** le fond est en `#0A0A0A`. Les conteneurs utilisent `#1A1A1A` pour se distinguer, et les accents tertiaires `#404040` pour les bordures inactives ou séparateurs discrets.
- **Couleurs fonctionnelles :** succès et erreur sont réservés au feedback critique, utilisés avec parcimonie pour ne pas nuire à la narration "orange urgent".

## Typographie

La typographie suit une double stratégie pour équilibrer caractère et lisibilité fonctionnelle.

**Sora** est utilisée pour les titres et les données principales. Sa construction géométrique et généreuse donne une voix futuriste et affirmée. **Geist** est la police de travail pour tous les éléments d'interface, descriptions et champs de saisie ; son influence semi-monospace garantit que les chiffres qui changent rapidement (comme les compteurs de vote) restent stables et lisibles.

Pour les participants mobiles, les titres sont réduits pour maximiser l'espace disponible pour les boutons de réaction. Les "label-caps" sont utilisés pour les métadonnées et en-têtes utilitaires, pour maintenir une esthétique technique de type "tableau de bord".

## Mise en page & espacements

La philosophie de mise en page change selon le rôle de l'utilisateur.

**Layout participant (mobile-first) :** grille fluide à une seule colonne. Les composants s'empilent verticalement, avec un focus sur l'accessibilité en "zone du pouce". Les mises en page privilégient le bas de l'écran, pour permettre au participant de réagir tout en gardant un contact visuel avec la scène du présentateur.

**Layout présentateur (desktop) :** grille fixe de 12 colonnes avec de larges marges. Approche "centre de contrôle" : les visualisations de données occupent le centre-gauche, tandis que les outils de modération et flux en temps réel occupent la colonne latérale droite.

Les espacements suivent un rythme strict de 8px. Pour les zones d'interaction critiques, un padding "lg" (40px) crée une sensation de respiration au milieu du flux de données rapide.

## Élévation & profondeur

Dans ce système sombre, la profondeur est communiquée par des **niveaux tonaux** plutôt que par des ombres marquées.

1. **Sol (niveau 0) :** `#0A0A0A` — la toile de fond principale.
2. **Surface (niveau 1) :** `#1A1A1A` — cartes, champs de saisie, boutons inactifs.
3. **Overlay (niveau 2) :** `#262626` — modales et menus déroulants, avec une fine bordure de `#404040` pour définir les contours sur le fond sombre.

Une subtile **lueur intérieure** (1px, orange à faible opacité) est appliquée aux conteneurs "en direct" ou "actifs", pour simuler un écran matériel lumineux et renforcer la narration high-tech.

## Formes

Le système adopte un arrondi **doux (0.25rem)**. Ce rayon minimal conserve le caractère net et technique d'un outil professionnel, tout en évitant la dureté agressive des angles à 0px.

Les boutons et champs de saisie utilisent l'arrondi standard (4px), tandis que les cartes ou modales plus grandes utilisent `rounded-lg` (8px). Cela crée une hiérarchie de formes où les grands conteneurs paraissent plus ancrés, et les éléments interactifs plus petits plus précis.

## Composants

**Boutons :**
- **Primaire :** fond plein `#D85A30`, texte blanc. Contraste fort et impactant.
- **Secondaire :** variante outline avec bordure `#404040` de 1px. Au survol, la bordure s'éclaircit vers l'orange primaire.

**Champs de saisie :**
- Surfaces sombres (`#1A1A1A`) avec une bordure inférieure de 2px qui "s'active" en glissant du centre vers les bords, en orange primaire, au focus.

**Puces & indicateurs :**
- **Indicateur "en direct" :** petit point circulaire à côté d'un texte `label-caps`, avec une animation de pulsation discrète en orange primaire.
- **Puces de réaction :** petites pastilles semi-transparentes orange, utilisées pour afficher le sentiment agrégé.

**Cartes :**
- Les cartes desktop sont sans bordure, fond `#1A1A1A`. Les cartes mobiles ont un contour discret `#404040` pour garantir des zones de clic claires dans la paume de la main.

**Barre de réaction (mobile) :**
- Barre horizontale persistante, en haute priorité d'affichage, en bas de l'écran participant, contenant les déclencheurs de réaction les plus fréquents, avec de grandes cibles tactiles circulaires de 64px.
