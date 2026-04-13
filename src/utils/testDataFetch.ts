import { getAuth } from 'firebase/auth';
import { getAllLogs } from '../services/firebase/unifiedLogs';

export const testDataFetch = async () => {
  const auth = getAuth();
  const currentUser = auth.currentUser;
  
  if (!currentUser) {
    console.error('❌ No authenticated user for test');
    return;
  }
  
  console.log('🧪 Testing data fetch');
  console.log('🔐 Current user:', {
    uid: currentUser.uid,
    email: currentUser.email
  });
  
  try {
    // Test fetching data for today
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);
    
    console.log('📅 Testing date range:', {
      startOfDay: startOfDay.toISOString(),
      endOfDay: endOfDay.toISOString()
    });
    
    const logs = await getAllLogs(currentUser.uid, startOfDay, endOfDay);
    console.log('📊 Retrieved logs:', {
      count: logs.length,
      logs: logs.map(log => ({
        id: log.id,
        name: 'activityName' in log ? log.activityName : log.exerciseName,
        type: 'activityType' in log ? log.activityType : log.exerciseType,
        timestamp: log.timestamp,
        sets: log.sets?.length || 0
      }))
    });
    
    return logs;
  } catch (error) {
    console.error('❌ Test fetch failed:', error);
    throw error;
  }
};
