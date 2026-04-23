export const up = async (db) => {
  const producers = db.collection("producers");
  const syncs = db.collection("producer_syncs");

  const createIndexIfMissing = async (collection, keys, options) => {
    try {
      await collection.createIndex(keys, options);
    } catch (err) {
      const alreadyExistsWithOtherName =
        typeof err?.message === "string" &&
        err.message.includes("already exists with a different name");
      if (!alreadyExistsWithOtherName) throw err;
    }
  };

  // Producer sync provenance indexes
  await createIndexIfMissing(producers, { lastSyncAt: -1 }, { name: "lastSyncAt" });
  await createIndexIfMissing(
    producers,
    { dedupKey: 1 },
    {
      name: "uniq_dedupKey",
      unique: true,
      partialFilterExpression: { dedupKey: { $type: "string" } },
    },
  );

  // Sync collection indexes
  await createIndexIfMissing(
    syncs,
    { kind: 1, lockKey: 1 },
    {
      name: "uniq_lock_per_key",
      unique: true,
      partialFilterExpression: { kind: "lock", lockKey: { $type: "string" } },
    },
  );
  await createIndexIfMissing(
    syncs,
    { expiresAt: 1 },
    {
      name: "ttl_lock_expiresAt",
      expireAfterSeconds: 0,
      partialFilterExpression: { kind: "lock" },
    },
  );
  await createIndexIfMissing(
    syncs,
    { syncId: 1 },
    {
      name: "uniq_run_syncId",
      unique: true,
      partialFilterExpression: { kind: "run" },
    },
  );
  await createIndexIfMissing(syncs, { kind: 1, startedAt: -1 }, { name: "kind_startedAt" });
};

export const down = async (db) => {
  const producers = db.collection("producers");
  const syncs = db.collection("producer_syncs");

  const dropIfExists = async (collection, name) => {
    try {
      await collection.dropIndex(name);
    } catch (err) {
      if (err?.codeName !== "IndexNotFound") throw err;
    }
  };

  await dropIfExists(producers, "lastSyncAt");
  await dropIfExists(producers, "uniq_dedupKey");
  await dropIfExists(syncs, "uniq_lock_per_key");
  await dropIfExists(syncs, "ttl_lock_expiresAt");
  await dropIfExists(syncs, "uniq_run_syncId");
  await dropIfExists(syncs, "kind_startedAt");
};
