export const createPendingReducer = (initialState) => ({
  reducer: (state, next) => ({ ...state, ...next }),
  initialState,
})
