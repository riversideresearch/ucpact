import { createSlice } from '@reduxjs/toolkit'

export const subfuncSlice = createSlice ({
    name: 'subfuncSlice',
    initialState: {
        subfunctionalities: [],
    },
    // Redux Toolkit allows us to write "mutating" logic in reducers. It
    // doesn't actually mutate the state because it uses the Immer library,
    // which detects changes to a "draft state" and produces a brand new
    // immutable state based off those changes
    reducers: {
        addSubfuncDispatch: (state, action) => {
            state.subfunctionalities = [...state.subfunctionalities, action.payload];
        },
        changeSubfuncDispatch: (state, action) => {
            let theSFIndex = state.subfunctionalities.findIndex(element => element.id === action.payload.id);
            state.subfunctionalities[theSFIndex] = action.payload;
        },
        removeSubfuncDispatch: (state, action) => {
            let theSFIndex = state.subfunctionalities.findIndex(element => element.id === action.payload);
            state.subfunctionalities.splice(theSFIndex, 1);
        },
        updateSubfuncPositionDispatch: (state, action) => {
            let theSFIndex = state.subfunctionalities.findIndex(element => element.id === action.payload[0]);
            state.subfunctionalities[theSFIndex].left = action.payload[1];
            state.subfunctionalities[theSFIndex].top = action.payload[2];
        },
        subfunctionalitiesAppLoadDispatch: (state, action) => {
            state.subfunctionalities = action.payload.subfunctionalities;
        }
    },
})

export const { addSubfuncDispatch,
              changeSubfuncDispatch,
              removeSubfuncDispatch,
              updateSubfuncPositionDispatch,
              subfunctionalitiesAppLoadDispatch } = subfuncSlice.actions

export default subfuncSlice.reducer
