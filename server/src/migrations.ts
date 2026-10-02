import { Single } from './models/single.js';
import logger from './utils/logger.js';

/**
 * Brings singles saved before the move to `sectors` / `birthDate` up to date:
 * `sector` becomes a one-item `sectors` list and `birthYear` becomes 1 January
 * of that year. Idempotent, so it runs on every start.
 */
export const migrateLegacySingles = async () => {
  const sectors = await Single.collection.updateMany(
    { sector: { $exists: true } },
    [
      {
        $set: {
          sectors: {
            $cond: [{ $gt: [{ $size: { $ifNull: ['$sectors', []] } }, 0] }, '$sectors', ['$sector']],
          },
        },
      },
      { $unset: 'sector' },
    ]
  );
  const births = await Single.collection.updateMany(
    { birthYear: { $exists: true } },
    [
      {
        $set: {
          birthDate: {
            $ifNull: ['$birthDate', { $dateFromParts: { year: '$birthYear', month: 1, day: 1 } }],
          },
        },
      },
      { $unset: 'birthYear' },
    ]
  );
  const changed = sectors.modifiedCount + births.modifiedCount;
  if (changed) {
    logger.info(`Migrated legacy singles: ${sectors.modifiedCount} sectors, ${births.modifiedCount} birth dates`);
  }
};
