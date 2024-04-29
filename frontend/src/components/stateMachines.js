import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import React from 'react';
import './stateMachines.css';
import StateMachinePage from './stateMachineDnD';
import { useSelector } from 'react-redux';
import { useXarrow } from 'react-xarrows';

function StateMachines(props) {
    const partySelector = useSelector((state) => state.parties) // Redux selector for parties
    const simSelector = useSelector((state) => state.simulator) // Redux selector for simulator
    const idealFuncSelector = useSelector((state) => state.idealFunctionality) // Redux selector for ideal functionality
    const updateXarrow = useXarrow();

    return (
        <Tabs fill className="stateMachineSubTabs"
            onSelect={(k) => {
            // need to update the arrows
            updateXarrow();
            }}
        >
            {partySelector.parties.map((party) => (
                <Tab eventKey={party.id} title={party.name} key={party.id}>
                    { party.stateMachine && (<StateMachinePage component={party} subFuncMessages={props.subFuncMessages} paramInterMessages={props.paramInterMessages} />) }
                </Tab>
            ))}
            <Tab eventKey={idealFuncSelector.id} title={idealFuncSelector.name} key={"idealFuncSMTab"}> 
                { idealFuncSelector.stateMachine && (<StateMachinePage component={idealFuncSelector} subFuncMessages={props.subFuncMessages} paramInterMessages={props.paramInterMessages} />) }       
                  
            </Tab>
            <Tab eventKey={simSelector.id} title={simSelector.name} key={"simStateMachineTab"}>
                { simSelector.stateMachine && (<StateMachinePage component={simSelector} subFuncMessages={props.subFuncMessages} paramInterMessages={props.paramInterMessages} />) }
            </Tab>
        </Tabs>
    );
}

export default StateMachines;
