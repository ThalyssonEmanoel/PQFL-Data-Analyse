export const up = async (db) => {
  const collection = db.collection("producers");

  await collection.createIndex(
    { producerId: 1 },
    { name: "uniq_producerId", unique: true },
  );
  await collection.createIndex(
    { group: 1, totalScore: -1 },
    { name: "group_totalScore" },
  );
  await collection.createIndex({ totalScore: -1 }, { name: "totalScore" });
  await collection.createIndex({ updatedAt: -1 }, { name: "updatedAt" });
  await collection.createIndex(
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
