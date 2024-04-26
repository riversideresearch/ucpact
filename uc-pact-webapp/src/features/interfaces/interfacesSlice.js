import { createSlice } from '@reduxjs/toolkit'
import uuid from 'react-uuid';

export const interfacesSlice = createSlice ({
    name: 'interfacesSlice',
    initialState: {
        compInters: [],
        basicInters: [],
        messages: [],
    },
    // Redux Toolkit allows us to write "mutating" logic in reducers. It
    // doesn't actually mutate the state because it uses the Immer library,
    // which detects changes to a "draft state" and produces a brand new
    // immutable state based off those changes
    reducers: {
        setCompInterfaceNameDispatch: (state, action) => {
            let theInterfaceIndex = state.compInters.findIndex(element => element.id === action.payload[0]);
            state.compInters[theInterfaceIndex].name = action.payload[1];
        },
        addCompositeInterfaceDispatch: (state, action) => {
            state.compInters = [...state.compInters, action.payload];
        },
        setCompInterfaceTypeDispatch: (state, action) => {
            let theInterfaceIndex = state.compInters.findIndex(element => element.id === action.payload[0]);
            state.compInters[theInterfaceIndex].type = action.payload[1];
            state.compInters[theInterfaceIndex].basicInterfaces.forEach(e => e[1] = "");
        },
        deleteCompInterfaceDispatch: (state, action) => {
            let theInterfaceIndex = state.compInters.findIndex(element => element.id === action.payload)
            state.compInters.splice(theInterfaceIndex, 1);
        },
        setBasicInterfaceNameForCompositeDispatch: (state, action) => {
            let theInterfaceIndex = state.compInters.findIndex(element => element.id === action.payload[0])
            state.compInters[theInterfaceIndex].basicInterfaces[action.payload[1]].name = action.payload[2];
        },
        setBasicInterfaceIDForCompositeDispatch: (state, action) => {
            let theInterfaceIndex = state.compInters.findIndex(element => element.id === action.payload[0])
            state.compInters[theInterfaceIndex].basicInterfaces[action.payload[1]].idOfBasic = action.payload[2];
        },
        addBasicToCompositeDispatch: (state, action) => {
            let theInterfaceIndex = state.compInters.findIndex(element => element.id === action.payload)
            state.compInters[theInterfaceIndex].basicInterfaces = [...state.compInters[theInterfaceIndex].basicInterfaces, {name:"", idOfBasic:"",idOfInstance:uuid()}]
        },
        deleteBasicFromCompositeDispatch: (state, action) => {
            let theInterfaceIndex = state.compInters.findIndex(element => element.id === action.payload[0])
            state.compInters[theInterfaceIndex].basicInterfaces.splice(action.payload[1], 1)
        },
        addBasicInterfaceDispatch: (state, action) => {
            state.basicInters = [...state.basicInters, action.payload];
        },
        deleteBasicInterfaceDispatch: (state, action) => {
            let theInterfaceIndex = state.basicInters.findIndex(element => element.id === action.payload);
            let msgsToDelete = [...state.basicInters[theInterfaceIndex].messages];
            let idToDelete = state.basicInters[theInterfaceIndex].id;

            state.basicInters.splice(theInterfaceIndex, 1);
            state.messages = state.messages.filter(msg => !msgsToDelete.includes(msg.id));
            state.compInters.forEach(inter => {
                inter.basicInterfaces.forEach(basicInter => {
                    if (basicInter.idOfBasic === idToDelete) {
                        basicInter.idOfBasic = "";
                    }
                })
            })
        },
        setBasicInterfaceNameDispatch: (state, action) => {
            let theInterfaceIndex = state.basicInters.findIndex(element => element.id === action.payload[0]);
            state.basicInters[theInterfaceIndex].name = action.payload[1];
        },
        setBasicInterfaceTypeDispatch: (state, action) => {
            let theInterfaceIndex = state.basicInters.findIndex(element => element.id === action.payload[0]);
            state.basicInters[theInterfaceIndex].type = action.payload[1];
        },
        setMessageNameDispatch: (state, action) => {
            let theMessageIndex = state.messages.findIndex(element => element.id === action.payload[0]);
            state.messages[theMessageIndex].name = action.payload[1];
        },
        setMessagePortDispatch: (state, action) => {
            let theMessageIndex = state.messages.findIndex(element => element.id === action.payload[0]);
            state.messages[theMessageIndex].port = action.payload[1];
        },
        setParameterNameDispatch: (state, action) => {
            let theMessageIndex = state.messages.findIndex(element => element.id === action.payload[0]);
            let theParameterIndex = state.messages[theMessageIndex].parameters.findIndex(element => element.id === action.payload[1]);
            state.messages[theMessageIndex].parameters[theParameterIndex].name = action.payload[2];
        },
        setParameterTypeDispatch: (state, action) => {
            let theMessageIndex = state.messages.findIndex(element => element.id === action.payload[0]);
            let theParameterIndex = state.messages[theMessageIndex].parameters.findIndex(element => element.id === action.payload[1]);
            state.messages[theMessageIndex].parameters[theParameterIndex].type = action.payload[2];
        },
        setMessageTypeDispatch: (state, action) => {
            let theMessageIndex = state.messages.findIndex(element => element.id === action.payload[0]);
            state.messages[theMessageIndex].type = action.payload[1];
        },
        addMessageToInterfaceDispatch: (state, action) => {
            let msgID = uuid();

            let theInterfaceIndex = state.basicInters.findIndex(element => element.id === action.payload);
            state.basicInters[theInterfaceIndex].messages = [...state.basicInters[theInterfaceIndex].messages, msgID];

            let message = {id: msgID, 
                name: "", 
                type: "in", 
                port: "", 
                parameters: []};
            state.messages = [...state.messages, message];
        },
        addParameterToMessageDispatch: (state, action) => {
            let paraID = action.payload[0]; // Moving to interface creation to use for other dispatch
            let parameter = {id: paraID, name: "", type: ""};
            let theMessageIndex = state.messages.findIndex(element => element.id === action.payload[1]);
            state.messages[theMessageIndex].parameters = [...state.messages[theMessageIndex].parameters, parameter];
        },
        deleteMessageFromInterfaceDispatch: (state, action) => {
            let theInterfaceIndex = state.basicInters.findIndex(element => element.id === action.payload[0]);
            let theMessageIndex = state.basicInters[theInterfaceIndex].messages.findIndex(element => element === action.payload[1]);
            let theMessageStateIndex = state.messages.findIndex(element => element.id === action.payload[1]);
            state.basicInters[theInterfaceIndex].messages.splice(theMessageIndex, 1);
            state.messages.splice(theMessageStateIndex, 1);
        },
        deleteParameterFromMessageDispatch: (state, action) => {
            let theMessageIndex = state.messages.findIndex(element => element.id === action.payload[0]);
            let theParameterIndex = state.messages[theMessageIndex].parameters.findIndex(element => element.id === action.payload[1]);
            state.messages[theMessageIndex].parameters.splice(theParameterIndex, 1);
        },
        interfacesAppLoadDispatch: (state, action) => {
            state.compInters = action.payload.compInters
            state.basicInters = action.payload.basicInters
            state.messages = action.payload.messages
        },
    },
})

export const { setCompInterfaceNameDispatch, 
               addCompositeInterfaceDispatch, 
               setCompInterfaceTypeDispatch,
               deleteCompInterfaceDispatch,
               setBasicInterfaceNameForCompositeDispatch,
               addBasicToCompositeDispatch,
               deleteBasicFromCompositeDispatch,
               setBasicInterfaceIDForCompositeDispatch,
               addBasicInterfaceDispatch,
               setBasicInterfaceNameDispatch,
               setMessageNameDispatch,
               setMessagePortDispatch,
               setBasicInterfaceTypeDispatch,
               deleteBasicInterfaceDispatch,
               addMessageToInterfaceDispatch,
               deleteMessageFromInterfaceDispatch,
               setMessageTypeDispatch,
               addParameterToMessageDispatch,
               deleteParameterFromMessageDispatch,
               setParameterNameDispatch,
               setParameterTypeDispatch,
               interfacesAppLoadDispatch } = interfacesSlice.actions

export default interfacesSlice.reducer
