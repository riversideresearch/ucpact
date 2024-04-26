import { createSlice } from '@reduxjs/toolkit'

export const realFuncSlice = createSlice ({
    name: 'realFuncSlice',
    initialState: {
        parties: [],
        subfunctionalities: [],
        id: "",
        name: "",
        compositeDirectInterface: "",
        compositeAdversarialInterface: "",
        parameterInterfaces: [],
        // TODO: Add the parameterInterfaces
        // parameterInterfaces: [{name:<string>, idOfInterface: <id of composite interface with type="direct">}*]
    },
    // Redux Toolkit allows us to write "mutating" logic in reducers. It
    // doesn't actually mutate the state because it uses the Immer library,
    // which detects changes to a "draft state" and produces a brand new
    // immutable state based off those changes
    reducers: {
        changeRealfuncDispatch: (state, action) => {
            state.name = action.payload.name;
            state.compositeAdversarialInterface = action.payload.compositeAdversarialInterface;
            state.compositeDirectInterface = action.payload.compositeDirectInterface;
            state.parameterInterfaces = action.payload.parameterInterfaces;
        },
        addToPartiesDispatch: (state, action) => {
            state.parties = [...state.parties, action.payload];
        },
        addToSubfuncsDispatch: (state, action) => {
            state.subfunctionalities = [...state.subfunctionalities, action.payload];
        },
        removeFromPartiesDispatch: (state, action) => {
            let thePartyIndex = state.parties.findIndex(element => element === action.payload);
            state.parties.splice(thePartyIndex, 1);
        },
        removeFromSubfuncsDispatch: (state, action) => {
            let theSFIndex = state.subfunctionalities.findIndex(element => element === action.payload);
            state.subfunctionalities.splice(theSFIndex, 1);
        },
        removeInterFromRealFuncDispatch: (state, action) => {
            if(action.payload === state.compositeAdversarialInterface){
                state.compositeAdversarialInterface = "";
            }else if (action.payload === state.compositeDirectInterface){
                state.compositeDirectInterface = "";
            }

        },
        realFuncAppLoadDispatch: (state, action) => {
            state.parties = action.payload.parties;
            state.subfunctionalities = action.payload.subfunctionalities;
            state.id = action.payload.id;
            state.name = action.payload.name;
            state.compositeDirectInterface = action.payload.compositeDirectInterface;
            state.compositeAdversarialInterface = action.payload.compositeAdversarialInterface;
            state.parameterInterfaces = action.payload.parameterInterfaces;
        },
        addParamInterDispatch: (state, action) => {
            if (!state.parameterInterfaces) {
                state.parameterInterfaces = [];
            } 
            state.parameterInterfaces = [...state.parameterInterfaces, action.payload]
        },
        deleteParamInterDispatch: (state, action) => {
            let thisParameterIndex = state.parameterInterfaces.findIndex(element => element.id === action.payload)
            state.parameterInterfaces.splice(thisParameterIndex, 1)
        }
    },
})

export const { addToPartiesDispatch,
               addToSubfuncsDispatch,
               removeFromPartiesDispatch,
               removeFromSubfuncsDispatch,
               changeRealfuncDispatch, 
               removeInterFromRealFuncDispatch,
               realFuncAppLoadDispatch,
               addParamInterDispatch,
               deleteParamInterDispatch } = realFuncSlice.actions

export default realFuncSlice.reducer
