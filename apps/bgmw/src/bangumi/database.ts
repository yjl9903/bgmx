import type { Context } from '../env';

import { updateSubject, fetchSubjectRevisions } from '../subject';
import { bangumis, type Bangumi as DatabaseBangumi } from '../schema/subject';

import { client } from './client';

export type FetchAndUpdateBangumiSubjectResult =
  | {
      ok: true;
      data: DatabaseBangumi;
    }
  | {
      ok: false;
      error: any;
    };

export async function fetchAndUpdateBangumiSubject(
  ctx: Context,
  bgmId: number
): Promise<FetchAndUpdateBangumiSubjectResult> {
  try {
    // 1. Fetch subject
    console.log('[bgmw]', 'fetching bangumi subject', bgmId);

    const subject = await client.subject(bgmId);
    const [persons, characters, subjects] = await Promise.all([
      client.subjectPersons(bgmId),
      client.subjectCharacters(bgmId),
      client.subjectRelated(bgmId)
    ]);

    console.log('[bgmw]', 'fetched bangumi subject', bgmId);

    // 2. Update database
    const updated = await updateDatabaseBangumi(ctx, bgmId, {
      data: subject,
      persons,
      characters,
      subjects
    });

    if (updated.ok && updated.data) {
      console.log('[bgmw]', 'updated database bangumi', bgmId, updated);

      // 3. Update subject
      const revisions = await fetchSubjectRevisions(ctx, bgmId);
      await updateSubject(ctx, updated.data, revisions);

      return {
        ok: true,
        data: updated.data
      };
    } else {
      return {
        ok: false,
        error: updated.error
      };
    }
  } catch (error) {
    console.error('[bgmw]', 'failed to fetch bangumi subject', error);

    return {
      ok: false,
      error
    };
  }
}

export async function updateDatabaseBangumi(
  ctx: Context,
  bgmId: number,
  payload: Pick<DatabaseBangumi, 'data' | 'persons' | 'characters' | 'subjects'>
) {
  try {
    const database = ctx.get('database');

    const now = new Date();

    const row: DatabaseBangumi = {
      id: bgmId,
      data: payload.data,
      persons: payload.persons,
      characters: payload.characters,
      subjects: payload.subjects,
      updatedAt: now
    };

    const resp = await database
      .insert(bangumis)
      .values(row)
      .onConflictDoUpdate({
        target: bangumis.id,
        set: {
          data: payload.data,
          persons: payload.persons,
          characters: payload.characters,
          subjects: payload.subjects,
          updatedAt: now
        }
      })
      .returning({ id: bangumis.id });

    return {
      ok: resp.length > 0 && resp[0]?.id === bgmId ? true : false,
      data: row
    };
  } catch (error) {
    console.error('[bgmw]', 'failed to update bangumi', error);

    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown database error'
    };
  }
}
