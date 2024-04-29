import { render, screen, fireEvent, act, cleanup, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../App';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import interfacesReducer from '../features/interfaces/interfacesSlice';
import partiesReducer from '../features/parties/partiesSlice';
import subfuncReducer from '../features/subfunctionalities/subfuncSlice';
import realFuncReducer from '../features/realFunctionalities/realFuncSlice';
import simulatorReducer from '../features/simulators/simulatorSlice';
import idealFuncReducer from '../features/idealFunctionalities/idealFuncSlice';
import stateMachineReducer from '../features/stateMachines/stateMachineSlice';
import modelReducer from '../features/model/modelSlice';

var store = configureStore({
    reducer: {
        model: modelReducer,
        interfaces: interfacesReducer,
        parties: partiesReducer,
        subfunctionalities: subfuncReducer,
        realFunctionality: realFuncReducer,
        simulator: simulatorReducer,
        idealFunctionality: idealFuncReducer,
        stateMachines: stateMachineReducer,
    },});

jest.useFakeTimers();
    
describe.skip('Performs tests on the State Machine Component', () => {
    beforeEach(() => {
        render(<DndProvider backend={HTML5Backend}><Provider store={store}><App /></Provider></DndProvider>);
        const testName = "TestModel";
        let input = screen.getByPlaceholderText('New Model Name');
        fireEvent.change(input, {target: {value: testName}});
        fireEvent.click(screen.getByText("New Model..."));
        act(() => {
            jest.advanceTimersByTime(4000);
        });
    });

    afterEach(() => {
        jest.clearAllTimers();
        cleanup();
        window.history.pushState({}, '', '/');
    });

    it('Checks IF and Sim tab exist on load', async () => {
        // Grabs and checks IF tab
        await waitFor(() => {
            expect(screen.getAllByText('IF')[1]).toBeInTheDocument()
        })
        const IFtab = screen.getAllByText('IF')[1];
        expect(IFtab).toBeInTheDocument();

        // Grabs and checks Sim tab
        const Simtab = screen.getAllByText('Sim')[1];
        expect(Simtab).toBeInTheDocument();
    });

    it('Checks a new tab is made for a new party', async () => {
        // Ensures we are on the Real World Tab
        await waitFor(() => {
            expect(screen.getAllByRole('tab')[0]).toBeInTheDocument()
        })
        fireEvent.click(screen.getAllByRole('tab')[0]);
        // Gets the party component
        const partyComp = screen.getByText('Party');
        // Gets all the features of the page that say Real World
        const dropZone = screen.getByText('Real_Functionality');
        // Begins dragging the Comp and Drops it in the box
        fireEvent.dragStart(partyComp);
        fireEvent.dragEnter(dropZone);
        fireEvent.dragOver(dropZone);
        fireEvent.drop(dropZone);
        // Create a name for the component
        const testName = "TestName1";
        // Put name into input box
        let input = screen.getByPlaceholderText('Enter a name');
        fireEvent.change(input, {target: {value: testName}});
        // Get the button to be tested
        const testButton = screen.getByText('Save Changes');
        // Click the button
        fireEvent.click(testButton);
        // Check the component was renamed
        expect(screen.getAllByText(testName)[0]).toBeInTheDocument();

        // Check the tab was created
        expect(screen.getAllByText(testName)[1]).toBeInTheDocument();
    });
});
