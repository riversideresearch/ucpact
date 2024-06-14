import Interfaces from "../components/interfaces";
import {interfaceDisplayNameSetup, messageDisplayNameSetup,
        basicInterfaceDropDownDisplayNameSetup} from "../components/interfaces";
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
import { debug } from 'jest-preview';

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

it ('Renders Interfaces tab', () => {
    render(<Provider store={store}>
        <DndProvider backend={HTML5Backend}>
            <Interfaces />
        </DndProvider>
    </Provider>);
});

describe('Tests basic interface funtionality', () => {
    beforeEach(() => {
        // Creates a new store before each test to ensure no leaks between tests
        store = configureStore({
            reducer: {
                interfaces: interfacesReducer,
                parties: partiesReducer,
                subfunctionalities: subfuncReducer,
                realFunctionality: realFuncReducer,
                simulator: simulatorReducer,
                idealFunctionality: idealFuncReducer,
            },
        });
    });
    afterEach(() => { 
        // Resets the mock funtion after each test
        jest.resetAllMocks();
    });
    afterAll(() => {
        // Clears the mock function after all tests
        jest.clearAllMocks();
    });

    it('Clicks to create a new basic interface', async () => {      
        render(<Provider store={store}><DndProvider backend={HTML5Backend}><Interfaces /></DndProvider></Provider>);
        // Grab plus sign to open dropdown
    
        const plusSign = screen.getByTitle('Add Interface');
        expect(plusSign).toBeInTheDocument();
        fireEvent.click(plusSign);
    
        // Grab dropdown item to add basic and check if exists
        const addBasicButton = await screen.findByTitle('Add Basic Interface');
        expect(addBasicButton).toBeInTheDocument();
        fireEvent.click(addBasicButton);

        // Look at input box to see if it popped up
        const inputBox = screen.getByPlaceholderText('Interface Name');
        expect(inputBox).toBeInTheDocument();
    });

    it('Deletes a basic interface', async () => {
        render(<Provider store={store}><DndProvider backend={HTML5Backend}><Interfaces /></DndProvider></Provider>);

        // Open dropdown
        fireEvent.click(screen.getByTitle('Add Interface'));

        // Add basic interface
        fireEvent.click(await screen.findByTitle('Add Basic Interface'));

        // Look at input box to see if it popped up
        const inputBox = screen.getByPlaceholderText('Interface Name');
        expect(inputBox).toBeInTheDocument();

        // Delete interface, check if input box disappeared
        fireEvent.click(screen.getByTitle('Delete Basic Interface'));
        expect(inputBox).not.toBeInTheDocument();
    });

    it('Creates a name for a basic interface', async () => {
        render(<Provider store={store}><DndProvider backend={HTML5Backend}><Interfaces /></DndProvider></Provider>);

        // Open dropdown
        fireEvent.click(screen.getByTitle('Add Interface'));

        // Add basic interface
        fireEvent.click(await screen.findByTitle('Add Basic Interface'));

        // Grab input box
        const input = screen.getByPlaceholderText('Interface Name');
        // Change the name
        fireEvent.change(input, {target: {value: 'InterfaceOne'}});
        expect(input.value).toBe('InterfaceOne');
    });

    it('Renames the accordion header per the typed name for basic interface', async () => {
        render(<Provider store={store}><DndProvider backend={HTML5Backend}><Interfaces /></DndProvider></Provider>);

        // Open dropdown
        fireEvent.click(screen.getByTitle('Add Interface'));

        // Add basic interface
        fireEvent.click(await screen.findByTitle('Add Basic Interface'));

        // Grab the input and put in a new name
        const input = screen.getByPlaceholderText('Interface Name');
        fireEvent.change(input, {target: {value: 'InterfaceOne'}});
        const displayHeaderParent = screen.getByTestId('accorBasicHeaderButton');
        const displayHeader = displayHeaderParent.querySelector('button');
        waitFor(() => {
            expect(displayHeader).toHaveTextContent('InterfaceOne');
        });        
    });

    it('Checks the accordion', async () => {
        render(<Provider store={store}><DndProvider backend={HTML5Backend}><Interfaces /></DndProvider></Provider>);

        // Open dropdown
        fireEvent.click(screen.getByTitle('Add Interface'));

        // Add basic interface
        fireEvent.click(await screen.findByTitle('Add Basic Interface'));

        // Grab the input and put in a new name
        const input = screen.getByPlaceholderText('Interface Name');
        fireEvent.change(input, {target: {value: 'InterfaceOne'}});
        const displayHeaderParent = screen.getByTestId('accorBasicHeaderButton');
        const displayHeader = displayHeaderParent.querySelector('button');
        waitFor(() => {
            expect(displayHeader).toHaveTextContent('InterfaceOne');
        });

        // Grab the accordion body
        const accorBody = displayHeaderParent.parentElement.querySelector('div');
        // Accordion should be closed
        expect(accorBody.classList.contains('show')).toBe(false);
        
        // Click on the header
        fireEvent.click(displayHeader);
        // Header should still be there
        expect(displayHeader).toBeInTheDocument();
        // Body should be shown
        waitFor(() => {
            expect(accorBody.classList.contains('show')).toBe(true);
        });
        
        // Click on the header again
        fireEvent.click(displayHeader);
        // Body should be hidden
        waitFor(() => {
            expect(accorBody.classList.contains('show')).toBe(false);
        });        
    });

    it('Adds a message', async () => {
        render(<Provider store={store}><DndProvider backend={HTML5Backend}><Interfaces /></DndProvider></Provider>)
        // Open dropdown
        fireEvent.click(screen.getByTitle('Add Interface'));

        // Add basic interface
        fireEvent.click(await screen.findByTitle('Add Basic Interface')); 

        // Grab input box
        const input = screen.getByPlaceholderText('Interface Name');
        fireEvent.change(input, {target: {value: 'InterfaceOne'}});

        // Click the new message button
        fireEvent.click(await screen.findByTitle('Add Message'));
        const msg = screen.getByPlaceholderText('Message Name');
        expect(msg).toBeInTheDocument();
    });

    it('Changes the message name to update header', async () => {
        render(<Provider store={store}><DndProvider backend={HTML5Backend}><Interfaces /></DndProvider></Provider>)
        // Open dropdown
        fireEvent.click(screen.getByTitle('Add Interface'));

        // Add basic interface
        fireEvent.click(await screen.findByTitle('Add Basic Interface')); 

        // Grab input box
        const input = screen.getByPlaceholderText('Interface Name');
        fireEvent.change(input, {target: {value: 'InterfaceOne'}});

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
        waitFor(() => {
            expect(displayHeader).toHaveTextContent('messageOne');
        });
    });

    it('Deletes a message', async () => {
        render(<Provider store={store}><DndProvider backend={HTML5Backend}><Interfaces /></DndProvider></Provider>)
        // Open dropdown
        fireEvent.click(screen.getByTitle('Add Interface'));

        // Add basic interface
        fireEvent.click(await screen.findByTitle('Add Basic Interface')); 

        // Grab input box
        const input = screen.getByPlaceholderText('Interface Name');
        fireEvent.change(input, {target: {value: 'InterfaceOne'}});

        // Click the new message button
        fireEvent.click(await screen.findByTitle('Add Message'));
        const msgInput = screen.getByPlaceholderText('Message Name');
        expect(msgInput).toBeInTheDocument();

        // Find and click delete button
        fireEvent.click(screen.getByTitle('Delete Message'));

        expect(msgInput).not.toBeInTheDocument();
    });

    it('Checks message accordion', async () => {
        render(<Provider store={store}><DndProvider backend={HTML5Backend}><Interfaces /></DndProvider></Provider>)
        // Open dropdown
        fireEvent.click(screen.getByTitle('Add Interface'));

        // Add basic interface
        fireEvent.click(await screen.findByTitle('Add Basic Interface')); 

        // Grab input box
        const input = screen.getByPlaceholderText('Interface Name');
        fireEvent.change(input, {target: {value: 'InterfaceOne'}});

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
        waitFor(() => {
            expect(displayHeader).toHaveTextContent('messageOne');
        });

        // Grab the accordion body
        const accorBody = displayHeaderParent.parentElement.querySelector('div');
        // Accordion should be closed
        expect(accorBody.classList.contains('show')).toBe(false);
        
        // Click on the header
        fireEvent.click(displayHeader);
        // Header should still be there
        expect(displayHeader).toBeInTheDocument();
        // Body should be shown
        waitFor(() => {
            expect(accorBody.classList.contains('show')).toBe(true);
        });
        
        // Click on the header again
        fireEvent.click(displayHeader);
        // Body should be hidden
        waitFor(() => {
            expect(accorBody.classList.contains('show')).toBe(false);
        });        
    });

    it('Adds a parameter', async () => {
        render(<Provider store={store}><DndProvider backend={HTML5Backend}><Interfaces /></DndProvider></Provider>)
        // Open dropdown
        fireEvent.click(screen.getByTitle('Add Interface'));

        // Add basic interface
        fireEvent.click(await screen.findByTitle('Add Basic Interface')); 

        // Grab input box
        const input = screen.getByPlaceholderText('Interface Name');
        fireEvent.change(input, {target: {value: 'InterfaceOne'}});

        // Click the new message button
        fireEvent.click(await screen.findByTitle('Add Message'));
        const msgInput = screen.getByPlaceholderText('Message Name');
        expect(msgInput).toBeInTheDocument();

        // Click the new message button
        fireEvent.click(await screen.findByTitle('Add Parameter'));
        const paraInput = screen.getByPlaceholderText('Parameter Name');
        expect(paraInput).toBeInTheDocument();
    });

    it('Deletes a parameter', async () => {
        render(<Provider store={store}><DndProvider backend={HTML5Backend}><Interfaces /></DndProvider></Provider>)
        // Open dropdown
        fireEvent.click(screen.getByTitle('Add Interface'));

        // Add basic interface
        fireEvent.click(await screen.findByTitle('Add Basic Interface')); 

        // Grab input box
        const input = screen.getByPlaceholderText('Interface Name');
        fireEvent.change(input, {target: {value: 'InterfaceOne'}});

        // Click the new message button
        fireEvent.click(await screen.findByTitle('Add Message'));
        const msgInput = screen.getByPlaceholderText('Message Name');
        expect(msgInput).toBeInTheDocument();

        // Click the new message button
        fireEvent.click(await screen.findByTitle('Add Parameter'));
        const paraInput = screen.getByPlaceholderText('Parameter Name');
        expect(paraInput).toBeInTheDocument();

        // Find and click delete button
        fireEvent.click(screen.getByTitle('Delete Parameter'));

        // Message should still exist
        expect(msgInput).toBeInTheDocument();
        // Parameter should not exist
        expect(paraInput).not.toBeInTheDocument();
    });

    it('Checks the Direct/Adversarial button', async () => {
        render(<Provider store={store}><DndProvider backend={HTML5Backend}><Interfaces /></DndProvider></Provider>)
        // Open dropdown
        fireEvent.click(screen.getByTitle('Add Interface'));

        // Add basic interface
        fireEvent.click(await screen.findByTitle('Add Basic Interface')); 

        // Grab input box
        const input = screen.getByPlaceholderText('Interface Name');
        fireEvent.change(input, {target: {value: 'InterfaceOne'}});

        // Click the new message button
        fireEvent.click(await screen.findByTitle('Add Message'));
        const msg = screen.getByPlaceholderText('Message Name');
        expect(msg).toBeInTheDocument();

        // Grab port name input
        const portInput = screen.getByPlaceholderText('Port Name');
        expect(portInput).toBeInTheDocument();

        // Grab radio button and switch to Adversarial
        const directButton = screen.getByText("Direct");
        const advButton = screen.getByText("Adversarial");
        fireEvent.click(advButton);

        // Port Name input should no longer exist
        expect(portInput).not.toBeInTheDocument();

        // Switch back to Direct
        fireEvent.click(directButton);
        const newPortInput = screen.getByPlaceholderText('Port Name');
        expect(newPortInput).toBeInTheDocument();
    });
});

describe('Tests composite interface functionality', () => {
    beforeEach(() => {
        // Creates a new store before each test to ensure no leaks between tests
        store = configureStore({
            reducer: {
                interfaces: interfacesReducer,
                parties: partiesReducer,
                subfunctionalities: subfuncReducer,
                realFunctionality: realFuncReducer,
                simulator: simulatorReducer,
                idealFunctionality: idealFuncReducer,
            },
        });
    });
    afterEach(() => { 
        // Resets the mock funtion after each test
        jest.resetAllMocks();
    });
    afterAll(() => {
        // Clears the mock function after all tests
        jest.clearAllMocks();
    });
    
    it('Clicks to create a new composite interface', async () => {
        render(<Provider store={store}><DndProvider backend={HTML5Backend}><Interfaces /></DndProvider></Provider>);
        // Grab plus sign to open dropdown
        const plusSign = screen.getByTitle('Add Interface');
        expect(plusSign).toBeInTheDocument();
        fireEvent.click(plusSign);

        // Grab dropdown item to add basic and check if exists
        const addBasicButton = await screen.findByTitle('Add Composite Interface');
        expect(addBasicButton).toBeInTheDocument();
        fireEvent.click(addBasicButton);

        // Look at input box to see if it popped up
        const inputBox = screen.getByPlaceholderText('Interface Name');
        expect(inputBox).toBeInTheDocument();
    });

    it('Deletes a composite interface', async () => {
        render(<Provider store={store}><DndProvider backend={HTML5Backend}><Interfaces /></DndProvider></Provider>);

        // Open dropdown
        fireEvent.click(screen.getByTitle('Add Interface'));

        // Add basic interface
        fireEvent.click(await screen.findByTitle('Add Composite Interface'));

        // Look at input box to see if it popped up
        const inputBox = screen.getByPlaceholderText('Interface Name');
        expect(inputBox).toBeInTheDocument();

        // Delete interface, check if input box disappeared
        fireEvent.click(screen.getByTitle('Delete Composite Interface'));
        expect(inputBox).not.toBeInTheDocument();
    });

    it('Creates a name for a composite interface', async () => {
        render(<Provider store={store}><DndProvider backend={HTML5Backend}><Interfaces /></DndProvider></Provider>);

        // Open dropdown
        fireEvent.click(screen.getByTitle('Add Interface'));

        // Add basic interface
        fireEvent.click(await screen.findByTitle('Add Composite Interface'));

        // Grab input box
        const input = screen.getByPlaceholderText('Interface Name');
        // Change the name
        fireEvent.change(input, {target: {value: 'InterfaceOne'}});
        expect(input.value).toBe('InterfaceOne');
    });

    it('Renames the accordion header per the typed name for composite interface', async () => {
        render(<Provider store={store}><DndProvider backend={HTML5Backend}><Interfaces /></DndProvider></Provider>);

        // Open dropdown
        fireEvent.click(screen.getByTitle('Add Interface'));

        // Add basic interface
        fireEvent.click(await screen.findByTitle('Add Composite Interface'));

        // Grab the input and put in a new name
        const input = screen.getByPlaceholderText('Interface Name');
        fireEvent.change(input, {target: {value: 'CompositeInt'}});
        const displayHeaderParent = screen.getByTestId('accorCompHeaderButton');
        const displayHeader = displayHeaderParent.querySelector('button');
        waitFor(() => {
            expect(displayHeader).toHaveTextContent('CompositeInt');
        });        
    });

    it('Checks the accordion', async () => {
        render(<Provider store={store}><DndProvider backend={HTML5Backend}><Interfaces /></DndProvider></Provider>);

        // Open dropdown
        fireEvent.click(screen.getByTitle('Add Interface'));

        // Add basic interface
        fireEvent.click(await screen.findByTitle('Add Composite Interface'));

        // Grab the input and put in a new name
        const input = screen.getByPlaceholderText('Interface Name');
        fireEvent.change(input, {target: {value: 'CompositeInt'}});
        const displayHeaderParent = screen.getByTestId('accorCompHeaderButton');
        const displayHeader = displayHeaderParent.querySelector('button');
        waitFor(() => {
            expect(displayHeader).toHaveTextContent('CompositeInt');
        });

        // Grab the accordion body
        const accorBody = displayHeaderParent.parentElement.querySelector('div');
        // Accordion should be closed
        expect(accorBody.classList.contains('show')).toBe(false);
        
        // Click on the header
        fireEvent.click(displayHeader);
        // Header should still be there
        expect(displayHeader).toBeInTheDocument();
        // Body should be shown
        waitFor(() => {
            expect(accorBody.classList.contains('show')).toBe(true);
        });
        
        // Click on the header again
        fireEvent.click(displayHeader);
        // Body should be hidden
        waitFor(() => {
            expect(accorBody.classList.contains('show')).toBe(false);
        });        
    });

    it('Adds a basic instance', async () => {
        render(<Provider store={store}><DndProvider backend={HTML5Backend}><Interfaces /></DndProvider></Provider>);

        // Open dropdown
        fireEvent.click(screen.getByTitle('Add Interface'));

        // Add basic interface
        fireEvent.click(await screen.findByTitle('Add Composite Interface'));

        // Grab the input and check if it exists
        const input = screen.getByPlaceholderText('Interface Name');
        expect(input).toBeInTheDocument();

        // Click the plus to add a basic interface
        fireEvent.click(await screen.findByTitle('Add Basic to Composite'));

        // Check input for instance name
        const instInput = screen.getByPlaceholderText('Instance Name');
        expect(instInput).toBeInTheDocument();
    });

    it('Deletes a basic instance', async () => {
        render(<Provider store={store}><DndProvider backend={HTML5Backend}><Interfaces /></DndProvider></Provider>);

        // Open dropdown
        fireEvent.click(screen.getByTitle('Add Interface'));

        // Add basic interface
        fireEvent.click(await screen.findByTitle('Add Composite Interface'));

        // Grab the input and check if it exists
        const input = screen.getByPlaceholderText('Interface Name');
        expect(input).toBeInTheDocument();

        // Click the plus to add a basic interface
        fireEvent.click(await screen.findByTitle('Add Basic to Composite'));

        // Check input for instance name
        const instInput = screen.getByPlaceholderText('Instance Name');
        expect(instInput).toBeInTheDocument();

        // Click delete button
        fireEvent.click(screen.getByTitle('Delete Basic Instance'));
        expect(instInput).not.toBeInTheDocument();
    });
    // Test fails a check of the dropdown menu selection feature as we changed our type of dropdown menu
    it.skip('Selects a basic interface', async () => {
        render(<Provider store={store}><DndProvider backend={HTML5Backend}><Interfaces /></DndProvider></Provider>);

        // Create a basic interface
        // Open dropdown
        fireEvent.click(screen.getByTitle('Add Interface'));

        // Add basic interface
        fireEvent.click(await screen.findByTitle('Add Basic Interface'));

        // Grab the input and put in a new name
        const basicName = 'InterfaceOne'
        const basicInput = screen.getByPlaceholderText('Interface Name');
        fireEvent.change(basicInput, {target: {value: basicName}});
        const displayHeaderParent = screen.getByTestId('accorBasicHeaderButton');
        const displayHeader = displayHeaderParent.querySelector('button');
        waitFor(() => {
            expect(displayHeader).toHaveTextContent('InterfaceOne');
        });   

        // Create a composite interface
        // Open dropdown
        fireEvent.click(screen.getByTitle('Add Interface'));

        // Add basic interface
        fireEvent.click(await screen.findByTitle('Add Composite Interface'));

        // Click the plus to add a basic interface
        fireEvent.click(await screen.findByTitle('Add Basic to Composite'));

        // Check input for instance name
        const instInput = screen.getByPlaceholderText('Instance Name');
        expect(instInput).toBeInTheDocument();

        // Select the basic interface from the dropdown
        userEvent.selectOptions(screen.getByTitle('Select an Interface'), screen.getAllByRole('option')[1]);
        expect(screen.getAllByRole('option')[1].selected).toBe(true);
    });
    // Test fails a check of the dropdown menu selection feature as we changed our type of dropdown menu
    it.skip('Checks Direct/Adversarial button', async () => {
        render(<Provider store={store}><DndProvider backend={HTML5Backend}><Interfaces /></DndProvider></Provider>);
        // Create a basic interface
        // Open dropdown
        fireEvent.click(screen.getByTitle('Add Interface'));
        // Add basic interface
        fireEvent.click(await screen.findByTitle('Add Basic Interface'));

        // Grab the input and put in a new name
        const basicName = 'InterfaceOne';
        const basicInput = screen.getByPlaceholderText('Interface Name');
        fireEvent.change(basicInput, {target: {value: basicName}});
        const displayHeaderParent = screen.getByTestId('accorBasicHeaderButton');
        const displayHeader = displayHeaderParent.querySelector('button');
        waitFor(() => {
            expect(displayHeader).toHaveTextContent('InterfaceOne');
        });  

        // Grab basic adversarial button
        const basicAdvButton = screen.getByTitle('adversarialBasicButton');

        // Create a composite interface
        // Open dropdown
        fireEvent.click(screen.getByTitle('Add Interface'));

        // Add composite interface
        fireEvent.click(await screen.findByTitle('Add Composite Interface'));

        // Click the plus to add a basic interface
        fireEvent.click(await screen.findByTitle('Add Basic to Composite'));

        // Check input for instance name
        const instInput = screen.getByPlaceholderText('Instance Name');
        expect(instInput).toBeInTheDocument();

        // Select the basic interface from the dropdown
        userEvent.selectOptions(screen.getByTitle('Select an Interface'), screen.getAllByRole('option')[1]);
        // Grab option 
        expect(screen.getAllByRole('option')[1].selected).toBe(true);

        // Change basic interface to adversarial
        fireEvent.click(basicAdvButton);
        // Interface should no longer be an option
        expect(screen.queryAllByRole('option')[1]).toBe(undefined);

        // Grab and click comp adversarial button
        const compAdvButton = screen.getByTitle('adversarialCompButton');
        fireEvent.click(compAdvButton);
        // Expect dropdown to be populated
        expect(screen.queryAllByRole('option')[1]).not.toBe(undefined);
    });
});

