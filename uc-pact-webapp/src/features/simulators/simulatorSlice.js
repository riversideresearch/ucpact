import { createSlice } from '@reduxjs/toolkit'

export const simulatorSlice = createSlice ({
    name: 'simulatorSlice',
    initialState: {
        id: "",
        name: "",
        basicAdversarialInterface: "",
        realFunctionality: "",
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
        changeSimDispatch: (state, action) => {
            state.name = action.payload.name;
            state.basicAdversarialInterface = action.payload.basicAdversarialInterface;
            state.realFunctionality = action.payload.realFunctionality;
        },
        removeInterFromSimDispatch: (state, action) => {
            if (state.basicAdversarialInterface === action.payload) {
                state.basicAdversarialInterface = "";
            }
        },
        assignSimStateMachineDispatch: (state, action) => {
            state.stateMachine = action.payload;
        },
        simAppLoadDispatch: (state, action) => {
            state.id = action.payload.id;
            state.name = action.payload.name;
            state.basicAdversarialInterface = action.payload.basicAdversarialInterface;
            state.realFunctionality = action.payload.realFunctionality;
            state.stateMachine = action.payload.stateMachine;
            state.color = action.payload.color;
            state.left = action.payload.left;
            state.top = action.payload.top;
        }
    },
})

export const { changeSimDispatch,
               removeInterFromSimDispatch,
               assignSimStateMachineDispatch,
               simAppLoadDispatch } = simulatorSlice.actions

export default simulatorSlice.reducer
