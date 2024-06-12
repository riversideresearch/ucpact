/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import Select from "react-select";
import { useDrag } from "react-dnd";
import { Button, Modal, Form } from "react-bootstrap";
import Xarrow, { useXarrow } from 'react-xarrows';
import './party.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faGear } from '@fortawesome/free-solid-svg-icons'
import axios from 'axios';
import { CirclePicker } from 'react-color'
import { useSelector, useDispatch } from 'react-redux'
import { changePartyDispatch,
         removePartyDispatch } from '../features/parties/partiesSlice'
import { DisplayNameSetup, upperCaseValidation } from "./helperFunctions";
import { removeStateMachineDispatch } from "../features/stateMachines/stateMachineSlice";
import { useAuth } from "react-oidc-context";

function Party(props) {
    const dispatch = useDispatch() // dispatch function for altering the Redux store
    
    const [state, setState] = useState({color: "#c4dd88", colorTemp: "#c4dd88"})
    const [paramInterMessages, setParamInterMessages] = useState();
    
    // Redux selector for specific instance of party
    // state.parties refers to the parties Redux state
    // 2nd .parties refers to the array of parties within the parties Redux state
    const partySelector = useSelector((state) => state.parties.parties.find(element => element.id === props.id))
    const subfuncSelector = useSelector(state => state.subfunctionalities);
    const realFuncSelector = useSelector((state) => state.realFunctionality) // Redux selector for Real Functionality
    const stateMachineSelector = useSelector((state) => state.stateMachines);
    
    const compAdvSelector = useSelector((state) => state.interfaces.compInters.find(basicInt => (basicInt.type === "adversarial") && (basicInt.id === realFuncSelector.compositeAdversarialInterface)));
    const compDirSelector = useSelector((state) => state.interfaces.compInters.find(basicInt => (basicInt.type === "direct") && (basicInt.id === realFuncSelector.compositeDirectInterface)));

    // Name constants for shortening
    const partyInterfaceMaxLength = 28;
    const partyModalDisplayLength = 21;

    const [subFuncMessages, setSubFuncMessages] = useState([]); // State used for subfunc messages in State Machines
    const [subfuncsToConnect, setSubfuncsToConnect] = useState([]);
    const [paramIntersToConnect, setParamIntersToConnect] = useState([]);

    // hook for updating Xarrow
    // eslint-disable-next-line no-unused-vars
    const updateXarrow = useXarrow();

    const auth = useAuth();

    // aarow display parameters
    const anchorSpacing = index => {
        const multiplier = index % 2 ? -1 : 1;
        return Math.ceil(index/2) * 20 * multiplier;
    };

    const [{ isDragging }, drag] = useDrag(() => ({
        type: "ucComp",
        item: { type: "party", id: props.id },
        canDrag: props.draggable,
        collect: (monitor) => ({
            isDragging: !!monitor.isDragging(),
        }),
    }));

    const [show, setShow] = useState(props.id && !partySelector.name);
    library.add(faGear);

    const handleClose = () => {
        let updatedValue = {
            "colorTemp": state.color,
        }
        setState(prevState => ({
            ...prevState,
            ...updatedValue
        }));
        setShow(false);
    }
    const handleShow = () => setShow(true);

    // References
    const nameRef = React.createRef();
    const basicAdvIntRef = React.createRef();
    const basicDirIntRef = React.createRef();

    //Deletes the component of the modal and closes the modal
    const handleDeleteComponent = () => {
        //Do we want to have a confirm before we delete?
        props.remove("party", props.id);
        dispatch(removePartyDispatch(props.id));
        dispatch(removeStateMachineDispatch(partySelector.stateMachine));
        setShow(false);
    }

    const handleColorChange = (color) => {
        let updatedValue = {
            "colorTemp": color.hex,
        }
        setState(prevState => ({
            ...prevState,
            ...updatedValue
        }));
    }

    const saveComponentInfo = (e) => {
        e.preventDefault();
        let updatedValue = {
            "id": props.id,
            "name": nameRef.current.value,
            "basicAdversarialInterface": basicAdvIntRef.current.getValue()[0].value,
            "basicDirectInterface": basicDirIntRef.current.getValue()[0].value,
            "stateMachine": partySelector.stateMachine,
            "color": state.colorTemp,
            "left": props.disp.left,
            "top": props.disp.top,
        };
        let updatedTempColor = {
            "color" : state.colorTemp,
        };
        if(upperCaseValidation(nameRef.current.value)){
            setState(prevState => ({
                ...prevState,
                ...updatedTempColor
            }));
            dispatch(changePartyDispatch(updatedValue))
        
            //Close the modal [May not want to do it]
            setShow(false);
        }
        
    }

    // Api call for subfunc messages
    useEffect(() => {
        // Clear subFuncMessages
        setSubFuncMessages([]);
        // Get all subfuncs
        subfuncSelector.subfunctionalities.forEach((subfunc) => {
            if (subfunc.idealFunctionalityId) {
                let token = "none";
                if (process.env.NODE_ENV !== 'test') {
                    token = auth.user?.access_token;
                }
                // Make api call
                let urlPath = process.env.REACT_APP_SERVER_PREFIX + "/idealFunctionalities/" + subfunc.idealFunctionalityId + "/messages";
                axios({
                    method: "GET",
                    url: urlPath,
                    headers: {
                        Authorization: `Bearer ${token}`, SessionTabId: `${localStorage.sessionID}/${sessionStorage.tabID}`,
                      }
                })
                .then((response) => {
                    const res = response.data;
                    res.forEach(message => {
                        message["subfuncId"] = subfunc.id;
                    });
                    setSubFuncMessages(subFuncMessages => [...subFuncMessages, ...res])
                })
                .catch((err) => {
                    if (err.response) {
                        console.log(err.response);
                        console.log(err.response.status);
                        console.log(err.response.headers);
                    }
                });
            }
        });
    }, [subfuncSelector]);

    useEffect(() => {
        // Clear subfuncsToConnect
        setSubfuncsToConnect([]);

        stateMachineSelector.stateMachines.forEach((stateMachine) => {
            if (partySelector) {
                if (stateMachine.id === partySelector.stateMachine) {
                    stateMachine.transitions.forEach((transitionInStateMachine) => {
                        stateMachineSelector.transitions.forEach((transition) => {
                            if (transition.id === transitionInStateMachine) {
                                subFuncMessages.forEach((subfuncMessage) => {
                                    if (transition.outMessage === (subfuncMessage.id + "/" + subfuncMessage.subfuncId)) {
                                        setSubfuncsToConnect(subfuncsToConnect => [...subfuncsToConnect, subfuncMessage.subfuncId])
                                    }
        
                                    if (transition.inMessage === (subfuncMessage.id + "/" + subfuncMessage.subfuncId)) {
                                        setSubfuncsToConnect(subfuncsToConnect => [...subfuncsToConnect, subfuncMessage.subfuncId])
                                    }
                                });
                            }
                        });
                    });
                }
            }
        });
    }, [subFuncMessages, stateMachineSelector.transitions]);

    // Api call for param interfaces messages
    useEffect(() => {
        // Clear paramInters
        setParamInterMessages([]);
        // Check if this state machine is for a party
        if (realFuncSelector.parameterInterfaces) {
            // Get all paramInterfaces
            realFuncSelector.parameterInterfaces.forEach((paramInter) => {
                if (paramInter.idOfInterface) {
                    // Make api call
                    let token = "none";
                    if (process.env.NODE_ENV !== 'test') {
                        token = auth.user?.access_token;
                    }
                    let urlPath = process.env.REACT_APP_SERVER_PREFIX + "/compInterfaces/" + paramInter.idOfInterface + "/messages";
                    axios({
                        method: "GET",
                        url: urlPath,
                        headers: {
                          Authorization: `Bearer ${token}`, SessionTabId: `${localStorage.sessionID}/${sessionStorage.tabID}`,
                        },
                    })
                    .then((response) => {
                        const res = response.data;
                        res.forEach(message => {
                            message["paramInterId"] = paramInter.id;
                            message["id"] += "/" + paramInter.id;
                        });
                        setParamInterMessages(paramInterMessages => [...paramInterMessages, ...res])
                    })
                    .catch((err) => {
                        if (err.response) {
                            console.log(err.response);
                            console.log(err.response.status);
                            console.log(err.response.headers);
                        }
                    });
                }
            });
        }
    }, [realFuncSelector]);

    useEffect(() => {
        // Clear subfuncsToConnect
        setParamIntersToConnect([]);

        stateMachineSelector.stateMachines.forEach((stateMachine) => {
            if (partySelector) {
                if (stateMachine.id === partySelector.stateMachine) {
                    stateMachine.transitions.forEach((transitionInStateMachine) => {
                        stateMachineSelector.transitions.forEach((transition) => {
                            if (transition.id === transitionInStateMachine) {
                                realFuncSelector.parameterInterfaces.forEach((parameter) => {
                                    paramInterMessages && paramInterMessages.forEach(message => {
                                        if (transition.outMessage === message.id) {
                                            if (parameter.idOfInterface === message.compInter.id) {
                                                setParamIntersToConnect(paramInterToConnect => [...paramInterToConnect, parameter.id])
                                            }
                                        }
                                        if (transition.inMessage === message.id) {
                                            if (parameter.idOfInterface === message.compInter.id) {
                                                setParamIntersToConnect(paramInterToConnect => [...paramInterToConnect, parameter.id])
                                            }
                                        }
                                    })
                                });
                            }
                        });
                    });
                }
            }
        });
    }, [realFuncSelector.parameterInterfaces, stateMachineSelector.transitions, paramInterMessages]);
    
    
    let colorPalette = ["#c4dd88", "#c7978c", "#6fa5c6", "#c2b8a3", "#b75d69", "#a2c8b3", "#e3c85b", "#bfe1d9", "#cf7b6b", "#8fc7a6", "#ce9bcc", "#5c6e91"]; 

    // Dropdown menu functions
    const [directIntOptions, setDirectIntOptions] = useState([]);
    const [advIntOptions, setAdvIntOptions] = useState([]);

    useEffect(() => {
        let optionsArray = [{key : "basic-interface-id", value : "", label : "Select a Direct Interface..."}];
        compDirSelector && compDirSelector.basicInterfaces.forEach(basicInt => {
            optionsArray.push({key : "basic-interface-id-" + basicInt.idOfInstance, value : basicInt.idOfInstance, label : DisplayNameSetup(basicInt.name, partyInterfaceMaxLength)})
        });
        setDirectIntOptions(optionsArray);
    }, [compDirSelector]);

    useEffect(() => {
        let optionsArray = [{key : "basic-interface-id", value : "", label : "Select an Adversarial Interface..."}];
        compAdvSelector && compAdvSelector.basicInterfaces.forEach(basicInt => {
            optionsArray.push({key : "basic-interface-id-" + basicInt.idOfInstance, value : basicInt.idOfInstance, label : DisplayNameSetup(basicInt.name, partyInterfaceMaxLength)})
        })
        setAdvIntOptions(optionsArray);
    }, [compAdvSelector]);

    return (
        <div>
            { /* Party Box */ }
            <div id={props.id ? props.id : "partyCompBoxElem"} className="party" 
                ref={drag}
                style={{ left: props.id ? props.disp.left + "px": "", top: props.id ? props.disp.top + "px": "", position: props.id ? "absolute" : "",
                opacity: isDragging ? 0.5 : 1, backgroundColor: props.id ? partySelector.color: "#c4dd88"}}>
                {props.id &&
                    <FontAwesomeIcon className="partyoptions" data-testid="partyOptions" icon={faGear} onClick={handleShow}/>
                }
                {props.id && (
                    <span className="partyDnDName">{ partySelector.name }</span>
                )}
                {!props.id && (
                    <span>Party</span>
                )}
            </div>

            { /* Modal */ }
            <Modal show={show} onHide={handleClose} animation={false} data-testid="party-modal">
                <Modal.Header> 
                    <Modal.Title> Configure { (partySelector && DisplayNameSetup(partySelector.name, partyModalDisplayLength)) || "Party" }</Modal.Title>
                </Modal.Header>                
                <Modal.Body>
                    <div className="partynameandcolor">                 
                        <div className="partynameComp">
                            <Form onSubmit={ saveComponentInfo }>
                                <Form.Control name="partynameComp" type="text" 
                                    placeholder="Enter a name" size="15"
                                    defaultValue={ partySelector && partySelector.name } ref={nameRef} 
                                    autoFocus />
                            </Form>
                        </div>
                        <div className="partycolorComp">
                            <CirclePicker colors={colorPalette} onChange={handleColorChange} />
                            <div className="partycolorvisuals" >
                                <div className="partytempcolordiv">
                                    <div>
                                        Selected:
                                    </div>
                                    <div className="partycolorPad">
                                        <Button className="partytempColor" style={{backgroundColor: state.colorTemp}}></Button>
                                    </div>
                                </div>
                                <div className="partycurrentcolordiv">
                                    <div>
                                        Current:
                                    </div>
                                    <div className="partycolorPad">
                                        <Button className="partycurColor" style={{backgroundColor: state.color}}></Button>
                                    </div>
                                </div>
                            </div> 
                        </div>
                    </div>
                    
                    <div id="dropdown-container">
                        <div id="basic-direct-interfaces">
                            <h6>Basic Direct Interface</h6>
                            <Select 
                                options={directIntOptions}
                                getOptionValue ={(option)=>option.label}
                                placeholder="Select a Direct Interface..."
                                defaultValue={{ value : (partySelector && partySelector.basicDirectInterface) || "",
                                    label : partySelector ? directIntOptions.find(basicInt => basicInt.value == partySelector.basicDirectInterface) ? directIntOptions.find(basicInt => basicInt.value == partySelector.basicDirectInterface).label : "Select a Direct Interface..." : "Select a Direct Interface..."}}
                                ref={basicDirIntRef}
                            />
                        </div>
                        <div id="basic-adversary-interfaces">
                            <h6>Basic Adversarial Interface</h6>
                            <Select 
                                options={advIntOptions}
                                getOptionValue ={(option)=>option.label}
                                placeholder="Select an Adversarial Interface..."
                                defaultValue={{ value : (partySelector && partySelector.basicAdversarialInterface) || "",
                                    label : partySelector ? advIntOptions.find(basicInt => basicInt.value == partySelector.basicAdversarialInterface) ? advIntOptions.find(basicInt => basicInt.value == partySelector.basicAdversarialInterface).label : "Select an Adversarial Interface..." : "Select an Adversarial Interface..."}}
                                ref={basicAdvIntRef}
                            />
                        </div>                                      
                    </div>
                </Modal.Body>
                <Modal.Footer>                    
                    <Button className="deleteParty" variant="danger" onClick={handleDeleteComponent}>Delete</Button>
                    <Button variant="primary" onClick={saveComponentInfo}> Save Changes </Button>
                    <Button variant="secondary" onClick={handleClose}> Close </Button>
                </Modal.Footer> 
            </Modal>

            { /* Arrows */ }
            { partySelector && partySelector.basicDirectInterface &&
                <Xarrow key={ props.id + "-direct-connector" } start={ props.id } end="realFunctionality-environment-upper" 
                        showHead={false} path="grid" startAnchor="top" 
                        endAnchor={{position: "bottom", offset: { x: anchorSpacing(props.index) }}}  zIndex= {-1}
                        data-testid="partyDirectArrow"
                />
            }
            { partySelector && partySelector.basicAdversarialInterface &&
                <Xarrow key={ props.id + "-adversarial-connector" } start={ props.id } end="realFunctionality-environment-right" 
                        showHead={false} color="red" path="grid" startAnchor="right" 
                        endAnchor={{position: "left", offset: { y: anchorSpacing(props.index) }}} zIndex= {-1} 
                        data-testid="partyAdversarialArrow"
                />
            }
            { subfuncsToConnect && props.id &&
            (subfuncsToConnect.filter((value, index) => subfuncsToConnect.indexOf(value) === index).map((subfunc) => (
                <Xarrow key={ props.id + subfunc } start={ props.id } end={ subfunc }
                        showHead={false} color="purple" path="grid"
                />
            )))}
            { paramIntersToConnect && props.id &&
            (paramIntersToConnect.filter((value, index) => paramIntersToConnect.indexOf(value) === index).map((param) => (
                <Xarrow key={ props.id + param } start={ props.id } end={ param }
                        showHead={false} color="purple" path="grid"
                />
            )))}
        </div>
        
    );     
}


export default Party;
