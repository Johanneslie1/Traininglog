// Timezone debugging utility to identify date mismatch issues

export const debugTimezoneIssue = () => {
  console.log('🌍 TIMEZONE DEBUGGING');
  console.log('='.repeat(50));
  
  const now = new Date();
  console.log('📅 Current date/time:', now);
  console.log('🌐 Timezone offset (minutes from UTC):', now.getTimezoneOffset());
  console.log('🌐 Local timezone string:', Intl.DateTimeFormat().resolvedOptions().timeZone);
  
  // Test date - August 28th, 2025
  const testDate = new Date('2025-08-28');
  console.log('\n📝 Test date (2025-08-28):');
  console.log('  Original Date object:', testDate);
  console.log('  ISO string:', testDate.toISOString());
  console.log('  Local string:', testDate.toLocaleString());
  
  // Simulate our current save normalization (12:00 PM)
  const normalizeSelectedDate = (date: Date): Date => {
    const normalized = new Date(date);
    normalized.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues
    return normalized;
  };
  
  const normalizedSaveDate = normalizeSelectedDate(testDate);
  console.log('\n💾 SAVE NORMALIZATION (12:00 PM):');
  console.log('  Normalized date:', normalizedSaveDate);
  console.log('  ISO string:', normalizedSaveDate.toISOString());
  console.log('  Local string:', normalizedSaveDate.toLocaleString());
  
  // Simulate our current query range (00:00 to 23:59)
  const startOfDay = new Date(testDate);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(testDate);
  endOfDay.setHours(23, 59, 59, 999);
  
  console.log('\n🔍 QUERY RANGE (full day):');
  console.log('  Start of day:', startOfDay);
  console.log('  Start ISO:', startOfDay.toISOString());
  console.log('  End of day:', endOfDay);
  console.log('  End ISO:', endOfDay.toISOString());
  
  // Check if the normalized save date falls within the query range
  const isInRange = normalizedSaveDate >= startOfDay && normalizedSaveDate <= endOfDay;
  console.log('\n✅ COMPATIBILITY CHECK:');
  console.log('  Is normalized save date in query range?', isInRange);
  
  if (!isInRange) {
    console.log('❌ TIMEZONE MISMATCH DETECTED!');
    console.log('   Saved exercises may appear on wrong dates');
  }
  
  // Show what the UTC differences look like
  console.log('\n🌐 UTC CONVERSION ANALYSIS:');
  console.log('  Save date in UTC:', normalizedSaveDate.toISOString());
  console.log('  Query start in UTC:', startOfDay.toISOString());
  console.log('  Query end in UTC:', endOfDay.toISOString());
  
  // Test with a few different dates
  console.log('\n📊 MULTIPLE DATE TEST:');
  const testDates = [
    new Date('2025-08-27'),
    new Date('2025-08-28'), 
    new Date('2025-08-29')
  ];
  
  testDates.forEach(date => {
    const normalized = normalizeSelectedDate(date);
    const startRange = new Date(date);
    startRange.setHours(0, 0, 0, 0);
    const endRange = new Date(date);
    endRange.setHours(23, 59, 59, 999);
    
    const inRange = normalized >= startRange && normalized <= endRange;
    console.log(`  ${date.toDateString()}: Save=${normalized.toISOString()}, InRange=${inRange}`);
  });
};

// Fix proposal: Use UTC normalization for both save and query
export const debugUTCFix = () => {
  console.log('\n🔧 UTC FIX PROPOSAL');
  console.log('='.repeat(50));
  
  const testDate = new Date('2025-08-28');
  
  // Proposed UTC normalization for saves
  const normalizeToUTCNoon = (date: Date): Date => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    // Create date at UTC noon
    return new Date(Date.UTC(year, month, day, 12, 0, 0, 0));
  };
  
  // Proposed UTC range for queries
  const getUTCDayRange = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    
    const startOfDay = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(year, month, day, 23, 59, 59, 999));
    
    return { startOfDay, endOfDay };
  };
  
  const fixedSaveDate = normalizeToUTCNoon(testDate);
  const { startOfDay: fixedStart, endOfDay: fixedEnd } = getUTCDayRange(testDate);
  
  console.log('💾 FIXED SAVE (UTC noon):');
  console.log('  Fixed save date:', fixedSaveDate.toISOString());
  
  console.log('\n🔍 FIXED QUERY (UTC range):');
  console.log('  Fixed start:', fixedStart.toISOString());
  console.log('  Fixed end:', fixedEnd.toISOString());
  
  const isInFixedRange = fixedSaveDate >= fixedStart && fixedSaveDate <= fixedEnd;
  console.log('\n✅ FIXED COMPATIBILITY:');
  console.log('  Is fixed save date in fixed query range?', isInFixedRange);
  
  if (isInFixedRange) {
    console.log('✅ UTC FIX WORKS! Dates should match correctly.');
  } else {
    console.log('❌ UTC fix still has issues.');
  }
};

// Make functions available globally for console testing
declare global {
  interface Window {
    debugTimezoneIssue: typeof debugTimezoneIssue;
    debugUTCFix: typeof debugUTCFix;
  }
}

window.debugTimezoneIssue = debugTimezoneIssue;
window.debugUTCFix = debugUTCFix;

console.log('🌍 Timezone debugging tools loaded. Run:');
console.log('  debugTimezoneIssue() - to analyze the current issue');
console.log('  debugUTCFix() - to test the proposed UTC fix');
