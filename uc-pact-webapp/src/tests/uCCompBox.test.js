import { render } from '@testing-library/react';
import UCCompBox from "../components/uCCompBox";
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import interfacesReducer, { interfacesSlice } from '../features/interfaces/interfacesSlice';
import partiesReducer, { partiesSlice } from '../features/parties/partiesSlice';
import subfuncReducer, { subfuncSlice } from '../features/subfunctionalities/subfuncSlice';
import realFuncReducer, { realFuncSlice } from '../features/realFunctionalities/realFuncSlice';
import simulatorReducer, { simulatorSlice } from '../features/simulators/simulatorSlice';
import idealFuncReducer, { idealFuncSlice } from '../features/idealFunctionalities/idealFuncSlice';
import stateMachineReducer, { stateMachineSlice } from '../features/stateMachines/stateMachineSlice';

var store = configureStore({
    reducer: {
        interfaces: interfacesReducer,
        parties: partiesReducer,
        subfunctionalities: subfuncReducer,
        realFunctionality: realFuncReducer,
        simulator: simulatorReducer,
        idealFunctionality: idealFuncReducer,
        stateMachines: stateMachineReducer,
    },})

it ('Renders UC Comp Box component', () => {
    render(<Provider store={store}>
        <DndProvider backend={HTML5Backend}>
            <UCCompBox />
        </DndProvider>
    </Provider>);
})
