import { render, screen, fireEvent, act, cleanup, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../App';
import ModelApp from '../components/modelApp';
import { BrowserRouter, Routes, Route } from "react-router-dom";
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

window.prompt = jest.fn();

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

it('Renders App component', () => {
    render(<Provider store={store}>
        <DndProvider backend={HTML5Backend}>
            <App />
        </DndProvider>
    </Provider>);
});

describe.skip('Checks renders', () => {
    beforeEach(() => {
        render(<DndProvider backend={HTML5Backend}>
                    <Provider store={store}>
                        <BrowserRouter>
                            <Routes>
                                <Route index element={<ModelApp />} />
                                {/* <Route path="model/:id?" element={<ModelApp />} /> */}
                            </Routes>
                        </BrowserRouter>
                    </Provider>
                </DndProvider>);
    });

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

    it('Switches between each tab', async () => { 
        await waitFor(() => {
            expect(screen.getAllByRole('tab')[2]).toBeInTheDocument()
        })       
        fireEvent.click(screen.getAllByRole('tab')[2]); // clicks the Ideal World tab
    
        // makes sure the four tabs have the correct truthiness
        expect(screen.getAllByText('Real World')[0]).toHaveAttribute('aria-selected', 'false');
        expect(screen.getAllByText('Ideal World')[0]).toHaveAttribute('aria-selected', 'true');
        expect(screen.getAllByText('Interfaces')[0]).toHaveAttribute('aria-selected', 'false');
        expect(screen.getAllByText('State Machines')[0]).toHaveAttribute('aria-selected', 'false');
        expect(screen.getAllByText('Code')[0]).toHaveAttribute('aria-selected', 'false');
    
        fireEvent.click(screen.getAllByRole('tab')[1]); // clicks the Real World tab
    
        // makes sure the four tabs have the correct truthiness
        expect(screen.getAllByText('Real World')[0]).toHaveAttribute('aria-selected', 'true');
        expect(screen.getAllByText('Ideal World')[0]).toHaveAttribute('aria-selected', 'false');
        expect(screen.getAllByText('Interfaces')[0]).toHaveAttribute('aria-selected', 'false');
        expect(screen.getAllByText('State Machines')[0]).toHaveAttribute('aria-selected', 'false');
        expect(screen.getAllByText('Code')[0]).toHaveAttribute('aria-selected', 'false');
    
        fireEvent.click(screen.getAllByRole('tab')[3]); // clicks the Interfaces tab
    
        // makes sure the four tabs have the correct truthiness
        expect(screen.getAllByText('Real World')[0]).toHaveAttribute('aria-selected', 'false');
        expect(screen.getAllByText('Ideal World')[0]).toHaveAttribute('aria-selected', 'false');
        expect(screen.getAllByText('Interfaces')[0]).toHaveAttribute('aria-selected', 'true');
        expect(screen.getAllByText('State Machines')[0]).toHaveAttribute('aria-selected', 'false');
        expect(screen.getAllByText('Code')[0]).toHaveAttribute('aria-selected', 'false');

        fireEvent.click(screen.getAllByRole('tab')[4]); // clicks the State Machine tab
    
        // makes sure the four tabs have the correct truthiness
        expect(screen.getAllByText('Real World')[0]).toHaveAttribute('aria-selected', 'false');
        expect(screen.getAllByText('Ideal World')[0]).toHaveAttribute('aria-selected', 'false');
        expect(screen.getAllByText('Interfaces')[0]).toHaveAttribute('aria-selected', 'false');
        expect(screen.getAllByText('State Machines')[0]).toHaveAttribute('aria-selected', 'true');
        expect(screen.getAllByText('Code')[0]).toHaveAttribute('aria-selected', 'false');
    
        fireEvent.click(screen.getAllByRole('tab')[5]); // clicks the Code tab
    
        // makes sure the four tabs have the correct truthiness
        expect(screen.getAllByText('Real World')[0]).toHaveAttribute('aria-selected', 'false');
        expect(screen.getAllByText('Ideal World')[0]).toHaveAttribute('aria-selected', 'false');
        expect(screen.getAllByText('Interfaces')[0]).toHaveAttribute('aria-selected', 'false');
        expect(screen.getAllByText('State Machines')[0]).toHaveAttribute('aria-selected', 'false');
        expect(screen.getAllByText('Code')[0]).toHaveAttribute('aria-selected', 'true');
    });

    it('Checks Real World components renders', async () => {
        await waitFor(() => {
            expect(screen.getByText('UC Components')).toBeInTheDocument();
        })
        expect(screen.getByText('Subfunctionality')).toBeInTheDocument();
        expect(screen.getByText('Party')).toBeInTheDocument();
        expect(screen.getByText('Real_Functionality')).toBeInTheDocument();
        expect(screen.getAllByText('Environment')[0]).toBeInTheDocument();
        expect(screen.getAllByText('Adversary')[0]).toBeInTheDocument();
        
    });

    it('Checks Ideal World components renders', async () => {
        await waitFor(() => {
            expect(screen.getAllByText('Ideal World')[1]).toBeInTheDocument();
        })
        
        expect(screen.getAllByText('IF')[0]).toBeInTheDocument();
        expect(screen.getAllByText('Sim')[0]).toBeInTheDocument();
        expect(screen.getAllByText('Environment')[1]).toBeInTheDocument();
        expect(screen.getAllByText('Adversary')[1]).toBeInTheDocument();
    });

    it('Checks Interfaces renders', async () => {
        await waitFor(() => {
            expect(screen.getByText('Composite Interfaces')).toBeInTheDocument();
        })
        
        expect(screen.getByText('Basic Interfaces')).toBeInTheDocument();

        const addButton = screen.getByRole('button', { name: 'Add Interface', exact: false });
        expect(addButton).toBeInTheDocument();
    });
});
