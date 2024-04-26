/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useRef } from 'react';
import { useDrop } from 'react-dnd';
import { Button, Modal, Form } from "react-bootstrap";
import uuid from 'react-uuid';
import Environment from './environment';
import Party from './party';
import SubFunc from './subFunc';
import './realFunctionality.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faGear } from '@fortawesome/free-solid-svg-icons'
import { faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import { useSelector, useDispatch } from 'react-redux'
import { addPartyDispatch, 
         clearDirectInterfaceDispatch, 
         clearAdversarialInterfaceDispatch, 
         updatePartyPositionDispatch } from '../features/parties/partiesSlice'
import { addSubfuncDispatch, updateSubfuncPositionDispatch } from '../features/subfunctionalities/subfuncSlice'
import { addToPartiesDispatch,
         addToSubfuncsDispatch,
         removeFromPartiesDispatch,
         removeFromSubfuncsDispatch,
         changeRealfuncDispatch,
         addParamInterDispatch,
         deleteParamInterDispatch } from '../features/realFunctionalities/realFuncSlice'
import { addStateDispatch, 
         addStateMachineDispatch, 
         changeTransitionDispatch } from '../features/stateMachines/stateMachineSlice';
import { DisplayNameSetup, upperCaseValidation } from './helperFunctions';
import axios from 'axios';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import Accordion from 'react-bootstrap/Accordion';
import Container from 'react-bootstrap/Container'
import { useAuth } from "react-oidc-context";

function RealFunctionality(props) {
    const dispatch = useDispatch() // dispatch function for altering the Redux store

    
    const realFuncSelector = useSelector((state) => state.realFunctionality) // Redux selector for Real Functionality
    const interSelector = useSelector((state) => state.interfaces) // Redux selector for interfaces
    const partySelector = useSelector((state) => state.parties) // Redux selector for parties
    const subSelector = useSelector((state) => state.subfunctionalities) // Redux selector for subfunctionalities
    const transitionSelector = useSelector((state) => state.stateMachines.transitions) // Redux selector for transitions

    const [displayState, setDisplayState] = useState({});
    const [paramInterAPIData, setParamInterAPIData] = useState();
    const [show, setShow] = useState(false);
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);
    const [updateState, setUpdateState] = useState(false);

    const paramInterRefs = useRef({});
    const paramInterNameRefs = useRef({});
    const auth = useAuth();

    useEffect(() => {
        realFuncSelector.parties.forEach((party) => {
            let thisParty = partySelector.parties.find(element => element.id === party);
            setDisplayState(prevState => {
                let newState = JSON.parse(JSON.stringify(prevState));
                newState[thisParty.id] = {"left": thisParty.left, "top": thisParty.top};
                return newState;
            });
        });
        realFuncSelector.subfunctionalities.forEach((subfunc) => {
            let thisSub = subSelector.subfunctionalities.find(element => element.id === subfunc);
            setDisplayState(prevState => {
                let newState = JSON.parse(JSON.stringify(prevState));
                newState[thisSub.id] = {"left": thisSub.left, "top": thisSub.top};
                return newState;
            });
        });
    }, []);

    useEffect(() => {
        // API Call for Parameter Interfaces
    let token = "none";
    if (process.env.NODE_ENV !== 'test') {
        token = auth.user?.access_token;
    }
	let urlPath = process.env.REACT_APP_SERVER_PREFIX + "/compInterfaces";
        axios({
            method: "GET",
            url: urlPath,
            headers: {
              Authorization: `Bearer ${token}`, SessionTabId: `${localStorage.sessionID}/${sessionStorage.tabID}`,
            }
        })
        .then((response) => {
            const res = response.data;
            setParamInterAPIData(res);
        })
        .catch((err) => {
            if (err.response) {
                console.log(err.response);
                console.log(err.response.status);
                console.log(err.response.headers);
            }
        });
    }, [setShow])

    // Name length constants
    const realFuncTitleDisplayLength = 55;
    const realFuncModalDisplayLength = 21;
    const realFuncInterfaceDisplayLength = 28;

    // References
    const nameRef = React.createRef();
    const compositeAdvIntRef = React.createRef();
    const compositeDirIntRef = React.createRef();

    library.add(faGear);

    // eslint-disable-next-line no-unused-vars
    const [{ isOver }, drop] = useDrop(() => ({
        accept: ["ucComp"],
        drop(item, monitor) {
            const position = monitor.getClientOffset()
            const sourceCO = monitor.getInitialSourceClientOffset();
            const initialCO = monitor.getInitialClientOffset();
            const left = position.x - (initialCO.x - sourceCO.x);
            const top = position.y - (initialCO.y - sourceCO.y);

            if (item.id) {
                setDisplayState(prevState => {
                    let newState = JSON.parse(JSON.stringify(prevState));
                    newState[item.id] = {"left": left, "top": top};
                    return newState;
                });
                if (item.type === "party") {
                    dispatch(updatePartyPositionDispatch([item.id, left, top]))
                } else if (item.type === "subFunc") {
                    dispatch(updateSubfuncPositionDispatch([item.id, left, top]))
                }
            }
            else {
                addComponentToState(item.type, left, top);
            }
        },
        collect: (monitor) => ({
            isOver: !!monitor.isOver(),
        }),
    }));

    const addComponentToState = (type, left, top) => {
        let id = uuid();
        let smid = uuid();
        let initStateId = uuid();

        let newInitState = {
            "id" : initStateId,
            "name": "InitState",
            "left": 270,
            "top": 150,
            "color": "#e3c85b",
            "parameters": []
        };

        let newStateMachine = {
            "id" : smid,
            "states" : [initStateId],
            "transitions" : [],
            "initState" : initStateId
        };

        if (type === "party") {
            let newParty = {
                "id": id,
                "name": "",
                "basicAdversarialInterface": "",
                "basicDirectInterface": "",
                "stateMachine": smid,
                "color": "#c4dd88",
                "left": left,
                "top": top,
            };

            dispatch(addPartyDispatch(newParty)); // create a new party and add it to the Redux Store
            dispatch(addToPartiesDispatch(id)); // add the new party to the realFunc Redux Store
            dispatch(addStateDispatch(newInitState)); // Add init state to list of states
            dispatch(addStateMachineDispatch(newStateMachine)); // Add party state machine
        } else if (type === "subFunc") {
            let newSubfunc = {
                "id": id,
                "name": "",
                "idealFunctionality": "",
                "color": "#8a6996",
                "left": left,
                "top": top,
            };

            dispatch(addSubfuncDispatch(newSubfunc)) // create a new subfunctionality and add it to the Redux Store
            dispatch(addToSubfuncsDispatch(id)) // add the new subfunctionality to the realFunc Redux Store
        }
        setDisplayState(prevState => {
            let newState = JSON.parse(JSON.stringify(prevState));
            newState[id] = {"left": left, "top": top};
            return newState;
        });
    };

    // function to delete component based on type and id 
    const remove = (type, id) => {
        if (type === "party") {
            dispatch(removeFromPartiesDispatch(id))
        } else if (type === "subFunc") {
            dispatch(removeFromSubfuncsDispatch(id))
        }
        setDisplayState(prevState => {
            let newState = JSON.parse(JSON.stringify(prevState));
            delete newState[id];
            return newState;
        });
    };

    const saveComponentInfo = (e) => {
        e.preventDefault();

        realFuncSelector.parameterInterfaces.forEach((paramInter) => {
            if((paramInter.idOfInterface !== paramInterRefs.current[paramInter.id].value) && paramInter.idOfInterface !== ""){
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
                    transitionSelector.forEach((transition) => {
                        let updatedTransition = {
                            "id": transition.id,
                            "fromState": transition.fromState,
                            "toState": transition.toState,
                            "toStateArguments": transition.toStateArguments,
                            "outMessageArguments": transition.outMessageArguments,
                            "guard": transition.guard,
                            "outMessage": transition.outMessage,
                            "inMessage": transition.inMessage
                        }
                        res.forEach(message => {
                            if(transition.outMessage === message.id){
                                updatedTransition.outMessage = ""
                                updatedTransition.outMessageArguments = []
                            }
                            if(transition.inMessage === message.id){
                                updatedTransition.inMessage = ""
                            }
                        })
                        dispatch(changeTransitionDispatch(updatedTransition))
                    });
                })
                .catch((err) => {
                    if (err.response) {
                        console.log(err.response);
                        console.log(err.response.status);
                        console.log(err.response.headers);
                    }
                });
            }
        })

        let paramIntersValues = [];
        let parametersAreGood = true;
        if (realFuncSelector.parameterInterfaces) {
            realFuncSelector.parameterInterfaces.forEach((param, idx) => {
                let thisCompInter = paramInterAPIData.find(element => element.compInterface_id === paramInterRefs.current[param.id].value)
                let modelName = thisCompInter ? thisCompInter.model_name : "";
                let compInterName = thisCompInter ? thisCompInter.compInterface_name : "";
                let newParamInter = {
                    "id": param.id,
                    "name": paramInterNameRefs.current[param.id].value,
                    "idOfInterface": paramInterRefs.current[param.id].value,
                    "compInterName": compInterName,
                    "modelName" : modelName
                }
                paramIntersValues.push(newParamInter);
                if(!upperCaseValidation(paramInterNameRefs.current[param.id].value)){
                    parametersAreGood = false
                }
            });   
        }

        let updatedValue = {
            "name": nameRef.current.value,
            "compositeAdversarialInterface": compositeAdvIntRef.current.value,
            "compositeDirectInterface": compositeDirIntRef.current.value,
            "parameterInterfaces": paramIntersValues
        };

        if(upperCaseValidation(nameRef.current.value) && parametersAreGood){
            if(realFuncSelector.compositeAdversarialInterface !== updatedValue.compositeAdversarialInterface){
                //Clears the Adversarial interface from all parties
                realFuncSelector.parties.forEach(party => {
                    dispatch(clearAdversarialInterfaceDispatch(party)); 
                });
            }
            if(realFuncSelector.compositeDirectInterface !== updatedValue.compositeDirectInterface){
                // Clears the Direct interface from all Parties
                realFuncSelector.parties.forEach(party => {
                    dispatch(clearDirectInterfaceDispatch(party));
                    
                });
            
            }
            dispatch(changeRealfuncDispatch(updatedValue))
        
            //Close the modal [May not want to do it]
            setShow(false);
        }
    }  

    const addParamInter = () => {
        let newParamInter = {
            "id": uuid(),
            "name": "",
            "idOfInterface": ""
        }
        dispatch(addParamInterDispatch(newParamInter))
    };

    const deleteParamInter = (id) => {
        // TODO update for transition updates
        let idOfCompInterface = realFuncSelector.parameterInterfaces.find((paraInter) => paraInter.id === id).idOfInterface
        let token = "none";
        if (process.env.NODE_ENV !== 'test') {
            token = auth.user?.access_token;
        }
        let urlPath = process.env.REACT_APP_SERVER_PREFIX + "/compInterfaces/" + idOfCompInterface + "/messages";
            axios({
                method: "GET",
                url: urlPath,
                headers: {
                  Authorization: `Bearer ${token}`, SessionTabId: `${localStorage.sessionID}/${sessionStorage.tabID}`,
                },
            })
            .then((response) => {
                const res = response.data;
                transitionSelector.forEach((transition) => {
                    let updatedTransition = {
                        "id": transition.id,
                        "fromState": transition.fromState,
                        "toState": transition.toState,
                        "toStateArguments": transition.toStateArguments,
                        "outMessageArguments": transition.outMessageArguments,
                        "guard": transition.guard,
                        "outMessage": transition.outMessage,
                        "inMessage": transition.inMessage
                    }
                    res.forEach(message => {
                        if(transition.outMessage === message.id){
                            updatedTransition.outMessage = ""
                            updatedTransition.outMessageArguments = []
                        }
                        if(transition.inMessage === message.id){
                            updatedTransition.inMessage = ""
                        }
                    })
                    dispatch(changeTransitionDispatch(updatedTransition))
                });
            })
            .catch((err) => {
                if (err.response) {
                    console.log(err.response);
                    console.log(err.response.status);
                    console.log(err.response.headers);
                }
            });
                
        dispatch(deleteParamInterDispatch(id));
        setUpdateState(!updateState);
    }

    const upperCheckParameter = (id) => {
        if (show) {
            if (paramInterNameRefs.current[id]) {
                return upperCaseValidation(paramInterNameRefs.current[id].value, false)
            } else {
                return true;
            }
        } else {
            return true;
        }
    }
    
    return (
        <div className="rw" ref={drop} >
            <div className="rwHeader">
              <header className="rwTitle">{DisplayNameSetup(realFuncSelector.name, realFuncTitleDisplayLength)}</header>
              <div className="realfuncoptions">
                <FontAwesomeIcon data-testid="realFuncOptions" icon={faGear} onClick={handleShow}/>
              </div>
            </div>
                
            <Environment idPrefix="realFunctionality" />
            {realFuncSelector.parties.map((party, idx) => (
                (displayState[party]) &&
                <Party id={ party } key={ party } draggable={ true } remove={ remove } 
                       disp={ displayState[party] } index={ idx } />
            ))}
            {realFuncSelector.subfunctionalities.map(subfunc => (
                (displayState[subfunc]) &&
                <SubFunc id={ subfunc } key={ subfunc } draggable={ true } remove={ remove } 
                         disp={ displayState[subfunc] } />
            ))}

            <Modal show={show} onHide={handleClose} animation={false} data-testid="realFunc-modal">
                <Modal.Header> 
                    <Modal.Title> Configure { (realFuncSelector && DisplayNameSetup(realFuncSelector.name, realFuncModalDisplayLength)) || "Real_Functionality"} </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="realFuncNameComponent">
                        <Form onSubmit={ saveComponentInfo }>
                            <Form.Control name="realFuncNameComp" type="text" 
                                placeholder="Enter a name" size="15"
                                defaultValue={ realFuncSelector.name } ref={nameRef} 
                                autoFocus />
                        </Form>
                    </div>
                    <div id="dropdown-container">
                        <div id="composite-direct-interfaces">
                            <h6>Composite Direct Interface</h6>
                            <Form.Select aria-label="Select a Direct Interface" ref={compositeDirIntRef}
                                            defaultValue={ (realFuncSelector && realFuncSelector.compositeDirectInterface) || "" }
                                            title={"realFuncDirInterface"}>
                                <option value="">Select a Direct Interface</option>
                                { interSelector.compInters.filter(compositeInt => compositeInt.type === "direct").map(compositeInt => (
                                        <option key={"composite-interface-id-" + compositeInt.id} value={compositeInt.id}>
                                            {DisplayNameSetup(compositeInt.name, realFuncInterfaceDisplayLength)}
                                            </option> 
                                ))}
                            </Form.Select>
                        </div>
                        <div id="composite-adversary-interfaces">
                            <h6>Composite Adversarial Interface</h6>
                            <Form.Select aria-label="Select an Adversarial Interface" ref={compositeAdvIntRef}
                                            defaultValue={ (realFuncSelector && realFuncSelector.compositeAdversarialInterface) || "" }
                                            title={"realFuncAdvInterface"} >
                                <option value="">Select an Adversarial Interface</option>
                                { interSelector.compInters.filter(compositeInt => compositeInt.type === "adversarial").map(compositeInt => (
                                        <option key={"composite-interface-id-" + compositeInt.id} data-testid="select-option" value={compositeInt.id}>
                                            {DisplayNameSetup(compositeInt.name, realFuncInterfaceDisplayLength)}
                                            </option> 
                                ))}
                            </Form.Select>
                        </div><br></br>
                        <div id="parameter-container">
                            <span className="paramTitle">Parameter Interfaces
                                <FontAwesomeIcon className="paramAdd" icon={faPlus} variant="outline-success" title="Add Parameter"
                                                onClick={() => {addParamInter()}} 
                                                />
                            </span>
                            <Accordion key={"param-inter-accordion"} data-testid="accorParam" className="stateaccordion" id="paramAccordion">
                                <Accordion.Item>
                                    <Accordion.Header data-testid="accorParamButton">
                                       { "Parameter Interfaces" }
                                    </Accordion.Header>
                                    <Accordion.Body>
                                        { realFuncSelector && realFuncSelector.parameterInterfaces &&
                                        (realFuncSelector.parameterInterfaces.map((parameter, idx) => (
                                            <Container fluid key={parameter + idx}>
                                            <Row>
                                                <Col lg="1">
                                                    <FontAwesomeIcon className="paramDel" icon={faTrash} title="Delete Parameter" 
                                                        onClick={() => deleteParamInter(parameter.id)} 
                                                        />
                                                </Col>
                                                <Col>
                                                    <Form.Control
                                                        ref={e => paramInterNameRefs.current[parameter.id] = e}
                                                        key={"name-" + parameter.id}
                                                        type="text" autoComplete='off' placeholder='Parameter Name'
                                                        defaultValue={(parameter.name || (paramInterNameRefs.current[parameter.id] && paramInterNameRefs.current[parameter.id].value) || "")}
                                                        isInvalid={!upperCheckParameter(parameter.id)}
                                                        onChange={() => setUpdateState((k) => !k)} 
                                                        />
                                                </Col>
                                                <Col>
                                                    <Form.Select aria-label="Select a Composite Interface" ref={e => paramInterRefs.current[parameter.id] = e}
                                                    key={"id-" + parameter.id}
                                                    defaultValue={ parameter.idOfInterface || (paramInterRefs.current[parameter.id] && paramInterRefs.current[parameter.id].value) || "" }
                                                    title={"realFuncAdvInterface"} >
                                                        <option value="">Select a Composite Interface</option>
                                                        { paramInterAPIData && paramInterAPIData.map(compositeInt => (
                                                                <option key={"composite-interface-id-" + compositeInt.compInterface_id + compositeInt.model_name} data-testid="select-option" value={compositeInt.compInterface_id}>
                                                                    {compositeInt.compInterface_name + " (" + compositeInt.model_name + ")"}
                                                                </option> 
                                                        ))}
                                                    </Form.Select>
                                                </Col>
                                            </Row></Container>
                                        )))}
                                    </Accordion.Body>
                                </Accordion.Item>
                            </Accordion> 
                        </div>                                      
                    </div>
                </Modal.Body>
                <Modal.Footer key={updateState}>
                    <Button variant="primary" onClick={saveComponentInfo}> Save Changes </Button>
                    <Button variant="secondary" onClick={handleClose}> Close </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}

export default RealFunctionality
