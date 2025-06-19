import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';

// Custom serializer check for Firebase Timestamp objects
const serializableCheck = {
  ignoredActions: ['auth/setUser'],
  ignoredActionPaths: ['payload.createdAt', 'payload.updatedAt'],
  ignoredPaths: ['auth.user.createdAt', 'auth.user.updatedAt']
};

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
  middleware: (getDefaultMiddleware) => 
    getDefaultMiddleware({
      serializableCheck
    })
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
