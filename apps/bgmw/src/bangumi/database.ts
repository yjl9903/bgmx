import type { RelatedSubject } from 'bgmc';

import type { Context } from '../env';

import { updateSubject, fetchSubjectRevisions } from '../subject';
import type { Bangumi as DatabaseBangumi } from '../schema/types';
import { bangumis } from '../schema/subject';

import { client } from './client';

const BANGUMI_ANIME_TYPE = 2;

export type FetchAndUpdateBangumiSubjectResult =
  | {
      ok: true;
      data: DatabaseBangumi;
    }
  | {
      ok: false;
      error: any;
    };

async function fetchAndUpdateSingleBangumiSubject(
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

export async function fetchAndUpdateRelatedBangumiSubjects(
  ctx: Context,
  relations: RelatedSubject[]
): Promise<{ ok: true; data: DatabaseBangumi[] } | { ok: false; error: unknown }> {
  const subjectIds = [
    ...new Set(
      relations
        .filter((relation) => relation.type === BANGUMI_ANIME_TYPE)
        .map((relation) => relation.id)
    )
  ];

  const results = await Promise.all(
    subjectIds.map((subjectId) => fetchAndUpdateSingleBangumiSubject(ctx, subjectId))
  );
  const data: DatabaseBangumi[] = [];

  for (const result of results) {
    if (!result.ok) return result;
    data.push(result.data);
  }

  return {
    ok: true,
    data
  };
}

export async function fetchAndUpdateBangumiSubject(
  ctx: Context,
  bgmId: number
): Promise<FetchAndUpdateBangumiSubjectResult> {
  const result = await fetchAndUpdateSingleBangumiSubject(ctx, bgmId);
  if (!result.ok) return result;

  const related = await fetchAndUpdateRelatedBangumiSubjects(
    ctx,
    result.data.subjects.filter((relation) => relation.id !== bgmId)
  );
  if (!related.ok) return related;

  return result;
}

export async function updateDatabaseBangumi(
  ctx: Context,
  bgmId: number,
  payload: Pick<DatabaseBangumi, 'data' | 'persons' | 'characters' | 'subjects'>
) {
  try {
    if (payload.data.type !== BANGUMI_ANIME_TYPE) {
      return {
        ok: false,
        error: 'Bangumi subject is not anime'
      };
    }

    const database = ctx.get('database');

    const now = new Date();

    const row: DatabaseBangumi = {
      id: bgmId,
      data: payload.data,
      persons: payload.persons,
      characters: payload.characters,
      subjects: payload.subjects,
      updated_at: now
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
          updated_at: now
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
