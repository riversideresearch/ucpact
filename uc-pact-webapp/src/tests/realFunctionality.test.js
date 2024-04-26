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
import realFuncReducer from '../features/realFunctionalities/realFuncSlice';
import simulatorReducer from '../features/simulators/simulatorSlice';
import idealFuncReducer from '../features/idealFunctionalities/idealFuncSlice';
import stateMachineReducer from '../features/stateMachines/stateMachineSlice';
import modelReducer from '../features/model/modelSlice';
import userEvent from '@testing-library/user-event';
import Environment from '../components/environment';
import RealFunctionality from '../components/realFunctionality';

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

it('Renders Real Functionality component', () => {
    render(<Provider store={store}>
               <DndProvider backend={HTML5Backend}>
                   <RealFunctionality />
               </DndProvider>
           </Provider>);
});

it('Renders Environment component', () => {
    render(<Provider store={store}>
               <DndProvider backend={HTML5Backend}>
                   <Environment />
               </DndProvider>
           </Provider>);
});

describe.skip('Perform tests on the Real Functionality Component', () => {
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

        // Renders full app for Dnd
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
            basicInterfaces:[{name:"AdvInstance1", idOfBasic:interBasicId2, idOfInstance:11}]};
        act(() => {
           store.dispatch(interfacesSlice.actions.addCompositeInterfaceDispatch(interComp2)); 
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

    it('Checks Real Functionality save changes button works', async () => {
        // Ensures we are on the Real World Tab
        await waitFor(() => {
            expect(screen.getAllByRole('tab')[0]).toBeInTheDocument()
        })
        fireEvent.click(screen.getAllByRole('tab')[0]);
        // Click Real Functionality modal
        fireEvent.click(screen.getByTestId('realFuncOptions'));

        // Check the modal opened
        const modal = screen.getByTestId('realFunc-modal');
        expect(modal).toBeInTheDocument();

        // Create realFunc test name
        const testName = "RealFuncTestName";
        // Put name into input box
        let input = screen.getByPlaceholderText('Enter a name');
        fireEvent.change(input, {target: {value: testName}})
        // Get the save button
        const saveButton = screen.getByText('Save Changes');
        // Click save button
        fireEvent.click(saveButton);

        // Expect modal to close
        expect(modal).not.toBeInTheDocument();
        // Expect Real Functionality name to have changed
        expect(screen.getByText('RealFuncTestName')).toBeInTheDocument();
    });

    it('Checks Real Functionality close feature does not modify component', async () => {
        // Ensures we are on the Real World Tab
        await waitFor(() => {
            expect(screen.getAllByRole('tab')[0]).toBeInTheDocument()
        })
        fireEvent.click(screen.getAllByRole('tab')[0]);
        // Click Real Functionality modal
        fireEvent.click(screen.getByTestId('realFuncOptions'));

        // Create realFunc test name
        const testName = "RealFuncTestName";
        // Put name into input box
        let input = screen.getByPlaceholderText('Enter a name');
        fireEvent.change(input, {target: {value: testName}});
        // Get the close button
        const closeButton = screen.getByText('Close');
        // Click close button
        fireEvent.click(closeButton);

        // Click Real Functionality modal
        fireEvent.click(screen.getByTestId('realFuncOptions'));

        // Check the modal opened
        const modal = screen.getByTestId('realFunc-modal');
        expect(modal).toBeInTheDocument();
        // Check that Real Functionality name does not exist
        const realFuncInstance = screen.queryByText(testName);
        expect(realFuncInstance).not.toBeInTheDocument();
    });

    it('Checks Real Functionality Composite Direct Interface is selectable', async () => {
        // Ensures we are on the Real World Tab
        await waitFor(() => {
            expect(screen.getAllByRole('tab')[0]).toBeInTheDocument()
        })
        fireEvent.click(screen.getAllByRole('tab')[0]);
        // Click Real Functionality modal
        fireEvent.click(screen.getByTestId('realFuncOptions'));

        userEvent.selectOptions(screen.getByTitle('realFuncDirInterface'), screen.getByRole('option', {name: 'CompInterfaceOne'}));
        expect(screen.getByRole('option', {name: 'CompInterfaceOne'}).selected).toBe(true);
    });

    it('Checks Real Functionality Composite Adversarial Interface is selectable', async () => {
        // Ensures we are on the Real World Tab
        await waitFor(() => {
            expect(screen.getAllByRole('tab')[0]).toBeInTheDocument()
        })
        fireEvent.click(screen.getAllByRole('tab')[0]);
        // Click Real Functionality modal
        fireEvent.click(screen.getByTestId('realFuncOptions'));

        userEvent.selectOptions(screen.getByTitle('realFuncAdvInterface'), screen.getByRole('option', {name: 'CompInterfaceTwo'}));
        expect(screen.getByRole('option', {name: 'CompInterfaceTwo'}).selected).toBe(true);
    });
});
