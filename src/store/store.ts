import { configureStore } from '@reduxjs/toolkit';

export const store = configureStore({
  reducer: () => ({}), // Provide a dummy reducer to avoid error
  middleware: (getDefaultMiddleware) => getDefaultMiddleware()
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
