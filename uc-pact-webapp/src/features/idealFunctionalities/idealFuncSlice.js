import { createSlice } from '@reduxjs/toolkit'

export const idealFuncSlice = createSlice ({
    name: 'idealFuncSlice',
    initialState: {
        id: "",
        name: "",
        basicAdversarialInterface: "",
        compositeDirectInterface: "",
        stateMachine: "",
        color: "",
        left: "",
        top: ""
    },
    // Redux Toolkit allows us to write "mutating" logic in reducers. It
    // doesn't actually mutate the state because it uses the Immer library,
    // which detects changes to a "draft state" and produces a brand new
    // immutable state based off those changes
    reducers: {
        changeIFDispatch: (state, action) => {
            state.name = action.payload.name;
            state.basicAdversarialInterface = action.payload.basicAdversarialInterface;
            state.compositeDirectInterface = action.payload.compositeDirectInterface;
        },
        removeInterFromIFDispatch: (state, action) => {
            if (state.basicAdversarialInterface === action.payload) {
                state.basicAdversarialInterface = "";
            } else if (state.compositeDirectInterface === action.payload) {
                state.compositeDirectInterface = "";
            }
        },
        assignIFStateMachineDispatch: (state, action) => {
            state.stateMachine = action.payload;
        },
        idealFuncAppLoadDispatch: (state, action) => {
            state.id = action.payload.id;
            state.name = action.payload.name;
            state.basicAdversarialInterface = action.payload.basicAdversarialInterface;
            state.compositeDirectInterface = action.payload.compositeDirectInterface;
            state.stateMachine = action.payload.stateMachine;
            state.color = action.payload.color;
            state.left = action.payload.left;
            state.top = action.payload.top;
        }
    },
})

export const { changeIFDispatch,
               removeInterFromIFDispatch,
               assignIFStateMachineDispatch,
               idealFuncAppLoadDispatch } = idealFuncSlice.actions

export default idealFuncSlice.reducer
