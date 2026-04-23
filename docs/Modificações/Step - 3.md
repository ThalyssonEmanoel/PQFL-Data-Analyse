# Step - 3: Feature Implementation Flow (Routes to Repositories)

In this phase, I apply the architecture to real feature slices.

## 1) Build by vertical slice

For each feature, I will create:

- Route file in `src/routes`
- Controller file in `src/controllers`
- Service file in `src/services`
- Repository file in `src/repositories`
- Schema file in `src/schemas`
- Swagger docs in `src/docs/routes-doc` and `src/docs/schemas-doc`

## 2) Keep each layer focused

- Routes: define endpoint + middlewares + controller handler.
- Controllers: extract request data and call service.
- Services: business rules and orchestration.
- Repositories: Mongoose model queries only.

## 3) Initial producer endpoints

I will implement first:

- `GET /api/v1/producers`
- `GET /api/v1/producers/:id`

Later I can add write operations (`POST`, `PATCH`, `DELETE`) with the same layer pattern.

## 4) Response envelope strategy

I can keep responses simple or use a standard envelope.

If I choose envelope, I will keep it consistent:

```json
{
  "data": {},
  "meta": {}
}
```

## 5) Avoid anti-patterns

I will avoid:

- Mongoose model calls directly inside controllers.
- Business logic inside route files.
- Different error formats per endpoint.

## Definition of done for this step

- At least one full feature follows all layers.
- Routes are thin.
- Business and data access concerns are clearly separated.
