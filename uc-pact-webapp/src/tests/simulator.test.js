import '@testing-library/jest-dom';
import { render, screen, act, fireEvent, cleanup, waitFor } from '@testing-library/react';
import App from '../App';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import interfacesReducer, { interfacesSlice } from '../features/interfaces/interfacesSlice';
import partiesReducer from '../features/parties/partiesSlice';
import subfuncReducer from '../features/subfunctionalities/subfuncSlice';
import realFuncReducer, {realFuncSlice} from '../features/realFunctionalities/realFuncSlice';
import simulatorReducer from '../features/simulators/simulatorSlice';
import idealFuncReducer from '../features/idealFunctionalities/idealFuncSlice';
import stateMachineReducer from '../features/stateMachines/stateMachineSlice';
import modelReducer from '../features/model/modelSlice';
import userEvent from '@testing-library/user-event';
import Simulator from '../components/simulator';

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
    },})

jest.useFakeTimers();

it('Renders Simulator component', () => {
    render(<Provider store={store}>
        <DndProvider backend={HTML5Backend}>
            <Simulator />
        </DndProvider>
    </Provider>);
});

describe.skip('Perform tests on the Simulator Component', () => {
    beforeEach(() => {
        // Creates a new store before each test to ensure no leaks between tests
        store = configureStore({
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

        // Renders full app
        render(<DndProvider backend={HTML5Backend}><Provider store={store}><App /></Provider></DndProvider>);
        const testName = "TestModel";
        let input = screen.getByPlaceholderText('New Model Name');
        fireEvent.change(input, {target: {value: testName}});
        fireEvent.click(screen.getByText("New Model..."));
        act(() => {
            jest.advanceTimersByTime(4000);
        });

        // Add Basic Direct Interface via redux
        // Basic Interface Id's should be 3 digits long
        let interBasicId1 = 100;
        let interBasic1 = {id: interBasicId1, name: "BasicInterfaceOne", type: "direct", messages: []};
        act(() => {
            store.dispatch(interfacesSlice.actions.addBasicInterfaceDispatch(interBasic1));
        });

        // Add Composite interface directly via Redux dispatch
        // Let us plan for Composite ID's to be a length of 4 digits for testing
        // Instance Id's of Basic interfaces should be 2 digits long
        let interCompId1 = 1000;
        let interComp1 = {id: interCompId1, name: "CompInterfaceOne", type: "direct", 
            basicInterfaces:[{name:"DirectInstance1", idOfBasic:"100", idOfInstance:10}]};
        act(() => {
            store.dispatch(interfacesSlice.actions.addCompositeInterfaceDispatch(interComp1));
        });

        // Add Basic Adversarial Interface via redux
        // Basic Interface Id's should be 3 digits long
        let interBasicId2 = 101;
        let interBasic2 = {id: interBasicId2, name: "BasicInterfaceTwo", type: "adversarial", messages: []};
        act(() => {
            store.dispatch(interfacesSlice.actions.addBasicInterfaceDispatch(interBasic2));
        });

        // Add Composite interface directly via Redux dispatch
        // Let us plan for Composite ID's to be a length of 4 digits for testing
        // Instance Id's of Basic interfaces should be 2 digits long
        let interCompId2 = 1001;
        let interComp2 = {id: interCompId2, name: "CompInterfaceTwo", type: "adversarial", 
            basicInterfaces:[]};
        act(() => {
           store.dispatch(interfacesSlice.actions.addCompositeInterfaceDispatch(interComp2)); 
        });

        // Add the composite interfaces to the Real functionality with both
        // the adversarial and the direct composite interfaces.
        let updatedValue = {
            "name": "Real Functionality",
            "compositeAdversarialInterface": interCompId2,
            "compositeDirectInterface": interCompId1,
            "parties": "",
            "subfunctionalities": "",
        };
        
        act(() => {
            store.dispatch(realFuncSlice.actions.changeRealfuncDispatch(updatedValue));
        });
    });

    afterEach(() => { 
        //resets the mock funtion after each test
        jest.resetAllMocks();
        jest.clearAllTimers();
        cleanup();
        window.history.pushState({}, '', '/');
    });

    afterAll(() => {
        //clears the mock function after all tests
        jest.clearAllMocks();
    });

    it('Checks Simulator gear is clickable and opens the modal', async () => {
        // Ensures we are on the Ideal World Tab
        await waitFor(() => {
            expect(screen.getAllByRole('tab')[1]).toBeInTheDocument()
        })
        fireEvent.click(screen.getAllByRole('tab')[1]);

        // Finds and clicks the gear to access the modal
        fireEvent.click(screen.getByTestId('simOptions'));

        // Check the modal opened
        expect(screen.getByText('Configure Sim')).toBeInTheDocument();
    });

    it('Checks Simulator save changes button works', async () => {
        // Ensures we are on the Ideal World Tab
        await waitFor(() => {
            expect(screen.getAllByRole('tab')[1]).toBeInTheDocument()
        })
        fireEvent.click(screen.getAllByRole('tab')[1]);
        // Finds and clicks the gear to access the modal
        fireEvent.click(screen.getByTestId('simOptions'));

        // Check the modal opened
        const modal = screen.getByTestId('simulator-modal');
        expect(modal).toBeInTheDocument();

        // Create simulator test name
        const testName = "SimulatorTestName";
        // Put name into input box
        let input = screen.getByPlaceholderText('Enter a name');
        fireEvent.change(input, {target: {value: testName}});
        // Get the save button
        const saveButton = screen.getByText('Save Changes');
        // Click save button
        fireEvent.click(saveButton);

        // Expect modal to close
        expect(modal).not.toBeInTheDocument();
        // Expect Ideal Functionality name to have changed
        expect(screen.getAllByText('SimulatorTestName')[0]).toBeInTheDocument();
    });

    it('Checks Simulator close feature does not modify component', async () => {
        // Ensures we are on the Ideal World Tab
        await waitFor(() => {
            expect(screen.getAllByRole('tab')[1]).toBeInTheDocument()
        })
        fireEvent.click(screen.getAllByRole('tab')[1]);
        // Finds and clicks the gear to access the modal
        fireEvent.click(screen.getByTestId('simOptions'));

        // Create simulator test name
        const testName = "SimulatorTestName";
        // Put name into input box
        let input = screen.getByPlaceholderText('Enter a name');
        fireEvent.change(input, {target: {value: testName}});

        // Get the close button
        const closeButton = screen.getByText('Close');
        // Click close button
        fireEvent.click(closeButton);

        // Click Simulator modal
        fireEvent.click(screen.getByTestId('simOptions'));

        // Check the modal opened
        const modal = screen.getByTestId('simulator-modal');
        expect(modal).toBeInTheDocument();
        // Check that Simulator name does not exist
        const simulatorInstance = screen.queryByText(testName);
        expect(simulatorInstance).not.toBeInTheDocument();
    });

    it('Checks Simulator Basic Adversarial Interface is selectable', async () => {
        // Ensures we are on the Ideal World Tab
        await waitFor(() => {
            expect(screen.getAllByRole('tab')[1]).toBeInTheDocument()
        })
        fireEvent.click(screen.getAllByRole('tab')[1]);
        // Finds and clicks the gear to access the modal
        fireEvent.click(screen.getByTestId('simOptions'));

        userEvent.selectOptions(screen.getByTitle('simAdvInterface'), screen.getAllByRole('option', {name: 'BasicInterfaceTwo'})[0]);
        expect(screen.getAllByRole('option', {name: 'BasicInterfaceTwo'})[0].selected).toBe(true);
    });

    // TODO: Update the below test once we have the ability to select from multiple Real Functionalities
    
    // it('Checks Simulator realFunc dropdown is selectable', () => {

    // });
});
