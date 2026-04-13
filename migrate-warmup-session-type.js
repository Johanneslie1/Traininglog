/**
 * Migration script: Warm-up as Session Type
 *
 * Purpose:
 * - Migrates legacy warm-up flags into first-class sessionType values.
 * - Ensures logs are assigned to type-safe sessions per date:
 *   - main -> Session 1..N
 *   - warmup -> Warm-up 1..N
 * - Reassigns legacy warm-up logs to Warm-up 1 for each date.
 *
 * HOW TO RUN
 * ----------
 * 1. npm run dev
 * 2. Open app and log in
 * 3. Open browser DevTools Console
 * 4. Paste this script and run
 */

const DRY_RUN = false;

async function migrateWarmupToSessionType() {
  console.log('Starting warm-up session migration' + (DRY_RUN ? ' [DRY RUN]' : ''));

  const db = window.__firebaseDb;
  const auth = window.__firebaseAuth;
  if (!db || !auth) throw new Error('Firebase not found on window. Start app in dev mode first.');

  const collection = window.__firestoreCollection;
  const doc = window.__firestoreDoc;
  const getDocs = window.__firestoreGetDocs;
  const getDoc = window.__firestoreGetDoc;
  const writeBatch = window.__firestoreWriteBatch;
  const Timestamp = window.__firestoreTimestamp;
  const query = window.__firestoreQuery;
  const where = window.__firestoreWhere;

  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error('You must be logged in before running migration.');

  const normalizeSessionType = (value) => (value === 'warmup' ? 'warmup' : 'main');

  const toDateKey = (ts) => {
    let d;
    if (ts && typeof ts.toDate === 'function') d = ts.toDate();
    else d = new Date(ts);
    if (Number.isNaN(d.getTime())) return null;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const toWeekKey = (dateKey) => {
    const [y, m, d] = dateKey.split('-').map(Number);
    const tmp = new Date(Date.UTC(y, m - 1, d));
    const dayNum = tmp.getUTCDay() || 7;
    tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
    const weekNum = Math.ceil((((tmp.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${tmp.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`;
  };

  const hasWarmupDifficulty = (sets) => {
    if (!Array.isArray(sets)) return false;
    return sets.some((set) => set && set.difficulty === 'WARMUP');
  };

  const inferLogSessionType = (data) => {
    if (data.sessionType === 'warmup' || data.sessionType === 'main') {
      return data.sessionType;
    }
    if (data.isWarmup === true || hasWarmupDifficulty(data.sets)) {
      return 'warmup';
    }
    return 'main';
  };

  const sessionsSnap = await getDocs(collection(db, 'users', userId, 'sessions'));
  const sessionsById = new Map();
  const sessionsByDateAndType = new Map();

  for (const snap of sessionsSnap.docs) {
    const data = snap.data() || {};
    const sessionType = normalizeSessionType(data.sessionType);
    const dateKey = String(data.sessionDateKey || '');
    const key = `${dateKey}|${sessionType}`;
    const session = {
      id: snap.id,
      sessionType,
      sessionDateKey: dateKey,
      sessionWeekKey: String(data.sessionWeekKey || ''),
      sessionNumberInDay: Number(data.sessionNumberInDay || 1),
      sessionNumberInWeek: Number(data.sessionNumberInWeek || 1),
      status: data.status === 'active' ? 'active' : 'completed',
    };

    sessionsById.set(snap.id, session);

    if (!sessionsByDateAndType.has(key)) sessionsByDateAndType.set(key, []);
    sessionsByDateAndType.get(key).push(session);
  }

  for (const [key, list] of sessionsByDateAndType.entries()) {
    list.sort((a, b) => a.sessionNumberInDay - b.sessionNumberInDay);
    sessionsByDateAndType.set(key, list);
  }

  const ensureSessionForDateAndType = async (dateKey, sessionType) => {
    const key = `${dateKey}|${sessionType}`;
    const existing = sessionsByDateAndType.get(key) || [];
    if (existing.length > 0) return existing[0];

    const weekKey = toWeekKey(dateKey);
    const weekTypeQuery = query(
      collection(db, 'users', userId, 'sessions'),
      where('userId', '==', userId),
      where('sessionWeekKey', '==', weekKey),
      where('sessionType', '==', sessionType)
    );
    const weekTypeSnap = await getDocs(weekTypeQuery);

    const ref = doc(collection(db, 'users', userId, 'sessions'));
    const [y, m, d] = dateKey.split('-').map(Number);
    const atNoon = new Date(y, m - 1, d, 12, 0, 0);

    const created = {
      id: ref.id,
      sessionType,
      sessionDateKey: dateKey,
      sessionWeekKey: weekKey,
      sessionNumberInDay: 1,
      sessionNumberInWeek: weekTypeSnap.size + 1,
      status: 'completed',
    };

    if (!DRY_RUN) {
      const now = Timestamp.now();
      await window.__firestoreSetDoc(ref, {
        userId,
        sessionId: ref.id,
        sessionType,
        sessionDateKey: dateKey,
        sessionWeekKey: weekKey,
        sessionNumberInDay: created.sessionNumberInDay,
        sessionNumberInWeek: created.sessionNumberInWeek,
        status: 'completed',
        startedAt: Timestamp.fromDate(atNoon),
        createdAt: now,
        updatedAt: now,
      });
    }

    sessionsById.set(ref.id, created);
    sessionsByDateAndType.set(key, [created]);
    return created;
  };

  const LOG_COLLECTIONS = ['exercises', 'activities', 'strengthExercises'];
  const updates = [];

  for (const coll of LOG_COLLECTIONS) {
    const snap = await getDocs(collection(db, 'users', userId, coll));

    for (const logSnap of snap.docs) {
      const data = logSnap.data() || {};
      const dateKey = data.sessionDateKey || toDateKey(data.timestamp || data.createdAt || data.date);
      if (!dateKey) continue;

      const inferredType = inferLogSessionType(data);
      const nextType = normalizeSessionType(inferredType);

      const existingSession = data.sessionId ? sessionsById.get(data.sessionId) : null;
      let targetSession = existingSession;

      if (!targetSession || normalizeSessionType(targetSession.sessionType) !== nextType) {
        targetSession = await ensureSessionForDateAndType(dateKey, nextType);
      }

      const needsUpdate =
        data.sessionId !== targetSession.id ||
        data.sessionType !== nextType ||
        data.sessionDateKey !== targetSession.sessionDateKey ||
        data.sessionWeekKey !== targetSession.sessionWeekKey ||
        Number(data.sessionNumberInDay || 0) !== targetSession.sessionNumberInDay ||
        Number(data.sessionNumberInWeek || 0) !== targetSession.sessionNumberInWeek;

      if (!needsUpdate) continue;

      updates.push({
        ref: logSnap.ref,
        data: {
          sessionId: targetSession.id,
          sessionType: nextType,
          sessionDateKey: targetSession.sessionDateKey,
          sessionWeekKey: targetSession.sessionWeekKey,
          sessionNumberInDay: targetSession.sessionNumberInDay,
          sessionNumberInWeek: targetSession.sessionNumberInWeek,
          isWarmup: nextType === 'warmup' || data.isWarmup === true,
        },
      });
    }
  }

  if (updates.length === 0) {
    console.log('No log documents needed migration.');
    return;
  }

  const MAX_BATCH = 450;
  let committed = 0;

  for (let i = 0; i < updates.length; i += MAX_BATCH) {
    const chunk = updates.slice(i, i + MAX_BATCH);
    if (!DRY_RUN) {
      const batch = writeBatch(db);
      chunk.forEach((entry) => batch.update(entry.ref, entry.data));
      await batch.commit();
      committed += chunk.length;
    }
  }

  console.log(DRY_RUN ? 'Dry run complete.' : 'Migration complete.');
  console.log(`Log updates planned: ${updates.length}`);
  if (!DRY_RUN) {
    console.log(`Log updates committed: ${committed}`);
  }
}

migrateWarmupToSessionType().catch((error) => {
  console.error('Warm-up session migration failed:', error);
});
