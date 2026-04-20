Comment ça marche ? (Architecture Dual-Device)

Le projet génère une seule application, mais propose deux interfaces distinctes selon l'URL consultée. La communication entre les deux est assurée par le moteur temps réel de Supabase.
1. L'interface TV (L'hôte)

    URL : https://ton-projet.vercel.app/ (Route par défaut)

    Rôle : Elle agit comme le centre de contrôle et le moteur du jeu.

    Action : Au chargement, elle génère un code de session unique (ex: 8X2-F9Q) et écoute en continu les modifications sur la base de données. Dès qu'une action est détectée, la TV met à jour l'interface instantanément.

2. L'interface Mobile (La manette)

    URL : https://ton-projet.vercel.app/remote

    Rôle : Elle sert de contrôleur distant (Clavier & D-Pad).

    Action : L'utilisateur entre le code affiché sur la TV pour lier les deux appareils. Une fois connecté, chaque pression sur une touche envoie une mise à jour ultra-rapide vers le serveur.

3. Le flux de données (Realtime)

    Mobile → Envoie la touche pressée via une requête sécurisée.

    Cloud → Diffuse l'événement en moins de 100ms.

    TV → Reçoit l'information, valide la saisie et anime le texte en direct.
