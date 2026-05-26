# UniRota Parintins

Plataforma digital de carona solidária para estudantes do IFAM Campus Parintins.

## Rodar backend

```bash
cd backend
npm install
cd ..
docker compose up -d
cd backend
npx prisma migrate dev --name init
npm run dev
```

API local:

```text
http://localhost:3333
```
