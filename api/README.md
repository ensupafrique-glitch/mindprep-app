# API REST Initiale

## Ressources principales

- `users`
- `subjects`
- `topics`
- `questions`
- `diagnostics`
- `tests`
- `answers`
- `feedback`
- `progress`
- `subscriptions`

## Endpoints MVP

```http
POST /auth/register
POST /auth/login
GET /me

GET /subjects
GET /subjects/{subjectId}/topics

POST /diagnostics/start
POST /diagnostics/{diagnosticId}/answers
GET /diagnostics/{diagnosticId}/result

POST /tests/adaptive
POST /tests/{testId}/answers
GET /tests/{testId}/feedback

GET /progress
GET /progress/topics
GET /errors/history

POST /subscriptions/checkout
GET /subscriptions/current
```

## Services backend

- API REST pour le produit.
- Base de donnees utilisateurs et progression.
- Queue IA pour generation de feedback et quiz.
- Service de paiement Stripe.
- Service notifications.
