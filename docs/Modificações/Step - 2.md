# Step - 2: Zod Schemas and Validation Middleware

In this phase, I define validation as a first-class part of the backend.

## 1) Organize schemas by feature in `src/schemas`

I will create files like:

- `health.schema.js`
- `producer.schema.js`
- `common.schema.js`

## 2) Validate params, query, and body consistently

I will implement a reusable validation middleware that accepts:

- `params` schema
- `query` schema
- `body` schema

The middleware should parse and replace `req.params`, `req.query`, and `req.body` with sanitized values.

## 3) Normalize validation error responses

For invalid requests, I will return a consistent payload, for example:

```json
{
  "error": "ValidationError",
  "message": "Invalid request data",
  "details": [
    {
      "path": "params.id",
      "message": "Expected number"
    }
  ]
}
```

## 4) Add helper utilities

In `src/utils`, I will keep:

- Error formatting helpers for Zod issues.
- Success response helpers if useful.

## 5) Global error middleware strategy

I will centralize errors in one middleware:

- Handle known app errors.
- Handle Zod errors.
- Hide sensitive internals in production.
- Include request id in error response/log context.

## Definition of done for this step

- Every route validates input using Zod middleware.
- Validation errors are standardized.
- Controllers can focus on app logic, not parsing/validation boilerplate.
