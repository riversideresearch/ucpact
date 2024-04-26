import React, { useState } from 'react';
import './simulator.css'
import { Button, Modal, Form } from "react-bootstrap";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faGear } from '@fortawesome/free-solid-svg-icons'
import Xarrow, { useXarrow } from 'react-xarrows';
import { useSelector, useDispatch } from 'react-redux'
import { DisplayNameSetup, upperCaseValidation } from './helperFunctions';
import { changeSimDispatch } from '../features/simulators/simulatorSlice'

function Simulator(props) {
    const dispatch = useDispatch() // dispatch function for altering the Redux store
    const interSelector = useSelector((state) => state.interfaces) // Redux selector for interfaces
    const simSelector = useSelector((state) => state.simulator) // Redux selector for simulator
    const realFuncSelector = useSelector((state) => state.realFunctionality)
    // eslint-disable-next-line no-unused-vars
    const stateMachineSelector = useSelector((state) => state.stateMachines)

    // Name constants for shortening
    const simInterfaceMaxLength = 28;
    const simModalDisplayLength = 21;

    const [show, setShow] = useState(false);
    library.add(faGear);
    const handleClose = () => {
        setShow(false);
    }
    const handleShow = () => setShow(true);

    // hook for updating Xarrow
    // eslint-disable-next-line no-unused-vars
    const updateXarrow = useXarrow();


    // References
    const nameRef = React.createRef();
    const basicAdvIntRef = React.createRef();
    const realFunctRef = React.createRef();
    
    const saveComponentInfo = (e) => {
        e.preventDefault();
        let updatedValue = {
            "name": nameRef.current.value,
            "basicAdversarialInterface": basicAdvIntRef.current.value,
            "realFunctionality": realFunctRef.current.value,};
        if(upperCaseValidation(nameRef.current.value)){
            dispatch(changeSimDispatch(updatedValue))
            //Close the modal [May not want to do it]
            setShow(false);
        }
        
    }

    const interFilter = (inter) => {
        let flag = true;
        interSelector.compInters.forEach((compInter) => {
            compInter.basicInterfaces.forEach((basicInComp) => {
                if (basicInComp.idOfBasic === inter.id) {
                    flag = false;
                }
            });
        });
        if (inter.type !== "adversarial") {
            flag = false;
        }

        return (flag)
    };
    
    return (
        // Below we use simSelector.id to see if this is an actual simulator or if it exists
        // only in the composition box. Eventually, we'll be able to remove a lot of this
        // logic because we are removing the composition box
        <div>
            { /* Simulator Box */ }
            <div id="idealWorldSim" className="sim" 
                style={{ left: simSelector.left + "px", top: simSelector.top + "px", backgroundColor: simSelector.color }}>
                    <FontAwesomeIcon className="simoptions" data-testid="simOptions" icon={faGear} onClick={handleShow}/>
                {simSelector.id && (
                    <span className='simDnDName'>{ simSelector.name }</span>
                )}
                {!simSelector.id && (
                    <span>Simulator</span>
                )}
            </div>

            { /* Modal */ }
            <Modal show={show} onHide={handleClose} animation={false} data-testid="simulator-modal">
                <Modal.Header> 
                    <Modal.Title> Configure { DisplayNameSetup(simSelector.name, simModalDisplayLength) || "Simulator"}</Modal.Title>
                </Modal.Header>                
                <Modal.Body>
                    <div className="simnameandcolor">                 
                        <div className="simnameComp">
                            <Form onSubmit={ saveComponentInfo }>
                                <Form.Control name="simnameComp" type="text" 
                                    placeholder="Enter a name" size="15"
                                    defaultValue={simSelector.name} ref={nameRef} 
                                    autoFocus />
                            </Form>
                        </div>
                    </div> 
                    <div id="dropdown-container">                        
                        <div id="real-functionalities">
                            <h6>Real Functionality</h6>
                            <Form.Select aria-label="Select a Real Functionality" ref={realFunctRef}
                                            defaultValue={simSelector.realFunctionality}
                                            title={"simRealFunc"}>
                                <option value="">Select a Real Functionality</option>
                                <option key={"real-Func-id-" + realFuncSelector.id} value={realFuncSelector.id}>{DisplayNameSetup(realFuncSelector.name, simInterfaceMaxLength)}</option> 
                                
                            </Form.Select>
                        </div>
                        <div id="basic-adversarial-interfaces">
                            <h6>Basic Adversarial Interface</h6>
                            <Form.Select aria-label="Select an Adversarial Interface" ref={basicAdvIntRef}
                                            defaultValue={simSelector.basicAdversarialInterface}
                                            title={"simAdvInterface"}>
                                <option value="">Select an Adversarial Interface</option>
                                { interSelector.basicInters.filter(interFilter).map(basicInt => (
                                            <option key={"basic-interface-id-" + basicInt.id} value={basicInt.id}>{DisplayNameSetup(basicInt.name, simInterfaceMaxLength)}</option> 
                                    ))}
                            </Form.Select>
                        </div>                                      
                    </div>
                </Modal.Body>
                <Modal.Footer>                    
                    <Button variant="primary" onClick={saveComponentInfo}> Save Changes </Button>
                    <Button variant="secondary" onClick={handleClose}> Close </Button>
                </Modal.Footer> 
            </Modal>

            { /* Arrows */ }
            { simSelector && simSelector.realFunctionality &&
                <Xarrow key={ simSelector.id + "-adversarial-connector" } start="idealWorldSim" end="idealWorld-environment-right" 
                        showHead={false} color="red" path="grid" startAnchor="right" endAnchor="left" zIndex= {-1} />
            }
            { simSelector && simSelector.basicAdversarialInterface &&
                <Xarrow key={ simSelector.id + "-adversarial-connector-from-sim" } start="idealWorldSim" end="idealWorldIdealFunc" 
                        showHead={false} color="red" path="grid" startAnchor="left" endAnchor="right" zIndex= {-1} />
            }

        </div>
    );
}

export default Simulator;
