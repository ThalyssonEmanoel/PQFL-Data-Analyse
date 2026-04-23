# Step - 4: MongoDB/Mongoose Modeling, Data Migration, and Seed

In this phase, I wire database access with Mongoose and define a safe flow to move current JSON data into MongoDB.

## 1) Connect MongoDB with Mongoose

From `back-end/`, I confirm Mongoose is installed and configure connection bootstrap in `src/config/database.js`.

I will use env vars like:

- `MONGODB_URI`
- `MONGODB_DB_NAME` (optional)

## 2) Define initial Mongoose models

I will create models in `src/models`, starting with:

- `producer.model.js`

I will keep field names aligned with API contracts when possible, and normalize data types at write time.

## 3) Add indexes from day one

Since I will query by producer and period, I will define indexes in model definitions.

Example strategy:

- Unique compound index on producer identity + reference period.
- Additional indexes for list/filter operations.

This is essential for performance and data consistency.

## 4) Move current JSON data into MongoDB

I will use `src/seed/index.js` to load existing cached JSON records into MongoDB.

Important rules:

- Seed must be idempotent (no duplicate documents on rerun).
- I will use `upsert` for stable repeatability.
- I will keep a clear mapping layer from raw payload to Mongo document shape.

## 5) Migration strategy for schema evolution

MongoDB does not force relational-style migrations, but I still want controlled change history.

If I enable `migrate-mongo`, I will use:

```powershell
npx migrate-mongo init
npx migrate-mongo create add-producer-fields
npx migrate-mongo up
```

I will keep migration scripts in `back-end/migrations/` and run them in CI/CD before rollout.

## 6) Repository access with Mongoose

I will keep all direct model operations in repositories only.

Pattern example:

- `producer.repository.js` exports `findAll`, `findById`, `upsertMany`, etc.

## 7) Discipline for data evolution

I will follow these rules:

- Never rewrite already-applied migration scripts.
- Keep migration names meaningful and small.
- Version breaking document changes explicitly.
- Keep index changes reviewed with query usage in mind.

## Definition of done for this step

- MongoDB connection works.
- Initial Mongoose models exist.
- Indexes are defined.
- JSON-to-Mongo seed works safely.
- Repositories read/write data via Mongoose.
