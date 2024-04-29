import { createSlice } from '@reduxjs/toolkit'

export const partiesSlice = createSlice ({
    name: 'partiesSlice',
    initialState: {
        parties: [],
    },
    // Redux Toolkit allows us to write "mutating" logic in reducers. It
    // doesn't actually mutate the state because it uses the Immer library,
    // which detects changes to a "draft state" and produces a brand new
    // immutable state based off those changes
    reducers: {
        addPartyDispatch: (state, action) => {
            state.parties = [...state.parties, action.payload];
        },
        changePartyDispatch: (state, action) => {
            let thePartyIndex = state.parties.findIndex(element => element.id === action.payload.id);
            state.parties[thePartyIndex] = action.payload;
        },
        removePartyDispatch: (state, action) => {
            let thePartyIndex = state.parties.findIndex(element => element.id === action.payload);
            state.parties.splice(thePartyIndex, 1);
        },
        removeInterFromPartiesDispatch: (state, action) => {
            state.parties.forEach(party => {
                if (party.basicAdversarialInterface === action.payload) {
                    party.basicAdversarialInterface = "";
                } else if (party.basicDirectInterface === action.payload) {
                    party.basicDirectInterface = "";
                }
            })
        },
        updatePartyPositionDispatch: (state, action) => {
            let thePartyIndex = state.parties.findIndex(element => element.id === action.payload[0]);
            state.parties[thePartyIndex].left = action.payload[1];
            state.parties[thePartyIndex].top = action.payload[2];
        },
        clearDirectInterfaceDispatch: (state, action) => {
            let thePartyIndex = state.parties.findIndex(element => element.id === action.payload);
            state.parties[thePartyIndex].basicDirectInterface = "";
        },
        clearAdversarialInterfaceDispatch: (state, action) => {
            let thePartyIndex = state.parties.findIndex(element => element.id === action.payload);
            state.parties[thePartyIndex].basicAdversarialInterface = "";
        },
        partiesAppLoadDispatch: (state, action) => {
            state.parties = action.payload.parties;
        }
    },
})

export const { addPartyDispatch,
               changePartyDispatch,
               removePartyDispatch,
               removeInterFromPartiesDispatch,
               updatePartyPositionDispatch,
               clearAdversarialInterfaceDispatch,
               clearDirectInterfaceDispatch,
               partiesAppLoadDispatch } = partiesSlice.actions

export default partiesSlice.reducer
