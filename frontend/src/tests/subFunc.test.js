import { render, fireEvent, screen, act, cleanup, waitFor } from '@testing-library/react';
import SubFunc from '../components/subFunc';
import App from '../App';
import '@testing-library/jest-dom';
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
    },})

jest.useFakeTimers();

it('Renders subFunc component', () => {
    render(<Provider store={store}>
        <DndProvider backend={HTML5Backend}>
            <SubFunc />
        </DndProvider>
    </Provider>);
});

describe.skip('Performs tests on the SubFunctionality Component', () => {
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
         },})

        render(<Provider store={store}><DndProvider backend={HTML5Backend}><App /></DndProvider></Provider>);
        const testName = "TestModel";
        let input = screen.getByPlaceholderText('New Model Name');
        fireEvent.change(input, {target: {value: testName}});
        fireEvent.click(screen.getByText("New Model..."));
        act(() => {
            jest.advanceTimersByTime(4000);
        });
    });
    afterEach(() => { 
        // Resets the mock funtion after each test
        jest.resetAllMocks();
        jest.clearAllTimers();
        cleanup();
        window.history.pushState({}, '', '/');
    });
    afterAll(() => {
        // Clears the mock function after all tests
        jest.clearAllMocks();
    });
    it('Gets SubFunctionality Component and checks to drag to the Real world', async () => {
        // Ensures we are on the Real World Tab
        await waitFor(() => {
            expect(screen.getAllByRole('tab')[0]).toBeInTheDocument()
        })
        fireEvent.click(screen.getAllByRole('tab')[0]);
        // Gets the sub functionality component
        const subFuncComp = screen.getByText('Subfunctionality'); 
        // Gets all the features of the page that say Real World
        const dropZone = screen.getByText('Real_Functionality');
        // Targets the Drop Box of the Real world dropZoneArray[0] is the Tab
        // Begins dragging the Comp and Drops it in the box
        fireEvent.dragStart(subFuncComp);
        fireEvent.dragEnter(dropZone);
        fireEvent.dragOver(dropZone);
        fireEvent.drop(dropZone);
        // Grab the modal
        const modal = screen.getByTestId('subfunc-modal');
        expect(modal).toBeInTheDocument();
    });
    it('Gets SubFunctionality Component and checks modal delete button', async () => {
        // Ensures we are on the Real World Tab
        await waitFor(() => {
            expect(screen.getAllByRole('tab')[0]).toBeInTheDocument()
        })
        fireEvent.click(screen.getAllByRole('tab')[0]);
        // Gets the sub functionality component
        const subFuncComp = screen.getByText('Subfunctionality'); 
        // Gets all the features of the page that say Real World
        const dropZone = screen.getByText('Real_Functionality');
        // Begins dragging the Comp and Drops it in the box
        fireEvent.dragStart(subFuncComp);
        fireEvent.dragEnter(dropZone);
        fireEvent.dragOver(dropZone);
        fireEvent.drop(dropZone);
        // Grab the modal and check if it opened
        const modal = screen.getByTestId('subfunc-modal');
        expect(modal).toBeInTheDocument();
        // Get the button to be tested
        const testButton = screen.getByText('Delete');
        // Click the button
        fireEvent.click(testButton);
        // Grab real world div
        const realWorld = screen.getByText('Real_Functionality').parentElement.parentElement;
        // Grab real world children count
        const count = realWorld.childElementCount;
        // Party should not exist (count should be 2: header and environment)
        expect(count).toEqual(2);
    });
    it('Gets SubFunctionality Component and checks that save changes button works', async () => {
        // Ensures we are on the Real World Tab
        await waitFor(() => {
            expect(screen.getAllByRole('tab')[0]).toBeInTheDocument()
        })
        fireEvent.click(screen.getAllByRole('tab')[0]);
        // Gets the sub functionality component
        const subFuncComp = screen.getByText('Subfunctionality'); 
        // Gets all the features of the page that say Real World
        const dropZone = screen.getByText('Real_Functionality');
        // Begins dragging the Comp and Drops it in the box
        fireEvent.dragStart(subFuncComp);
        fireEvent.dragEnter(dropZone);
        fireEvent.dragOver(dropZone);
        fireEvent.drop(dropZone);
        // Grab the modal and check if it opened
        const modal = screen.getByTestId('subfunc-modal');
        expect(modal).toBeInTheDocument();
        // Create a name for the component
        const testName = "TestName1";
        // Put name into input box
        let input = screen.getByPlaceholderText('Enter a name');
        fireEvent.change(input, {target: {value: testName}});
        // Get the button to be tested
        const saveButton = screen.getByText('Save Changes');
        // Click the button
        fireEvent.click(saveButton);
        // Check the modal closed
        expect(modal).not.toBeInTheDocument();
        // Check the component was renamed
        const subInstance = screen.getByText(testName);
        expect(subInstance).toBeInTheDocument();
    });
    it('Gets SubFunctionality Component and checks that gear is clickable and opens the modal', async () => {
        // Ensures we are on the Real World Tab
        await waitFor(() => {
            expect(screen.getAllByRole('tab')[0]).toBeInTheDocument()
        })
        fireEvent.click(screen.getAllByRole('tab')[0]);
        // Gets the sub functionality component
        const subFuncComp = screen.getByText('Subfunctionality'); 
        // Gets all the features of the page that say Real World
        const dropZone = screen.getByText('Real_Functionality');
        // Begins dragging the Comp and Drops it in the box
        fireEvent.dragStart(subFuncComp);
        fireEvent.dragEnter(dropZone);
        fireEvent.dragOver(dropZone);
        fireEvent.drop(dropZone);
        // Grab the modal and check if it opened
        const modal = screen.getByTestId('subfunc-modal');
        expect(modal).toBeInTheDocument();
        // Create a name for the component
        const testName = "TestName1";
        // Put name into input box
        let input = screen.getByPlaceholderText('Enter a name');
        fireEvent.change(input, {target: {value: testName}});
        // Get the button to be tested
        const saveButton = screen.getByText('Save Changes');
        // Click the button
        fireEvent.click(saveButton);
        // Finds and clicks the gear to access the modal
        fireEvent.click(screen.getByTestId('subfuncOptions'));
        // Grab new modal
        const newModal = screen.getByTestId('subfunc-modal');
        expect(newModal).toBeInTheDocument();
    });
    it('Gets SubFunctionality Component and opens the modal and changes the color', async () => {
        // Ensures we are on the Real World Tab
        await waitFor(() => {
            expect(screen.getAllByRole('tab')[0]).toBeInTheDocument()
        })
        fireEvent.click(screen.getAllByRole('tab')[0]);
        // Gets the party component
        const partyComp = screen.getByText('Subfunctionality');
        // Gets all the features of the page that say Real World
        const dropZone = screen.getByText('Real_Functionality');
        // Begins dragging the Comp and Drops it in the box
        fireEvent.dragStart(partyComp);
        fireEvent.dragEnter(dropZone);
        fireEvent.dragOver(dropZone);
        fireEvent.drop(dropZone);
        // Check the modal opened
        const modal = screen.getByTestId('subfunc-modal');
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
        let originColor = '#8a6996';
        // Get party element in the model
        const subCompText = screen.getByText(testName);
        const subInstance = subCompText.parentElement;
        // Expect original color
        expect(subInstance).toHaveStyle({ 'background-color': originColor })
        // Set the color of the party to be tested
        let testColor = "#db585f"; 
        // Open the modal
        fireEvent.click(screen.getByTestId('subfuncOptions'));
        // Get the color box from the twitter picker
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
        expect(subInstance).toHaveStyle({ 'background-color': testColor });
    });
    it('Gets SubFunctionality Component and checks that the close feature does not modify the component when pressed', async () => {
        // Ensures we are on the Real World Tab
        await waitFor(() => {
            expect(screen.getAllByRole('tab')[0]).toBeInTheDocument()
        })
        fireEvent.click(screen.getAllByRole('tab')[0]);
        // Gets the sub functionality component
        const subFuncComp = screen.getByText('Subfunctionality'); 
        // Gets all the features of the page that say Real World
        const dropZone = screen.getByText('Real_Functionality');
        // Begins dragging the Comp and Drops it in the box
        fireEvent.dragStart(subFuncComp);
        fireEvent.dragEnter(dropZone);
        fireEvent.dragOver(dropZone);
        fireEvent.drop(dropZone);
        // Check that the modal opened
        const modal = screen.getByTestId('subfunc-modal');
        expect(modal).toBeInTheDocument();
        // Create a name for the component
        const testName = "TestName1";
        // Put name into input box
        let input = screen.getByPlaceholderText('Enter a name');
        fireEvent.change(input, {target: {value: testName}});
        // Get the button to be tested
        const testButton = screen.getByText('Close');
        // Click the button
        fireEvent.click(testButton);
        // Check the name should not exist
        const subFuncName = screen.queryByText(testName);
        expect(subFuncName).not.toBeInTheDocument();
        // Finds and clicks the gear to access the modal
        fireEvent.click(screen.getByTestId('subfuncOptions'));
        // Check the modal opened
        const newModal = screen.getByTestId('subfunc-modal');
        expect(newModal).toBeInTheDocument();
    });
    it('Gets SubFunctionality Component and checks that the Ideal Functionality is selectable', async () => {
        // Ensures we are on the Real World Tab
        await waitFor(() => {
            expect(screen.getAllByRole('tab')[0]).toBeInTheDocument()
        })
        fireEvent.click(screen.getAllByRole('tab')[0]);
        // Gets the sub functionality component
        const subFuncComp = screen.getByText('Subfunctionality'); 
        // Gets all the features of the page that say Real World
        const dropZone = screen.getByText('Real_Functionality');
        // Begins dragging the Comp and Drops it in the box
        fireEvent.dragStart(subFuncComp);
        fireEvent.dragEnter(dropZone);
        fireEvent.dragOver(dropZone);
        fireEvent.drop(dropZone);
        // Check that the modal opened
        const modal = screen.getByTestId('subfunc-modal');
        expect(modal).toBeInTheDocument();
        // Click the Select box
        const option = screen.getByDisplayValue('Select an Ideal Functionality');
        expect(option).toBeInTheDocument();
        fireEvent.click(option);
        // Get the sample data
        expect(screen.getByRole('option', {name: 'Select an Ideal Functionality'}).selected).toBe(true);
        // TODO: Add actual dropdown menu testing
    });
});
