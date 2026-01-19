import type { Subject, Revision } from '../schema';

export function applyRevisions(sourceSubject: Subject, revisions: Revision[]) {
  if (revisions.length === 0) return { ok: true, subject: sourceSubject };

  let ok = true;
  const subject = sourceSubject;
  for (const revision of revisions) {
    if (revision.detail.operation === 'set.add' || revision.detail.operation === 'set.delete') {
      const path = getSubjectPathValue<string[]>(subject, revision.detail.path);
      if (!path.found) {
        ok = false;
        break;
      }
      const prev = path.get();
      if (prev === undefined || prev === null) {
        if (revision.detail.operation === 'set.add') {
          path.set([...revision.detail.value]);
        }
      } else if (Array.isArray(prev)) {
        if (revision.detail.operation === 'set.add') {
          path.set([...new Set([...prev, ...revision.detail.value])]);
        } else if (revision.detail.operation === 'set.delete') {
          path.set(prev.filter((item) => !(revision.detail.value as string[]).includes(item)));
        }
      }
    } else if (revision.detail.operation === 'field.set') {
      const path = getSubjectPathValue<unknown>(subject, revision.detail.path);
      if (!path.found) {
        ok = false;
        break;
      }
      path.set(revision.detail.value);
    }
  }

  return { ok, subject };
}

function getSubjectPathValue<T>(subject: Subject, path: string) {
  const pieces = path.split('.');
  if (pieces.length > 0) {
    if (pieces[0] === 'data') {
      // TODO
    }
    if (pieces[0] === 'search') {
      const ALLOW = ['include', 'exclude', 'keywords', 'after', 'before'];
      if (ALLOW.includes(pieces[1]) && pieces.length === 2) {
        return {
          found: true,
          // @ts-ignore
          get: () => subject.search[pieces[1]] as T,
          set: (value: T) => {
            // @ts-ignore
            subject.search[pieces[1]] = value;
          }
        };
      }
    }
  }
  return { found: false, get: (): T | undefined => undefined, set: (_: T) => {} };
}
