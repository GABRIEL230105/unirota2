# UniRota Parintins — Rotas da API

Base URL local:

```text
http://localhost:3333
```

## Auth

POST `/auth/register`

```json
{
  "name": "Nadson Silva",
  "email": "2023008550@ifam.edu.br",
  "password": "123456",
  "course": "Engenharia de Software",
  "shift": "Noturno",
  "bio": "Estudante do IFAM Campus Parintins."
}
```

POST `/auth/login`

```json
{
  "email": "2023008550@ifam.edu.br",
  "password": "123456"
}
```

## Usuários

Todas precisam de token: `Authorization: Bearer SEU_TOKEN`

- GET `/users/me`
- PUT `/users/me`
- PATCH `/users/me/avatar` com Multipart Form: `avatar`
- GET `/users`
- GET `/users/:id`

## Caronas

- POST `/rides`
- GET `/rides`
- GET `/rides?type=OFERTA`
- GET `/rides?origin=Palmares`
- GET `/rides?destination=IFAM`
- GET `/rides?date=2026-05-21`
- GET `/rides/my`
- PATCH `/rides/:id/status`

## Participação

- POST `/ride-participants/:rideId/join`
- PATCH `/ride-participants/:rideId/cancel`
- GET `/ride-participants/me/passenger`
- GET `/ride-participants/me/driver`

## Mensagens

- POST `/messages`
- GET `/messages/inbox`
- GET `/messages/conversation/:userId`

## Avaliações

- POST `/ratings/:rideId`
- GET `/ratings/user/:userId`

## Notificações

- GET `/notifications`
- PATCH `/notifications/:id/read`
- PATCH `/notifications/read/all`

## Histórico

- GET `/activities`

## Sistema

- GET `/`
- GET `/health`
