/* eslint-disable react-hooks/exhaustive-deps */
import './stateMachines.css';
import State from './state';
import React, { useState, useRef, useEffect } from 'react';
import { useDrop } from 'react-dnd';
import './stateMachines.css';
import { useDispatch, useSelector } from 'react-redux';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faGear } from '@fortawesome/free-solid-svg-icons';
import uuid from 'react-uuid';
import { addStateDispatch,
        addToStatesDispatch,
        updateStatePositionDispatch } from '../features/stateMachines/stateMachineSlice';
import ReactFlowBox from './reactFlowBox'

function StateMachineDnD(props) {

    const stateMachineSelector = useSelector((state) => state.stateMachines);
    const thisStateMachineSelector = stateMachineSelector.stateMachines[stateMachineSelector.stateMachines.findIndex(element => element.id === props.component.stateMachine)];
    const interSelector = useSelector((state) => state.interfaces);

    const [renderReactFlow, setRenderReactFlow] = useState(false);

    const dispatch = useDispatch();

    const { subFuncMessages, paramInterMessages, activeKey } = props;

    useEffect(() => {
        if (activeKey === props.component.id) {
            setRenderReactFlow(true);
        } else {
            setRenderReactFlow(false);
        }
    }, [activeKey])

    const [tableIndex, setTableIndex] = useState('');

    const addState = (left, top) => {
        let id = uuid();
        // Adjust positioning for Reactflow box
        let adjustLeft = left - 242;
        let adjustTop = top - 106;
        let newState = {
            "id" : id,
            "name" : "",
            "left" : adjustLeft,
            "top" : adjustTop,
            "color" : "#e3c85b",
            "parameters" : [],
        };

        dispatch(addStateDispatch(newState));
        dispatch(addToStatesDispatch([id, props.component.stateMachine]));
        
    }

    // eslint-disable-next-line no-unused-vars
    const [{ isOver }, drop] = useDrop(() => ({
        accept: ["ucComp"],
        drop(item, monitor) {
            const position = monitor.getClientOffset();
            const sourceCO = monitor.getInitialSourceClientOffset();
            const initialCO = monitor.getInitialClientOffset();
            const left = position.x - (initialCO.x - sourceCO.x);
            const top = position.y - (initialCO.y - sourceCO.y);

            if (item.id) {
                dispatch(updateStatePositionDispatch([item.id, left, top]));
            } else {
                addState(left, top);
            }
        },
        collect: (monitor) => ({
            isOver: !!monitor.isOver(),
        }),
    }));  

    library.add(faGear);

    const handleMouseEnter = (index) => {
        setTableIndex(index);
    };

    const handleMouseLeave = () => {
        setTableIndex('');
    };

    const [tableClick, setTableClick] = useState('');
      
    const handleTableClick = (idx) => {
        setTableClick(idx);
    }

    const tableSearchRef = useRef({});
    const tableRef = useRef({});

    const tableSearch = () => {
        if (tableSearchRef.current && document.getElementById("transitionTable" + props.component.id)) {
            let searchValue = tableSearchRef.current.value.toUpperCase();
            let table = document.getElementById("transitionTable" + props.component.id);
            let rows = table.getElementsByTagName("tr");
            
            for (let i = 1; i < rows.length; i++) {
                let td = rows[i].getElementsByTagName("td")[1];
                if (td) {
                    let txtValue = td.textContent || td.innerText;
                    if (txtValue.toUpperCase().indexOf(searchValue) > -1) {
                        rows[i].style.display = "";
                    } else {
                        rows[i].style.display = "none";
                    }
                }
            }
        }
    }

    const printTransitionName = (transition) => {
        let transitionName = '';
        if (transition.name !== '') {
            transitionName = transition.name;
        } else if (transition.inMessage && transition.outMessage) {
            let inMessage = '';
            if (interSelector.messages.find(element => element.id === transition.inMessage)) {
                inMessage = interSelector.messages.find(element => element.id === transition.inMessage).name;
            } else if (subFuncMessages.find(element => element.id === transition.inMessage)) {
                inMessage = subFuncMessages.find(element => element.id === transition.inMessage).name;
            } else if (paramInterMessages.find(element => element.id === transition.inMessage)) {
                inMessage = paramInterMessages.find(element => element.id === transition.inMessage).name;
            }

            let outMessage = '';
            if (interSelector.messages.find(element => element.id === transition.outMessage)) {
                outMessage = interSelector.messages.find(element => element.id === transition.outMessage).name;
            } else if (subFuncMessages.find(element => element.id === transition.outMessage)) {
                outMessage = subFuncMessages.find(element => element.id === transition.outMessage).name;
            } else if (paramInterMessages.find(element => element.id === transition.outMessage)) {
                outMessage = paramInterMessages.find(element => element.id === transition.outMessage).name;
            }

            transitionName = inMessage + " / " + outMessage;
        } else {
            transitionName = '';
        }

        return transitionName
    }

    return (
        <div className='overall-container' style={{display: 'flex'}}>
            <div className="dB1">
                <div className="stateHeader">
                    <header className="stateTitle">States</header>
                </div>
                <div className="component-holder">
                    <State />
                </div>
            </div>
            <div className='db2'> 
                <div className="sm" ref={drop}>
                    {renderReactFlow && <ReactFlowBox component={props.component} 
                        subFuncMessages={subFuncMessages} paramInterMessages={paramInterMessages}
                        tableClick={tableClick} setTableClick={setTableClick}
                        tableIndex={tableIndex} setTableIndex={setTableIndex} />}
                </div>
            </div>
            <div className='db3'>
                <input type="text" id={"transitionTableSearch" + props.component.id} className="transitionTableSearch" onChange={tableSearch} placeholder="Search for transitions..." ref={tableSearchRef} />
                <table className='transition-table' ref={tableRef} id={'transitionTable' +  props.component.id}>
                    <thead>
                        <tr>
                            <th style={{width: 30}}></th>
                            <th>Transition Name</th>
                            <th>From State</th>
                            <th>To State</th>
                        </tr>
                    </thead>
                    <tbody>
                        {thisStateMachineSelector && 
                            (stateMachineSelector.transitions.filter(value => thisStateMachineSelector.transitions.includes(value.id)).map((transition, idx) => (
                                <tr key={transition.id}  
                                    onMouseEnter={() => handleMouseEnter(idx)}
                                    onMouseLeave={handleMouseLeave}
                                    onClick={() => handleTableClick(idx)}
                                    className={tableIndex === idx ? 'transition-table-hover' : idx % 2 === 0 ? 'transistion-table-even' : 'transition-table-odd'}
                                >
                                    <td style={{fontWeight: 'bold'}}>{idx}</td>
                                    <td>{printTransitionName(transition)}</td>
                                    <td>{transition.fromState && stateMachineSelector.states.find(element => element.id === transition.fromState).name}</td>
                                    <td>{transition.toState && stateMachineSelector.states.find(element => element.id === transition.toState).name}</td>
                                </tr>
                            )))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default StateMachineDnD;
