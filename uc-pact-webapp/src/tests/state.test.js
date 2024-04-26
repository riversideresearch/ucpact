import { render, screen, fireEvent, cleanup, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../App';
import State from '../components/state';
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

it('Renders State component', () => {
    render(<Provider store={store}>
        <DndProvider backend={HTML5Backend}>
            <State />
        </DndProvider>
    </Provider>);
});

describe.skip('Perform tests on the State Component', () => {
    beforeEach(() => {
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

    it('Gets State Component and checks to drag to the State Machine', async () => {
        // Ensures we are on the State Machine Tab
        await waitFor(() => {
            expect(screen.getAllByRole('tab')[3]).toBeInTheDocument()
        })
        fireEvent.click(screen.getAllByRole('tab')[3]);
        // Checks if modal is hidden originally
        const modal = screen.queryByTestId('state-modal');
        expect(modal).not.toBeInTheDocument();
        // Gets the party component
        const stateComp = screen.getAllByText('State')[0];
        const dropZone = screen.getByText('IF State Machine');
        // Begins dragging the Comp and Drops it in the box
        fireEvent.dragStart(stateComp);
        fireEvent.dragEnter(dropZone);
        fireEvent.dragOver(dropZone);
        fireEvent.drop(dropZone);
        // Grabs the modal
        const poppedModal = screen.getByTestId('state-modal');
        // Checks if it is in the document
        expect(poppedModal).toBeInTheDocument();
    });

    it('Gets State Component and checks modal delete button', async () => {
        // Ensures we are on the State Machine Tab
        await waitFor(() => {
            expect(screen.getAllByRole('tab')[3]).toBeInTheDocument()
        })
        fireEvent.click(screen.getAllByRole('tab')[3]);
        // Gets the state component
        const stateComp = screen.getAllByText('State')[0];
        const dropZone = screen.getByText('IF State Machine');
        // Begins dragging the Comp and Drops it in the box
        fireEvent.dragStart(stateComp);
        fireEvent.dragEnter(dropZone);
        fireEvent.dragOver(dropZone);
        fireEvent.drop(dropZone);
        // Grabs the modal
        const modal = screen.getByTestId('state-modal');
        // Checks if it is in the document
        expect(modal).toBeInTheDocument();
        // Get state Instance
        // Get the button to be tested
        const deleteButton = screen.getByText('Delete');
        // Click the button
        fireEvent.click(deleteButton);
        // Modal should close
        expect(modal).not.toBeInTheDocument();
        // Grab State Machine div
        const stateMachine = screen.queryByText('IF State Machine').parentElement?.parentElement;
        // Grab State Machine children count
        const count = stateMachine.childElementCount;
        // State should not exist (count should be 2: header, initState)
        expect(count).toEqual(2);
    });
    it('Gets State Component and checks that save changes button works', async () => {
        // Ensures we are on the State Machine Tab
        await waitFor(() => {
            expect(screen.getAllByRole('tab')[3]).toBeInTheDocument()
        })
        fireEvent.click(screen.getAllByRole('tab')[3]);
        // Gets the state component
        const stateComp = screen.getAllByText('State')[0];
        const dropZone = screen.getByText('IF State Machine');
        // Begins dragging the Comp and Drops it in the box
        fireEvent.dragStart(stateComp);
        fireEvent.dragEnter(dropZone);
        fireEvent.dragOver(dropZone);
        fireEvent.drop(dropZone);
        // Create a name for the component
        // TODO: Check state naming conventions/rules
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
    });
    it('Gets State Component and checks that gear is clickable and opens the modal', async () => {
        // Ensures we are on the State Machine Tab
        await waitFor(() => {
            expect(screen.getAllByRole('tab')[3]).toBeInTheDocument()
        })
        fireEvent.click(screen.getAllByRole('tab')[3]);
        // Gets the party component
        const stateComp = screen.getAllByText('State')[0];
        const dropZone = screen.getByText('IF State Machine');
        // Begins dragging the Comp and Drops it in the box
        fireEvent.dragStart(stateComp);
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
        // click the button
        fireEvent.click(testButton);
        // Check the component was renamed
        const testComp = screen.getAllByText(testName)[0];
        // Finds and clicks the gear to access the modal
        fireEvent.click(screen.getAllByTestId('stateOptions')[1]);
        // Check the modal opened
        expect(screen.getByText('Configure TestName1')).toBeInTheDocument();
        expect(testComp).toBeInTheDocument();
    });
    it('Gets State Component and opens the modal to change the color', async () => {
        // Ensures we are on the State Machine Tab
        await waitFor(() => {
            expect(screen.getAllByRole('tab')[3]).toBeInTheDocument()
        })
        fireEvent.click(screen.getAllByRole('tab')[3]);
        // Gets the party component
        const stateComp = screen.getAllByText('State')[0];
        const dropZone = screen.getByText('IF State Machine');
        // Begins dragging the Comp and Drops it in the box
        fireEvent.dragStart(stateComp);
        fireEvent.dragEnter(dropZone);
        fireEvent.dragOver(dropZone);
        fireEvent.drop(dropZone);
        // Check the modal opened
        const modal = screen.getByTestId('state-modal');
        expect(modal).toBeInTheDocument();
        // Create a name for the component
        const testName = "TestName1";
        // Put name into input box
        let input = screen.getByPlaceholderText('Enter a name');
        fireEvent.change(input, {target: {value: testName}});
        // Get the button to be tested
        const testButton = screen.getByText('Save Changes');
        // Click the button
        fireEvent.click(testButton);
        expect(modal).not.toBeInTheDocument();
        let originColor = '#e3c85b';
        // Get party element in the model
        const partyText = screen.getAllByText(testName)[0];
        const stateInstance = partyText.parentElement;
        // Expect original color
        expect(stateInstance).toHaveStyle({ 'background-color': originColor })
        // Set the color of the party to be tested
        let testColor = "#c4dd88"; 
        // Open the modal
        fireEvent.click(screen.getAllByTestId('stateOptions')[1]);
        //Get the color box from the twitter picker
        let colorBox = screen.getByTitle(testColor);
        // Click that box in the twitter picker
        fireEvent.click(colorBox);
        // Get the save button
        const saveButton = screen.getByText('Save Changes');
        // Click the button
        fireEvent.click(saveButton);
        // Expect modal to close
        expect(modal).not.toBeInTheDocument();
        // Expect color to change
        expect(stateInstance).toHaveStyle({ 'background-color': testColor });
    });
    it('Gets State Component and checks that the close feature does not modify the component when pressed', async () => {
        // Ensures we are on the State Machine Tab
        await waitFor(() => {
            expect(screen.getAllByRole('tab')[3]).toBeInTheDocument()
        })
        fireEvent.click(screen.getAllByRole('tab')[3]);
        // Gets the party component
        const stateComp = screen.getAllByText('State')[0];
        const dropZone = screen.getByText('IF State Machine');
        // Begins dragging the Comp and Drops it in the box
        fireEvent.dragStart(stateComp);
        fireEvent.dragEnter(dropZone);
        fireEvent.dragOver(dropZone);
        fireEvent.drop(dropZone);
        // Create a name for the component
        const testName = "TestName1";
        // Put name into input box
        let input = screen.getByPlaceholderText('Enter a name');
        fireEvent.change(input, {target: {value: testName}});
        // Get the button to be tested
        const testButton = screen.getByText('Close');
        // Click the button
        fireEvent.click(testButton);
        // Finds and clicks the gear to access the modal
        fireEvent.click(screen.getAllByTestId('stateOptions')[1]);
        // Check the modal opened
        const modal = screen.getByTestId('state-modal');
        expect(modal).toBeInTheDocument();
        // Check that party name does not exist
        const stateInstance = screen.queryByText(testName);
        expect(stateInstance).not.toBeInTheDocument();
    });
    it('Gets the State Component and adds a parameter', async () => {
        // Ensures we are on the State Machine Tab
        await waitFor(() => {
            expect(screen.getAllByRole('tab')[3]).toBeInTheDocument()
        })
        fireEvent.click(screen.getAllByRole('tab')[3]);
        // Gets the party component
        const stateComp = screen.getAllByText('State')[0];
        // Gets all the features of the page that say Real World
        const dropZone = screen.getByText('IF State Machine');
        // Begins dragging the Comp and Drops it in the box
        fireEvent.dragStart(stateComp);
        fireEvent.dragEnter(dropZone);
        fireEvent.dragOver(dropZone);
        fireEvent.drop(dropZone);

        // Click the new parameter button
        fireEvent.click(await screen.findByTitle('Add Parameter'));
        const newParam = screen.getByPlaceholderText('Parameter Name');
        expect(newParam).toBeInTheDocument();
    });
    it('Checks parameter delete button', async () => {
        // Ensures we are on the State Machine Tab
        await waitFor(() => {
            expect(screen.getAllByRole('tab')[3]).toBeInTheDocument()
        })
        fireEvent.click(screen.getAllByRole('tab')[3]);
        // Gets the party component
        const stateComp = screen.getAllByText('State')[0];
        // Gets all the features of the page that say Real World
        const dropZone = screen.getByText('IF State Machine');
        // Begins dragging the Comp and Drops it in the box
        fireEvent.dragStart(stateComp);
        fireEvent.dragEnter(dropZone);
        fireEvent.dragOver(dropZone);
        fireEvent.drop(dropZone);

        // Click the new parameter button
        fireEvent.click(await screen.findByTitle('Add Parameter'));
        const newParam = screen.getByPlaceholderText('Parameter Name');
        expect(newParam).toBeInTheDocument();

        // Find and click delete button
        fireEvent.click(screen.getByTitle('Delete Parameter'));
        expect(newParam).not.toBeInTheDocument();
    });

});
