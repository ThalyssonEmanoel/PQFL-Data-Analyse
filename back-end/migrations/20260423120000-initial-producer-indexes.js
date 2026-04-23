export const up = async (db) => {
  const collection = db.collection("producers");
  const createIndexIfMissing = async (keys, options) => {
    try {
      await collection.createIndex(keys, options);
    } catch (err) {
      const alreadyExistsWithOtherName =
        typeof err?.message === "string" &&
        err.message.includes("already exists with a different name");

      if (!alreadyExistsWithOtherName) {
        throw err;
      }
    }
  };

  await createIndexIfMissing(
    { producerId: 1 },
    { name: "uniq_producerId", unique: true },
  );
  await createIndexIfMissing(
    { group: 1, totalScore: -1 },
    { name: "group_totalScore" },
  );
  await createIndexIfMissing({ totalScore: -1 }, { name: "totalScore" });
  await createIndexIfMissing({ updatedAt: -1 }, { name: "updatedAt" });
  await createIndexIfMissing(
    { producerName: "text" },
    { name: "producerName_text" },
  );
};

export const down = async (db) => {
  const collection = db.collection("producers");
  const dropIfExists = async (name) => {
    try {
      await collection.dropIndex(name);
    } catch (err) {
      if (err?.codeName !== "IndexNotFound") throw err;
    }
  };

  await dropIfExists("uniq_producerId");
  await dropIfExists("group_totalScore");
  await dropIfExists("totalScore");
  await dropIfExists("updatedAt");
  await dropIfExists("producerName_text");
};
