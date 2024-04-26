import { createSlice } from '@reduxjs/toolkit'

export const modelSlice = createSlice ({
    name: 'modelSlice',
    initialState: {
        id: "",
        name: "",
        readOnly: ".ini", // initialize to an invalid username to avoid anomalies
    },
    // Redux Toolkit allows us to write "mutating" logic in reducers. It
    // doesn't actually mutate the state because it uses the Immer library,
    // which detects changes to a "draft state" and produces a brand new
    // immutable state based off those changes
    reducers: {
        changeModelNameDispatch: (state, action) => {
            state.name = action.payload;
        },
        modelAppLoadDispatch: (state, action) => {
            state.id = action.payload["id"];
            state.name = action.payload["name"];
            state.readOnly = action.payload["readOnly"];
        },
        changeModelReadOnlyDispatch: (state, action) => {
            state.readOnly = action.payload;
        }
    },
})

export const { changeModelNameDispatch,
               modelAppLoadDispatch,
               changeModelReadOnlyDispatch } = modelSlice.actions

export default modelSlice.reducer
