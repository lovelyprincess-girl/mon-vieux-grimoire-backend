# Mon Vieux Grimoire — API back-end

API du site **Mon Vieux Grimoire**, un site de référencement et de notation de livres pour une chaîne de librairies à Lille. Les utilisateurs peuvent s'inscrire, ajouter des livres avec une image, les modifier, les supprimer et les noter.

Le front-end React est fourni séparément : [OpenClassrooms-Student-Center/P7-Dev-Web-livres](https://github.com/OpenClassrooms-Student-Center/P7-Dev-Web-livres).

## Technologies

- **Node.js** et **Express** : serveur et routes
- **MongoDB Atlas** et **Mongoose** : base de données
- **bcrypt** : hachage des mots de passe
- **jsonwebtoken** : authentification par token JWT
- **Multer** : réception des images
- **Sharp** : optimisation des images (redimensionnement à 500 px et conversion en WebP)
- **dotenv** : variables d'environnement

## Prérequis

- [Node.js](https://nodejs.org/) installé
- Un compte [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) avec un cluster gratuit, un utilisateur de base de données, et l'accès réseau autorisé (`0.0.0.0/0` en développement)

## Installation

```bash
git clone https://github.com/lovelyprincess-girl/mon-vieux-grimoire-backend.git
cd mon-vieux-grimoire-backend
npm install
```

Crée ensuite un dossier `images` à la racine du projet s'il n'existe pas :

```bash
mkdir images
```

## Configuration

Crée un fichier `.env` à la racine du projet (au même niveau que `app.js`), en t'aidant du modèle `.env.example` :

```
MONGODB_URI=mongodb+srv://<utilisateur>:<mot_de_passe>@<cluster>.mongodb.net/?appName=Cluster0
JWT_SECRET=une_longue_chaine_aleatoire
PORT=4000
```

| Variable | Rôle |
|---|---|
| `MONGODB_URI` | Adresse de connexion à la base MongoDB Atlas |
| `JWT_SECRET` | Clé secrète qui signe les tokens de connexion |
| `PORT` | Port d'écoute du serveur (4000 par défaut) |

Pour générer une clé `JWT_SECRET` aléatoire :

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Le fichier `.env` est exclu de Git (`.gitignore`) : il ne doit jamais être publié.

## Lancement

```bash
node server.js
```

Le terminal doit afficher :

```
Listening on port 4000
Connexion à MongoDB réussie !
```

Pour utiliser le site complet, lance aussi le front-end dans un autre terminal (`npm install` puis `npm start` dans le dossier du front-end). Il s'ouvre sur `http://localhost:3000`.

## Routes de l'API

| Méthode | Route | Authentification | Rôle |
|---|---|---|---|
| POST | `/api/auth/signup` | Non | Crée un compte |
| POST | `/api/auth/login` | Non | Connecte l'utilisateur et renvoie un token |
| GET | `/api/books` | Non | Liste tous les livres |
| GET | `/api/books/bestrating` | Non | Renvoie les 3 livres les mieux notés |
| GET | `/api/books/:id` | Non | Renvoie un livre |
| POST | `/api/books` | Oui | Ajoute un livre avec son image |
| PUT | `/api/books/:id` | Oui | Modifie un livre (avec ou sans nouvelle image) |
| DELETE | `/api/books/:id` | Oui | Supprime un livre et son image |
| POST | `/api/books/:id/rating` | Oui | Note un livre (une seule note par utilisateur) |

Les routes protégées attendent l'en-tête `Authorization: Bearer <token>`. Seul le créateur d'un livre peut le modifier ou le supprimer, sinon l'API répond `403 unauthorized request`.

## Structure du projet

```
├── server.js              # démarrage du serveur
├── app.js                 # configuration Express et connexion à la base
├── models/                # schémas Mongoose (User, Book)
├── controllers/           # logique : comptes, livres, notes
├── routes/                # association des URL aux contrôleurs
├── middleware/
│   ├── auth.js            # vérification du token JWT
│   └── multer-config.js   # réception des images
├── images/                # images envoyées (non versionnées)
└── .env.example           # modèle des variables d'environnement
```

## Sécurité

- Mots de passe hachés avec bcrypt, jamais stockés en clair
- Routes de modification protégées par un token JWT valable 24 h
- Vérification du propriétaire avant toute modification ou suppression d'un livre
- Adresses e-mail uniques en base (plugin `mongoose-unique-validator`)
- Secrets stockés dans `.env`, exclu du suivi Git

## Bonnes pratiques Green Code

Chaque image envoyée est redimensionnée à 500 px de large et convertie en WebP avec Sharp, ce qui réduit son poids, la bande passante utilisée et l'énergie consommée.

## Limites connues et pistes d'amélioration

- La note comprise entre 0 et 5 n'est pas vérifiée côté serveur (elle l'est seulement par le front-end)
- Pas de tests automatisés
- Le CORS autorise toutes les origines : à restreindre en production
- Pas de limitation du nombre de requêtes ni de pagination de la liste des livres
