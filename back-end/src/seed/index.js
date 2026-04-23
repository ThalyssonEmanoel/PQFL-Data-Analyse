import "dotenv/config";
import { connectToDatabase, disconnectFromDatabase } from "../config/database.js";
import { producerRepository } from "../repositories/producer.repository.js";
import { logger } from "../utils/logger.js";
import { toProducerDocuments } from "./mappers.js";

// NOTE: This array intentionally starts empty. It should be populated with raw
// producer payloads (same shape the legacy frontend pipeline produces) either
// inline for fixtures, or by reading a local JSON dump. See PENDING.md ("JSON
// data migration") for the long-term plan.
const rawProducers = [];

async function run() {
  await connectToDatabase();

  const documents = toProducerDocuments(rawProducers);

  if (documents.length === 0) {
    logger.warn("no seed producers defined yet — nothing to upsert");
  } else {
    const result = await producerRepository.bulkUpsert(documents);
    logger.info(
      { requested: documents.length, ...result },
      "producer seed upsert complete",
    );
  }

  await disconnectFromDatabase();
}

run().catch(async (err) => {
  logger.error({ err }, "seed failed");
  try {
    await disconnectFromDatabase();
  } catch {
    /* swallow: we are already exiting */
  }
  process.exit(1);
});
