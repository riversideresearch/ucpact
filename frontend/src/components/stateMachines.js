import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import React, { useEffect, useState } from 'react';
import './stateMachines.css';
import StateMachinePage from './stateMachineDnD';
import { useSelector } from 'react-redux';

function StateMachines(props) {
    const partySelector = useSelector((state) => state.parties) // Redux selector for parties
    const simSelector = useSelector((state) => state.simulator) // Redux selector for simulator
    const idealFuncSelector = useSelector((state) => state.idealFunctionality) // Redux selector for ideal functionality

    const [key, setKey] = useState();
    const [defaultKey, setDefaultKey] = useState(idealFuncSelector.id);

    useEffect(() => {
       if (partySelector && partySelector.parties.length > 0) {
            setDefaultKey(partySelector.parties[0].id)
       } else {
            setDefaultKey(idealFuncSelector.id)
       }
    }, []);

    useEffect(() => {
        setKey(defaultKey);
    }, [defaultKey])

    return (
        <Tabs fill className="stateMachineSubTabs"
            activeKey={key}
            onSelect={(k) => setKey(k)}
            defaultActiveKey={defaultKey}
        >
            {partySelector.parties.map((party) => (
                <Tab eventKey={party.id} title={party.name} key={party.id}>
                    { party.stateMachine && (<StateMachinePage component={party} subFuncMessages={props.subFuncMessages} paramInterMessages={props.paramInterMessages} activeKey={key} />) }
                </Tab>
            ))}
            <Tab eventKey={idealFuncSelector.id} title={idealFuncSelector.name} key={"idealFuncSMTab"}> 
                { idealFuncSelector.stateMachine && (<StateMachinePage component={idealFuncSelector} subFuncMessages={props.subFuncMessages} paramInterMessages={props.paramInterMessages} activeKey={key} />) }  
            </Tab>
            <Tab eventKey={simSelector.id} title={simSelector.name} key={"simStateMachineTab"}>
                { simSelector.stateMachine && (<StateMachinePage component={simSelector} subFuncMessages={props.subFuncMessages} paramInterMessages={props.paramInterMessages} activeKey={key} />) }
            </Tab>
        </Tabs>
    );
}

export default StateMachines;
