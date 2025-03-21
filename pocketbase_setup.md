# Guide de configuration de PocketBase pour l'application Moonlight

## Configuration de la collection "parties"

Pour que l'application fonctionne correctement, vous devez créer une collection "parties" dans PocketBase avec la structure suivante :

1. Accédez à l'interface d'administration PocketBase à l'adresse http://localhost:8090/_/

2. Connectez-vous avec vos identifiants administrateur

3. Cliquez sur "New collection" et créez une collection nommée "parties"

4. Ajoutez les champs suivants :
   - `title` (type: text, requis: oui)
   - `description` (type: text, requis: oui)
   - `date` (type: date, requis: oui)
   - `location` (type: text, requis: oui)
   - `code` (type: text, requis: non)
   - `organizer` (type: relation, requis: oui, collection liée: users)

5. Configurez les règles d'accès (sous l'onglet API Rules) :
   - Liste/Vue: `@request.auth.id != "" && @request.auth.role = "organisateur"`
   - Création: `@request.auth.id != "" && @request.auth.role = "organisateur"`
   - Modification: `@request.auth.id != "" && (@request.auth.role = "organisateur" || @request.auth.id = organizer.id)`
   - Suppression: `@request.auth.id != "" && (@request.auth.role = "organisateur" || @request.auth.id = organizer.id)`

6. Sauvegardez la collection

## Configuration de l'application

Assurez-vous que l'URL PocketBase dans l'application est correcte :

1. Dans le fichier `frontend/organisateur/utils/api.ts`, vérifiez que l'URL PocketBase est correcte

   Pour un appareil physique, utilisez l'adresse IP de votre ordinateur sur le réseau local :
   ```
   return 'http://192.168.1.49:8090';
   ```

   Remplacez `192.168.1.49` par l'adresse IP de votre ordinateur (trouvable via `ifconfig` ou `ipconfig`).

2. Redémarrez l'application après avoir effectué ces modifications.

## Dépannage

Si vous rencontrez toujours des problèmes :

1. Vérifiez que le serveur PocketBase est en cours d'exécution
2. Assurez-vous que votre appareil peut accéder au serveur PocketBase via le réseau
3. Vérifiez les logs de l'application et du serveur pour identifier les erreurs
4. Vérifiez que l'utilisateur connecté a le rôle "organisateur" 