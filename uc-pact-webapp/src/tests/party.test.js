import '@testing-library/jest-dom';
import { render, screen, act, fireEvent, cleanup, waitFor } from '@testing-library/react';
import Party from "../components/party";
import App from '../App';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import interfacesReducer, { interfacesSlice } from '../features/interfaces/interfacesSlice';
import partiesReducer, { partiesSlice } from '../features/parties/partiesSlice';
import subfuncReducer from '../features/subfunctionalities/subfuncSlice';
import realFuncReducer, { realFuncSlice } from '../features/realFunctionalities/realFuncSlice';
import simulatorReducer from '../features/simulators/simulatorSlice';
import idealFuncReducer from '../features/idealFunctionalities/idealFuncSlice';
import stateMachineReducer from '../features/stateMachines/stateMachineSlice';
import modelReducer from '../features/model/modelSlice';
import userEvent from '@testing-library/user-event';

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

it('Renders Party component', () => {
    render(<Provider store={store}>
        <DndProvider backend={HTML5Backend}>
            <Party />
        </DndProvider>
    </Provider>);
});

//TODO: ALL tests below need to add redux and Backend expect statments to ensure accuracy
describe.skip('Perform tests on the Party Component', () => {
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
        // Add the composite interfaces to the Real functionality with both
        // the adversarial and the direct composite interfaces.
        let updatedValue = {
            "name": "Real_Functionality",
            "compositeAdversarialInterface": interCompId2,
            "compositeDirectInterface": interCompId1,
            "parties": "",
            "subfunctionalities": "",
        };
        
        act(() => {
            store.dispatch(realFuncSlice.actions.changeRealfuncDispatch(updatedValue));
        });   
        
        //fireEvent.click(screen.getByTestId("realFuncOptions"))
        //debug();
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
    it('Gets Party Component and checks to drag to the Real world',async () => {
        // Ensures we are on the Real World Tab
        await waitFor(() => {
            expect(screen.getAllByRole('tab')[0]).toBeInTheDocument()
        })
        fireEvent.click(screen.getAllByRole('tab')[0]);
        // Checks if modal is hidden originally
        const modal = screen.queryByTestId('party-modal');
        expect(modal).not.toBeInTheDocument();
        // Gets the party component
        const partyComp = screen.getByText('Party');
        //Gets all the features of the page that say Real World
        const dropZoneArray = screen.getByText('Real_Functionality');
        // Targets the Drop Box of the Real world dropZoneArray[0] is the Tab
        const dropZone = dropZoneArray;
        // Begins dragging the Comp and Drops it in the box
        fireEvent.dragStart(partyComp);
        fireEvent.dragEnter(dropZone);
        fireEvent.dragOver(dropZone);
        fireEvent.drop(dropZone);
        // Grabs the modal
        const poppedModal = screen.getByTestId('party-modal');
        // Checks if it is in the document
        expect(poppedModal).toBeInTheDocument();
    });
    it('Gets Party Component and checks modal delete button', async () => {
        // Ensures we are on the Real World Tab
        await waitFor(() => {
            expect(screen.getAllByRole('tab')[0]).toBeInTheDocument()
        })
        fireEvent.click(screen.getAllByRole('tab')[0]);
        // Gets the party component
        const partyComp = screen.getByText('Party');
        // Gets all the features of the page that say Real World
        const dropZoneArray = screen.getByText('Real_Functionality');
        // Targets the Drop Box of the Real world dropZoneArray[0] is the Tab
        const dropZone = dropZoneArray;
        // Begins dragging the Comp and Drops it in the box
        fireEvent.dragStart(partyComp);
        fireEvent.dragEnter(dropZone);
        fireEvent.dragOver(dropZone);
        fireEvent.drop(dropZone);
        // Grabs the modal
        const modal = screen.getByTestId('party-modal');
        // Checks if it is in the document
        expect(modal).toBeInTheDocument();
        // Get Party Instance
        //const partyInstance = screen.g
        // Get the button to be tested
        const deleteButton = screen.getByText('Delete');
        // Click the button
        fireEvent.click(deleteButton);
        // Modal should close
        expect(modal).not.toBeInTheDocument();
        // Grab real world div
        const realWorld = screen.getByText('Real_Functionality').parentElement.parentElement;
        // Grab real world children count
        const count = realWorld.childElementCount;
        // Party should not exist (count should be 2: header and environment)
        expect(count).toEqual(2);
    });
    it('Gets Party Component and checks that save changes button works', async () => {
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
    });
    it('Gets Party Component and checks that gear is clickable and opens the modal', async () => {
        // Ensures we are on the Real World Tab
        await waitFor(() => {
            expect(screen.getAllByRole('tab')[0]).toBeInTheDocument()
        })
        fireEvent.click(screen.getAllByRole('tab')[0]);
        // Gets the party component
        const partyComp = screen.getByText('Party');
        // Gets all the features of the page that say Real Functionality
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
        // click the button
        fireEvent.click(testButton);
        // Check the component was renamed
        const testComp = screen.getAllByText(testName)[0];
        // Finds and clicks the gear to access the modal
        fireEvent.click(screen.getByTestId('partyOptions'));
        // Check the modal opened
        expect(screen.getByText('Configure TestName1')).toBeInTheDocument();
        expect(testComp).toBeInTheDocument();
    });
    it('Gets Party Component and opens the modal to change the color', async  () => {
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
        // Check the modal opened
        const modal = screen.getByTestId('party-modal');
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
        let originColor = '#c4dd88';
        // Get party element in the model
        const partyText = screen.getAllByText(testName)[0];
        const partyInstance = partyText.parentElement;
        // Expect original color
        expect(partyInstance).toHaveStyle({ 'background-color': originColor })
        // Set the color of the party to be tested
        let testColor = "#e3c85b"; 
        // Open the modal
        fireEvent.click(screen.getByTestId('partyOptions'));
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
        expect(partyInstance).toHaveStyle({ 'background-color': testColor });
    });
    it ('Gets Party Component and checks that the close feature does not modify the component when pressed', async () => {
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
        const testButton = screen.getByText('Close');
        // Click the button
        fireEvent.click(testButton);
        // Finds and clicks the gear to access the modal
        fireEvent.click(screen.getByTestId('partyOptions'));
        // Check the modal opened
        const modal = screen.getByTestId('party-modal');
        expect(modal).toBeInTheDocument();
        // Check that party name does not exist
        const partyInstance = screen.queryByText(testName);
        expect(partyInstance).not.toBeInTheDocument();
    });
    it('Gets Party Component and checks that Basic Direct Interface is selectable', async () => {
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
        // Click the Select box
        // Name should be instance name (not interface name)
        userEvent.selectOptions(screen.getByTitle('partyDirSelector'), screen.getByRole('option', {name: 'DirectInstance1'}));
        // debug();
        expect(screen.getByRole('option', {name: 'DirectInstance1'}).selected).toBe(true);
    });
    it('Gets Party Component and checks that Basic Adversarial Interface is selectable', async () => {
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
        // Click the Select box
        // Name should be instance name (not interface name)
        userEvent.selectOptions(screen.getByTitle('partyAdvSelector'), screen.getByRole('option', {name: 'AdvInstance1'}));
        // debug();
        expect(screen.getByRole('option', {name: 'AdvInstance1'}).selected).toBe(true);
    });
    
    // TODO
    // Fix the below test case. Currently errors due to an unknown bug when trying to manually create a party
    it.skip('Checks that Xarrows render when assigning interfaces to parties', async () => {
        // Ensures we are on the Real World Tab
        await waitFor(() => {
            expect(screen.getAllByRole('tab')[0]).toBeInTheDocument()
        })
        fireEvent.click(screen.getAllByRole('tab')[0]);
        
        // Create composite interface IDs locally to be put into real functionality
        let interCompId1 = 1000;
        let interCompId2 = 1001;

        // Add the composite interfaces to the Real functionality with both
        // the adversarial and the direct composite interfaces.
        let updatedValue = {
            "name": "Real_Functionality",
            "compositeAdversarialInterface": interCompId2,
            "compositeDirectInterface": interCompId1,
            "parties": "",
            "subfunctionalities": "",
        };
        
        act(() => {
            store.dispatch(realFuncSlice.actions.changeRealfuncDispatch(updatedValue));
        });

        // Gets the party component
        const partyComp = screen.getByText('Party');
        // Gets the real functionality zone
        const dropZone = screen.getByText('Real_Functionality');
        // Begins dragging the Comp and Drops it in the box
        fireEvent.dragStart(partyComp);
        fireEvent.dragEnter(dropZone);
        fireEvent.dragOver(dropZone);
        fireEvent.drop(dropZone);

        let interBasicId1 = "10";
        let interBasicId2 = "11";

        // Get the close button
        const closeButton = screen.getByText('Close');
        // Click close button
        fireEvent.click(closeButton);

        
        
        let updatedPartyValue = {
            "id": store.getState().parties.parties[0].id,
            "basicAdversarialInterface": interBasicId2,
            "basicDirectInterface": interBasicId1,
        };

        act(() => {
            store.dispatch(partiesSlice.actions.changePartyDispatch(updatedPartyValue));
        });

        // Check that Xarrows rendered
        const dirArrow = screen.getByTestId('partyDirectArrow');
        const advArrow = screen.getByTestId('partyAdversarialArrow');
        expect(dirArrow).toBeInTheDocument();
        expect(advArrow).toBeInTheDocument();
    });
});
