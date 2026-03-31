/**
 * Backfill script: assigns sessionId (and related session fields) to all
 * existing log documents that were created before the session-tracking feature.
 *
 * HOW TO RUN
 * ----------
 * 1. Start the dev server: npm run dev
 * 2. Open the app in Chrome (http://localhost:3000) and log in
 * 3. Open DevTools Console (F12)
 * 4. Paste this entire script and press Enter
 *
 * WHAT IT DOES
 * ------------
 * - Scans users/{uid}/exercises, /activities, /strengthExercises for docs with no sessionId
 * - Groups them by local date (same timezone logic as the app)
 * - Creates one session doc per day in users/{uid}/sessions (status: 'completed')
 * - Batch-updates every log with sessionId, sessionDateKey, sessionWeekKey,
 *   sessionNumberInDay, sessionNumberInWeek
 * - Skips dates that already have a session doc (idempotent re-runs)
 * - Prints a summary when done
 *
 * SAFETY
 * ------
 * - Read-only until you confirm via the prompt below (set DRY_RUN = false to write)
 * - Uses Firestore batches of 499 ops to stay within the 500-op limit
 * - All historical sessions are marked status='completed'
 */

const DRY_RUN = false; // Set to true to preview without writing

async function backfillSessionIds() {
  console.log('🔄 Session ID backfill starting...' + (DRY_RUN ? ' [DRY RUN]' : ''));

  // ── 1. Get Firebase instances ─────────────────────────────────────────────
  // The app exposes db, auth, and all needed Firestore functions on window in dev mode.
  const db   = window.__firebaseDb;
  const auth = window.__firebaseAuth;
  if (!db || !auth) {
    throw new Error(
      'Firebase not found on window. Make sure the dev server is running (npm run dev) ' +
      'and you have loaded the app at least once so the app code initialises Firebase.'
    );
  }

  // Use Firestore functions from the SAME SDK bundle as db (CDN imports cause SDK mismatch)
  const collection  = window.__firestoreCollection;
  const doc         = window.__firestoreDoc;
  const getDocs     = window.__firestoreGetDocs;
  const writeBatch  = window.__firestoreWriteBatch;
  const Timestamp   = window.__firestoreTimestamp;

  const userId = auth.currentUser?.uid;
  if (!userId) {
    throw new Error('Not authenticated. Log in to the app first, then re-run the script.');
  }
  console.log(`👤 Running for user: ${userId}`);

  // ── 2. Helpers ────────────────────────────────────────────────────────────

  /** Convert a Firestore Timestamp, Date, or ISO string to a local YYYY-MM-DD key */
  const toDateKey = (ts) => {
    let d;
    if (ts && typeof ts.toDate === 'function') {
      d = ts.toDate(); // Firestore Timestamp
    } else if (ts instanceof Date) {
      d = ts;
    } else {
      d = new Date(ts); // ISO string or epoch ms
    }
    if (isNaN(d.getTime())) return null;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dy = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dy}`;
  };

  /** ISO 8601 week key, e.g. "2026-W13" */
  const toWeekKey = (dateKey) => {
    const [y, m, d] = dateKey.split('-').map(Number);
    const tmp = new Date(Date.UTC(y, m - 1, d));
    const dayNum = tmp.getUTCDay() || 7;
    tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
    const weekNum = Math.ceil((((tmp.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${tmp.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`;
  };

  // Batch helper — flushes every 499 ops
  let batch = writeBatch(db);
  let opsInBatch = 0;
  const MAX_BATCH = 499;

  const scheduleSet = (ref, data) => {
    if (!DRY_RUN) batch.set(ref, data);
    opsInBatch++;
  };

  const scheduleUpdate = (ref, data) => {
    if (!DRY_RUN) batch.update(ref, data);
    opsInBatch++;
  };

  const flushBatch = async () => {
    if (!DRY_RUN && opsInBatch > 0) {
      await batch.commit();
      batch = writeBatch(db);
    }
    opsInBatch = 0;
  };

  // ── 3. Load all logs without sessionId from the three collections ─────────
  const LOG_COLLECTIONS = ['exercises', 'activities', 'strengthExercises'];
  const logsWithoutSession = []; // { collName, ref, dateKey }

  for (const collName of LOG_COLLECTIONS) {
    const snap = await getDocs(collection(db, 'users', userId, collName));
    let missing = 0;
    for (const docSnap of snap.docs) {
      const data = docSnap.data();
      if (!data.sessionId) {
        const dateKey = toDateKey(data.timestamp || data.date || data.createdAt);
        if (!dateKey) {
          console.warn(`⚠️  Skipping ${collName}/${docSnap.id} — no parseable timestamp`);
          continue;
        }
        logsWithoutSession.push({ collName, ref: docSnap.ref, dateKey });
        missing++;
      }
    }
    console.log(`  ${collName}: ${snap.size} total, ${missing} without sessionId`);
  }

  if (logsWithoutSession.length === 0) {
    console.log('✅ All logs already have session IDs. Nothing to do.');
    return;
  }
  console.log(`\n📋 ${logsWithoutSession.length} logs need backfilling across ${Object.keys(
    logsWithoutSession.reduce((acc, l) => { acc[l.dateKey] = 1; return acc; }, {})
  ).length} unique dates`);

  // ── 4. Load existing sessions to avoid duplicates & seed week counters ────
  const existingSessionSnap = await getDocs(collection(db, 'users', userId, 'sessions'));
  const existingByDate = {}; // dateKey -> { sessionId, sessionNumberInDay, sessionNumberInWeek }
  const weekTotals = {};     // weekKey -> count of already-existing sessions

  for (const docSnap of existingSessionSnap.docs) {
    const data = docSnap.data();
    const dk = data.sessionDateKey;
    const wk = data.sessionWeekKey;
    if (dk && !existingByDate[dk]) {
      // Keep the session with the lowest sessionNumberInDay (session 1 of that day)
      const existing = existingByDate[dk];
      if (!existing || (data.sessionNumberInDay || 99) < existing.sessionNumberInDay) {
        existingByDate[dk] = {
          sessionId: docSnap.id,
          sessionNumberInDay: data.sessionNumberInDay || 1,
          sessionNumberInWeek: data.sessionNumberInWeek || 1,
          sessionDateKey: dk,
          sessionWeekKey: wk,
        };
      }
    }
    if (wk) weekTotals[wk] = (weekTotals[wk] || 0) + 1;
  }
  console.log(`  Found ${existingSessionSnap.size} existing session docs`);

  // ── 5. Group logs by date and process chronologically ────────────────────
  const byDate = {};
  for (const log of logsWithoutSession) {
    if (!byDate[log.dateKey]) byDate[log.dateKey] = [];
    byDate[log.dateKey].push(log);
  }

  const sortedDates = Object.keys(byDate).sort(); // chronological order matters for week counters
  let createdSessions = 0;
  let updatedLogs = 0;

  for (const dateKey of sortedDates) {
    const weekKey = toWeekKey(dateKey);
    let session;

    if (existingByDate[dateKey]) {
      // Reuse the existing session for this date (backfill logs into it)
      session = existingByDate[dateKey];
      console.log(`  ${dateKey}: reusing existing session ${session.sessionId.slice(0, 8)}… (session ${session.sessionNumberInDay})`);
    } else {
      // Create a new session for this date
      weekTotals[weekKey] = (weekTotals[weekKey] || 0) + 1;
      const sessionNumberInDay = 1; // Legacy logs all become session 1 of their day
      const sessionNumberInWeek = weekTotals[weekKey];

      const sessionRef = doc(collection(db, 'users', userId, 'sessions'));
      const sessionId = sessionRef.id;
      const now = Timestamp.now();
      const [y, m, d] = dateKey.split('-').map(Number);
      const sessionDate = new Date(y, m - 1, d, 12, 0, 0); // noon local time

      const sessionDoc = {
        userId,
        sessionId,
        sessionDateKey: dateKey,
        sessionWeekKey: weekKey,
        sessionNumberInDay,
        sessionNumberInWeek,
        status: 'completed',
        startedAt: Timestamp.fromDate(sessionDate),
        createdAt: now,
        updatedAt: now,
      };

      scheduleSet(sessionRef, sessionDoc);
      createdSessions++;

      session = { sessionId, sessionDateKey: dateKey, sessionWeekKey: weekKey, sessionNumberInDay, sessionNumberInWeek };
      existingByDate[dateKey] = session; // cache in case other dates reference same session

      if (opsInBatch >= MAX_BATCH) await flushBatch();

      console.log(`  ${dateKey}: created session ${sessionId.slice(0, 8)}… (week ${weekKey}, #${sessionNumberInDay} that day, #${sessionNumberInWeek} that week)`);
    }

    // Update every log for this date
    for (const log of byDate[dateKey]) {
      scheduleUpdate(log.ref, {
        sessionId: session.sessionId,
        sessionDateKey: session.sessionDateKey,
        sessionWeekKey: session.sessionWeekKey,
        sessionNumberInDay: session.sessionNumberInDay,
        sessionNumberInWeek: session.sessionNumberInWeek,
      });
      updatedLogs++;
      if (opsInBatch >= MAX_BATCH) await flushBatch();
    }
  }

  await flushBatch();

  // ── 6. Summary ────────────────────────────────────────────────────────────
  console.log('\n' + (DRY_RUN ? '🔍 DRY RUN complete (nothing was written)' : '✅ Backfill complete!'));
  console.log(`   Sessions created : ${createdSessions}`);
  console.log(`   Log docs updated : ${updatedLogs}`);
  if (DRY_RUN) {
    console.log('\n👉 Set DRY_RUN = false at the top of the script and re-run to apply changes.');
  }
}

backfillSessionIds().catch((err) => {
  console.error('❌ Backfill failed:', err);
});
