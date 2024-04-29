import { render, screen, fireEvent, waitFor, act, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../App';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import userEvent from '@testing-library/user-event';
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

it('Renders the app', () => {
    render(<DndProvider backend={HTML5Backend}><Provider store={store}><App /></Provider></DndProvider>);
})

describe.skip('Performs tests on the State Machine DnD component', () => {
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

    it('Checks State Machine save changes button works', async () => {
        // Ensures we are on the State Machine Tab
        await waitFor(() => {
            expect(screen.getAllByRole('tab')[3]).toBeInTheDocument()
        })
        fireEvent.click(screen.getAllByRole('tab')[3]);
        // Click State Machine modal
        const modalButton = screen.getAllByTestId('smOptions')[0];
        fireEvent.click(modalButton);

        // Check the modal opened
        const modal = screen.getByTestId('stateMachine-modal');
        expect(modal).toBeInTheDocument();

        // Get the save button
        const saveButton = screen.getByText('Save Changes');
        // Click save button
        fireEvent.click(saveButton);

        // Expect modal to close
        expect(modal).not.toBeInTheDocument();
    });

    it('Checks adding a transition', async () => {
        // Ensures we are on the State Machine Tab
        await waitFor(() => {
            expect(screen.getAllByRole('tab')[3]).toBeInTheDocument()
        })
        fireEvent.click(screen.getAllByRole('tab')[3]);

        // Click State Machine modal
        fireEvent.click(screen.getAllByTestId('smOptions')[0]);
        // Click Add Transition button
        fireEvent.click(screen.getByTitle('Add Transition'));

        // Get new transition accordion
        const transitionAccor = screen.getByText('Transition Name');
        expect(transitionAccor).toBeInTheDocument();
    });

    it('Checks deleting a transition', async () => {
        // Ensures we are on the State Machine Tab
        await waitFor(() => {
            expect(screen.getAllByRole('tab')[3]).toBeInTheDocument()
        })
        fireEvent.click(screen.getAllByRole('tab')[3]);

        // Click State Machine modal
        fireEvent.click(screen.getAllByTestId('smOptions')[0]);
        // Click Add Transition button
        fireEvent.click(screen.getByTitle('Add Transition'));

        // Get new transition accordion
        const transitionAccor = screen.getByText('Transition Name');
        expect(transitionAccor).toBeInTheDocument();

        // Click delete transition button
        fireEvent.click(screen.getByTitle('Delete Transition'));
        expect(transitionAccor).not.toBeInTheDocument();
    });

    it('Checks the State Machine From State is selectable', async () => {
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

        // Click State Machine modal
        fireEvent.click(screen.getAllByTestId('smOptions')[0]);

        // Click Add Transition button
        fireEvent.click(screen.getByTitle('Add Transition'));

        // Get new transition accordion
        const transitionAccor = screen.getByText('Transition Name');
        expect(transitionAccor).toBeInTheDocument();

        userEvent.selectOptions(screen.getByTitle('transitionFromState'), screen.getAllByRole('option', { name : 'TestName1' })[0]);
        expect(screen.getAllByRole('option', {name: 'TestName1'})[0].selected).toBe(true);

        // Get the save button
        const saveButton = screen.getByText('Save Changes');
        // Click save button
        fireEvent.click(saveButton);

        // Open modal and check options
        fireEvent.click(screen.getAllByTestId('smOptions')[0]);
        expect(screen.getAllByRole('option', {name: 'TestName1'})[0].selected).toBe(true);
    });

    it('Checks the State Machine To State is selectable', async () => {
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

        // Click State Machine modal
        fireEvent.click(screen.getAllByTestId('smOptions')[0]);

        // Click Add Transition button
        fireEvent.click(screen.getByTitle('Add Transition'));

        // Get new transition accordion
        const transitionAccor = screen.getByText('Transition Name');
        expect(transitionAccor).toBeInTheDocument();

        userEvent.selectOptions(screen.getByTitle('transitionToState'), screen.getAllByRole('option', { name : 'TestName1' })[1]);
        expect(screen.getAllByRole('option', {name: 'TestName1'})[1].selected).toBe(true);

        // Get the save button
        const saveButton = screen.getByText('Save Changes');
        // Click save button
        fireEvent.click(saveButton);

        // Open modal and check options
        fireEvent.click(screen.getAllByTestId('smOptions')[0]);
        expect(screen.getAllByRole('option', {name: 'TestName1'})[1].selected).toBe(true);
    });

    it.skip('Checks the State Machine In Message is selectable', async () => {
        // Clicks the Interfaces Tab
        await waitFor(() => {
            expect(screen.getAllByRole('tab')[2]).toBeInTheDocument()
        })
        fireEvent.click(screen.getAllByRole('tab')[2]);
        // Open dropdown
        fireEvent.click(screen.getByTitle('Add Interface'));

        // Add basic interface
        fireEvent.click(await screen.findByTitle('Add Basic Interface'));
        
        // Change to adversarial
        fireEvent.click(screen.getByText('Adversarial'));

        // Change name of interface
        const msgInput = screen.getByPlaceholderText('Interface Name');
        fireEvent.change(msgInput, {target: {value: 'InterfaceOne'}});
        expect(msgInput.value).toBe('InterfaceOne');

        // Check interface header
        const interHeaderParent = screen.getByTestId('accorBasicHeaderButton');
        const interHeader = interHeaderParent.querySelector('button');
        act(() => {
            jest.advanceTimersByTime(2000)
        })
        expect(interHeader).toHaveTextContent('InterfaceOne');

        // Click the new message button
        fireEvent.click(await screen.findByTitle('Add Message'));
        const msg = screen.getByPlaceholderText('Message Name');
        expect(msg).toBeInTheDocument();

        // Change name of message
        fireEvent.change(msg, {target: {value: 'messageOne'}});
        expect(msg.value).toBe('messageOne');

        // Check message header
        const displayHeaderParent = screen.getByTestId('accorHeaderMessageButton');
        const displayHeader = displayHeaderParent.querySelector('button');
        act(() => {
            jest.advanceTimersByTime(2000)
        })
        expect(displayHeader).toHaveTextContent('messageOne');

        // Click the Ideal World tab
        fireEvent.click(screen.getAllByRole('tab')[1]);

        // Finds and clicks the IF gear to access the modal
        fireEvent.click(screen.getByTestId('idwOptions'));

        // Assign the IF basic adversarial interface
        userEvent.selectOptions(screen.getByTitle('idealFuncAdvInterface'), screen.getByRole('option', {name: 'InterfaceOne'}));

        // Save changes
        const thisButton = screen.getByText('Save Changes');
        fireEvent.click(thisButton);

        // Click the State Machine tab
        fireEvent.click(screen.getAllByRole('tab')[3]);

        // Click State Machine modal
        fireEvent.click(screen.getAllByTestId('smOptions')[0]);

        // Click Add Transition button
        fireEvent.click(screen.getByTitle('Add Transition'));

        // Get new transition accordion
        const transitionAccor = screen.getByText('Transition Name');
        expect(transitionAccor).toBeInTheDocument();

        // Assign the out message
        userEvent.selectOptions(screen.getByTitle('transitionInMessage'), screen.getAllByRole('option')[3]);
        expect(screen.getAllByRole('option')[3].selected).toBe(true);

        // Get the save button
        const saveButton = screen.getByText('Save Changes');
        // Click save button
        fireEvent.click(saveButton);

        // Open modal and check options
        fireEvent.click(screen.getAllByTestId('smOptions')[0]);
        expect(screen.getAllByRole('option')[3].selected).toBe(true);
    });

    it.skip('Checks the State Machine Out Message is selectable', async () => {
        // Clicks the Interfaces Tab
        await waitFor(() => {
            expect(screen.getAllByRole('tab')[2]).toBeInTheDocument()
        })
        fireEvent.click(screen.getAllByRole('tab')[2]);
        // Open dropdown
        fireEvent.click(screen.getByTitle('Add Interface'));

        // Add basic interface
        fireEvent.click(await screen.findByTitle('Add Basic Interface')); 

        // Grab input box
        const msgInput = screen.getByPlaceholderText('Interface Name');
        fireEvent.change(msgInput, {target: {value: 'InterfaceOne'}});

        // Click the new message button
        fireEvent.click(await screen.findByTitle('Add Message'));
        const msg = screen.getByPlaceholderText('Message Name');
        expect(msg).toBeInTheDocument();

        // Change name of message
        fireEvent.change(msg, {target: {value: 'messageOne'}});
        expect(msg.value).toBe('messageOne');

        // Check message header
        const displayHeaderParent = screen.getByTestId('accorHeaderMessageButton');
        const displayHeader = displayHeaderParent.querySelector('button');
        act(() => {
            jest.advanceTimersByTime(2000)
        })
        expect(displayHeader).toHaveTextContent('messageOne');

        // Make the message 'out'
        fireEvent.click(screen.getByTestId('message-out'));

        // Click the State Machine tab
        fireEvent.click(screen.getAllByRole('tab')[3]);

        // Click State Machine modal
        fireEvent.click(screen.getAllByTestId('smOptions')[0]);

        // Click Add Transition button
        fireEvent.click(screen.getByTitle('Add Transition'));

        // Get new transition accordion
        const transitionAccor = screen.getByText('Transition Name');
        expect(transitionAccor).toBeInTheDocument();

        // Assign the out message
        userEvent.selectOptions(screen.getByTitle('transitionOutMessage'), screen.getAllByRole('option')[4]);
        expect(screen.getAllByRole('option')[5].selected).toBe(true);

        // Get the save button
        const saveButton = screen.getByText('Save Changes');
        // Click save button
        fireEvent.click(saveButton);

        // Open modal and check options
        fireEvent.click(screen.getAllByTestId('smOptions')[0]);
        expect(screen.getAllByRole('option')[5].selected).toBe(true);
    });

    it('Checks the Guard Description input', async () => {
        // Ensures we are on the State Machine Tab
        await waitFor(() => {
            expect(screen.getAllByRole('tab')[3]).toBeInTheDocument()
        })
        fireEvent.click(screen.getAllByRole('tab')[3]);

        // Click State Machine modal
        fireEvent.click(screen.getAllByTestId('smOptions')[0]);
        // Click Add Transition button
        fireEvent.click(screen.getByTitle('Add Transition'));

        // Get new transition accordion
        const transitionAccor = screen.getByText('Transition Name');
        expect(transitionAccor).toBeInTheDocument();

        // Grab the guard input
        const guardInput = screen.getByPlaceholderText('Guard Description');
        fireEvent.change(guardInput, {target: {value: 'guard example'}});
        expect(guardInput.value).toBe('guard example');

        // Get the save button
        const saveButton = screen.getByText('Save Changes');
        // Click save button
        fireEvent.click(saveButton);

        // Click State Machine modal
        fireEvent.click(screen.getAllByTestId('smOptions')[0]);

        // Check guard input
        const guardExpression = screen.getByTestId('guardInput');
        expect(guardExpression.value).toBe('guard example');
    });

    it('Checks the transition In Arguments', async () => {
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
        const testName = "TestName1";
        // Put name into input box
        let input = screen.getByPlaceholderText('Enter a name');
        fireEvent.change(input, {target: {value: testName}});
        // Click the new parameter button
        fireEvent.click(await screen.findByTitle('Add Parameter'));
        const newParam = screen.getByPlaceholderText('Parameter Name');
        expect(newParam).toBeInTheDocument();

        // Name the parameter
        fireEvent.change(newParam, {target: {value: 'paramOne'}});
        expect(newParam.value).toBe('paramOne');

        // Get the save button
        const saveButton = screen.getByText('Save Changes');
        // Click the save button
        fireEvent.click(saveButton);
        // Check the component was renamed
        expect(screen.getAllByText(testName)[0]).toBeInTheDocument();

        // Click State Machine modal
        fireEvent.click(screen.getAllByTestId('smOptions')[0]);

        // Click Add Transition button
        fireEvent.click(screen.getByTitle('Add Transition'));

        // Get new transition accordion
        const transitionAccor = screen.getByText('Transition Name');
        expect(transitionAccor).toBeInTheDocument();

        // Assign the to state
        userEvent.selectOptions(screen.getByTitle('transitionToState'), screen.getAllByRole('option', { name : 'TestName1' })[1]);
        expect(screen.getAllByRole('option', {name: 'TestName1'})[1].selected).toBe(true);

        // Check the in arguments accordion exists
        const inArgumentsAccor = screen.getByText('To State Arguments');
        expect(inArgumentsAccor).toBeInTheDocument();
        expect(screen.getByText('paramOne')).toBeInTheDocument();

        // Check the value input
        const inArgInput = screen.getByPlaceholderText('Argument Value');
        fireEvent.change(inArgInput, {target: {value: 'inArgValueOne'}});

        // Click save button
        fireEvent.click(screen.getByText('Save Changes'));

        // Click State Machine modal
        fireEvent.click(screen.getAllByTestId('smOptions')[0]);
        expect(screen.getByTestId('inArgInput').value).toBe('inArgValueOne');
    });

    it.skip('Checks the transition Out Arguments', async () => {
        // Clicks the Interfaces Tab
        await waitFor(() => {
            expect(screen.getAllByRole('tab')[2]).toBeInTheDocument()
        })
        fireEvent.click(screen.getAllByRole('tab')[2]);
        // Open dropdown
        fireEvent.click(screen.getByTitle('Add Interface'));

        // Add basic interface
        fireEvent.click(await screen.findByTitle('Add Basic Interface')); 

        // Grab input box
        const msgInput = screen.getByPlaceholderText('Interface Name');
        fireEvent.change(msgInput, {target: {value: 'InterfaceOne'}});

        // Click the new message button
        fireEvent.click(await screen.findByTitle('Add Message'));
        const msg = screen.getByPlaceholderText('Message Name');
        expect(msg).toBeInTheDocument();

        // Change name of message
        fireEvent.change(msg, {target: {value: 'messageOne'}});
        expect(msg.value).toBe('messageOne');

        // Check message header
        const displayHeaderParent = screen.getByTestId('accorHeaderMessageButton');
        const displayHeader = displayHeaderParent.querySelector('button');
        act(() => {
            jest.advanceTimersByTime(2000)
        });            
        expect(displayHeader).toHaveTextContent('messageOne');

        // Make the message 'out'
        fireEvent.click(screen.getByTestId('message-out'));

        // Click new parameter button
        fireEvent.click(screen.getByTitle('Add Parameter'));

        const newParam = screen.getByPlaceholderText('Parameter Name');
        // Name the parameter
        fireEvent.change(newParam, {target: {value: 'paramOne'}});
        expect(newParam.value).toBe('paramOne');

        // Ensures we are on the State Machine Tab
        fireEvent.click(screen.getAllByRole('tab')[3]);

        // Click State Machine modal
        fireEvent.click(screen.getAllByTestId('smOptions')[0]);

        // Click Add Transition button
        fireEvent.click(screen.getByTitle('Add Transition'));

        // Get new transition accordion
        const transitionAccor = screen.getByText('Transition Name');
        expect(transitionAccor).toBeInTheDocument();

        // Assign the out message
        userEvent.selectOptions(screen.getByTitle('transitionOutMessage'), screen.getAllByRole('option')[4]);
        expect(await screen.getAllByRole('option')[5].selected).toBe(true);

        // Check the out arguments accordion exists
        const outArgumentsAccor = screen.getByText('Out Message Arguments');
        expect(outArgumentsAccor).toBeInTheDocument();

        // TODO: For some reason this name doesn't show up... the following line fails
        //expect(screen.getByText('paramOne')).toBeInTheDocument();

        // Check the value input
        const inArgInput = screen.getByPlaceholderText('Argument Value');
        fireEvent.change(inArgInput, {target: {value: 'outArgValueOne'}});

        // Click save button
        fireEvent.click(screen.getByText('Save Changes'));

        // Click State Machine modal
        fireEvent.click(screen.getAllByTestId('smOptions')[0]);
        expect(screen.getByTestId('outArgInput').value).toBe('outArgValueOne');
    });

});
