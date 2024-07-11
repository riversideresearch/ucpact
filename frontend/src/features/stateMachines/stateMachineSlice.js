import { createSlice } from '@reduxjs/toolkit'


export const stateMachineSlice = createSlice ({
    name: 'stateMachineSlice',
    initialState: {
        stateMachines: [],
        states: [],
        transitions: [],
    },
    // Redux Toolkit allows us to write "mutating" logic in reducers. It
    // doesn't actually mutate the state because it uses the Immer library,
    // which detects changes to a "draft state" and produces a brand new
    // immutable state based off those changes
    reducers: {
        addStateMachineDispatch: (state, action) => {
            state.stateMachines = [...state.stateMachines, action.payload];
        },
        addToStatesDispatch: (state, action) => {
            let theStateMachineIndex = state.stateMachines.findIndex(element => element.id === action.payload[1]);
            state.stateMachines[theStateMachineIndex].states = [...state.stateMachines[theStateMachineIndex].states, action.payload[0]];
        },
        addToTransitionsDispatch: (state, action) => {
            let theStateMachineIndex = state.stateMachines.findIndex(element => element.id === action.payload[1]);
            state.stateMachines[theStateMachineIndex].transitions = [...state.stateMachines[theStateMachineIndex].transitions, action.payload[0]];
        },
        changeInitStateDispatch: (state, action) => {
            let theStateMachineIndex = state.stateMachines.findIndex(element => element.id === action.payload[1]);
            state.stateMachines[theStateMachineIndex].initState = action.payload[0];
        },
        // changeStateMachineDispatch: (state, action) => {
        //     let theStateMachineIndex = state.stateMachines.findIndex(element => element.id === action.payload.id);
        //     state.stateMachines[theStateMachineIndex] = action.payload;
        // },
        removeStateMachineDispatch: (state, action) => {
            let theStateMachineIndex = state.stateMachines.findIndex(element => element.id === action.payload);
            state.stateMachines[theStateMachineIndex].states.forEach(stateID => {
                let stateToDeleteIndex = state.states.findIndex(element => element.id === stateID);
                state.states.splice(stateToDeleteIndex, 1);
            })

            state.stateMachines.splice(theStateMachineIndex, 1);
        },
        addStateDispatch: (state, action) => {
            state.states = [...state.states, action.payload];
        },
        changeStateDispatch: (state, action) => {
            let theStateIndex = state.states.findIndex(element => element.id === action.payload.id);
            state.states[theStateIndex] = action.payload;
        },
        removeStateDispatch: (state, action) => {
            let theStateIndex = state.states.findIndex(element => element.id === action.payload);
            state.states.splice(theStateIndex, 1);

            state.stateMachines.forEach(stateMachine => {
                stateMachine.states.forEach(stateID => {
                    if (stateID === action.payload) {
                        stateMachine.states.splice(stateMachine.states.findIndex(element => element === stateID), 1);
                    }
                })
            });

            state.transitions.forEach(transition => {
                if (transition.toState === action.payload) {
                    // Clear the to state if it matches the state being deleted
                    transition.toState = "";
                }
                if (transition.fromState === action.payload) {
                    // Clear the from state if it matches the state being deleted
                    transition.fromState = "";
                }
            });
        },
        updateStatePositionDispatch: (state, action) => {
            let theStateIndex = state.states.findIndex(element => element.id === action.payload[0]);
            state.states[theStateIndex].left = action.payload[1];
            state.states[theStateIndex].top = action.payload[2];
        },
        addTransitionDispatch: (state, action) => {
            state.transitions = [...state.transitions, action.payload];
        },
        addOutArgumentToTransitionDispatch: (state, action) => {
            state.transitions.forEach(transition => {
                let argAdd = {"paraID": action.payload[0], "argValue": ""}
                if(transition.outMessage === action.payload[1]){
                    transition.outMessageArguments.push(argAdd)
                }
            })
        },
        addInArgumentToTransitionDispatch: (state, action) => {
            state.transitions.forEach(transition => {
                let argAdd = {"paraID": action.payload[0], "argValue": ""}
                if(transition.toState === action.payload[1]){
                    transition.toStateArguments.push(argAdd)
                }
            })
        },
        changeTransitionDispatch: (state, action) => {
            let theTransitionIndex = state.transitions.findIndex(element => element.id === action.payload.id);
            state.transitions[theTransitionIndex] = action.payload;
        },
        removeOutArgumentFromTransitionsDispatch: (state, action) => {
            state.transitions.forEach(transition => {
                let theParameterIndex = transition.outMessageArguments.findIndex(element => element.paraID === action.payload);
                if(theParameterIndex === -1){

                }else{
                    transition.outMessageArguments.splice(theParameterIndex, 1)
                }
            })
        },
        removeInArgumentFromTransitionsDispatch: (state, action) => {
            state.transitions.forEach(transition => {
                console.log(action.payload)
                let theParameterIndex = transition.toStateArguments.findIndex(element => element.paraID === action.payload);
                if(theParameterIndex === -1){

                }else{
                    transition.toStateArguments.splice(theParameterIndex, 1)
                }
            })
        },
        removeTransitionDispatch: (state, action) => {
            let theTransitionIndex = state.transitions.findIndex(element => element.id === action.payload);
            state.transitions.splice(theTransitionIndex, 1);

            state.stateMachines.forEach(stateMachine => {
                stateMachine.transitions.forEach(transitionID => {
                    if (transitionID === action.payload) {
                        stateMachine.transitions.splice(stateMachine.transitions.findIndex(element => element === transitionID), 1);
                    }
                })
            })
        },
        addParameterToStateDispatch: (state, action) => {
            let paraID = action.payload[1];
            let parameter = {id: paraID, name: "", type: ""};
            let theStateIndex = state.states.findIndex(element => element.id === action.payload[0]);
            state.states[theStateIndex].parameters = [...state.states[theStateIndex].parameters, parameter]
        },
        removeParameterFromStateDispatch: (state, action) => {
            let theStateIndex = state.states.findIndex(element => element.id === action.payload[0]);
            let parameterIndex = state.states[theStateIndex].parameters.findIndex(element => element.id === action.payload[1]);
            state.states[theStateIndex].parameters.splice(parameterIndex, 1);
        },
        stateMachineAppLoadDispatch: (state, action) => {
            state.stateMachines = action.payload.stateMachines;
            state.states = action.payload.states;
            state.transitions = action.payload.transitions;
        },
        changeTransitionToStateDispatch: (state, action) => {
            let theTransitionIndex = state.transitions.findIndex(element => element.id === action.payload.id);
            state.transitions[theTransitionIndex].toState = action.payload.toState;
        },
        changeTransitionOutMessageDispatch: (state, action) => {
            let theTransitionIndex = state.transitions.findIndex(element => element.id === action.payload.id);
            state.transitions[theTransitionIndex].outMessage = action.payload.outMessage;
        }
    },
})

export const { addStateMachineDispatch,
               removeStateMachineDispatch,
               addStateDispatch,
               changeStateDispatch,
               removeStateDispatch,
               addTransitionDispatch,
               changeTransitionDispatch,
               removeTransitionDispatch,
               addOutArgumentToTransitionDispatch,
               addInArgumentToTransitionDispatch,
               removeOutArgumentFromTransitionsDispatch,
               removeInArgumentFromTransitionsDispatch,
               addToStatesDispatch,
               addToTransitionsDispatch,
               changeInitStateDispatch,
               addParameterToStateDispatch,
               removeParameterFromStateDispatch,
               updateStatePositionDispatch,
               stateMachineAppLoadDispatch,
               changeTransitionToStateDispatch,
               changeTransitionOutMessageDispatch
            } = stateMachineSlice.actions

export default stateMachineSlice.reducer
