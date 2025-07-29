declare module 'redux-mock-store' {
  import { Store, AnyAction } from 'redux';
  function configureStore<S = any, A extends AnyAction = AnyAction>(middlewares?: any[]): (state?: S) => Store<S, A>;
  export default configureStore;
}
