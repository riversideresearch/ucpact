import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import interfacesReducer, { interfacesSlice } from '../features/interfaces/interfacesSlice';
import partiesReducer, { partiesSlice } from '../features/parties/partiesSlice';
import subfuncReducer, { subfuncSlice } from '../features/subfunctionalities/subfuncSlice';
import realFuncReducer, { realFuncSlice } from '../features/realFunctionalities/realFuncSlice';
import simulatorReducer, { simulatorSlice } from '../features/simulators/simulatorSlice';
import idealFuncReducer, { idealFuncSlice } from '../features/idealFunctionalities/idealFuncSlice';
import stateMachineReducer, { stateMachineSlice } from '../features/stateMachines/stateMachineSlice';
import App from '../App';

var store = configureStore({
    reducer: {
        interfaces: interfacesReducer,
        parties: partiesReducer,
        subfunctionalities: subfuncReducer,
        realFunctionality: realFuncReducer,
        simulator: simulatorReducer,
        idealFunctionality: idealFuncReducer,
        stateMachines: stateMachineReducer,
    },
});

describe('Tests code generations funtionality', () => {
    beforeEach(async () => {
        // Creates a new store before each test to ensure no leaks between tests
        store = configureStore({
            reducer: {
                interfaces: interfacesReducer,
                parties: partiesReducer,
                subfunctionalities: subfuncReducer,
                realFunctionality: realFuncReducer,
                simulator: simulatorReducer,
                idealFunctionality: idealFuncReducer,
                stateMachines: stateMachineReducer,
            },});

        render(<Provider store={store}><DndProvider backend={HTML5Backend}><App /></DndProvider></Provider>);

        // Open dropdown
        fireEvent.click(screen.getByTitle('Add Interface'));

        // Add basic interface
        fireEvent.click(await screen.findByTitle('Add Composite Interface'));

        // Click the plus to add a basic interface
        fireEvent.click(await screen.findByTitle('Add Basic to Composite'));
    });
    afterEach(() => { 
        // Resets the mock funtion after each test
        jest.resetAllMocks();
    });
    afterAll(() => {
        // Clears the mock function after all tests
        jest.clearAllMocks();
    });

    it.skip('Checks that no tab characters are present in the generated code', () => {
        expect(screen.getAllByRole('textbox')[2]).toHaveTextContent('\t');
    })

    it.skip('Checks that every \r is followed by a \n', () => {
        
    })
})
