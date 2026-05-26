# Backend — UniRota Parintins

Backend da plataforma UniRota Parintins, aplicativo mobile de carona solidária para estudantes do IFAM Campus Parintins.

## Tecnologias

- Node.js
- Express
- PostgreSQL
- Prisma ORM
- JWT
- Bcrypt
- Socket.IO
- Multer
- Docker

## Instalação

```bash
npm install
```

## Banco de dados

Na raiz do projeto:

```bash
docker compose up -d
```

## Variáveis de ambiente

```bash
cp .env.example .env
```

## Rodar migrations

```bash
npx prisma migrate dev --name init
```

## Rodar backend

```bash
npm run dev
```

## URL local

```text
http://localhost:3333
```

## Prisma Studio

```bash
npm run prisma:studio
```

## E-mail aceito

```text
2023008550@ifam.edu.br
```
