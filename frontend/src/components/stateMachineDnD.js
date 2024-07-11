/* eslint-disable react-hooks/exhaustive-deps */
import './stateMachines.css';
import State from './state';
import React, { useState, useEffect, useRef } from 'react';
import Select from 'react-select';
import { useDrop } from 'react-dnd';
import { Button, Modal, Form } from "react-bootstrap";
import './stateMachines.css';
import { useDispatch, useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faGear } from '@fortawesome/free-solid-svg-icons';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import Accordion from 'react-bootstrap/Accordion';
import uuid from 'react-uuid';
import { faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import Xarrow, { useXarrow } from 'react-xarrows';
import { addStateDispatch,
        addToStatesDispatch,
        addToTransitionsDispatch,
        addTransitionDispatch, 
        changeTransitionDispatch, 
        changeTransitionOutMessageDispatch, 
        changeTransitionToStateDispatch, 
        removeTransitionDispatch,
        updateStatePositionDispatch } from '../features/stateMachines/stateMachineSlice';
import { DisplayNameSetup } from './helperFunctions';

var transitionFromStateRefArray = [];
var transitionToStateRefArray = [];
var transitionInMessageRefArray = [];
var transitionOutMessageRefArray = [];
var transitionGuardRefArray = [];
var transitionPortRefArray = [];

function StateMachineDnD(props) {

    const stateMachineSelector = useSelector((state) => state.stateMachines);
    const simSelector = useSelector((state) => state.simulator) // Redux selector for simulator
    const thisStateMachineSelector = stateMachineSelector.stateMachines[stateMachineSelector.stateMachines.findIndex(element => element.id === props.component.stateMachine)];
    const interSelector = useSelector((state) => state.interfaces);
    const subfuncSelector = useSelector(state => state.subfunctionalities);
    const partySelector = useSelector(state => state.parties);
    const realFuncSelector = useSelector(state => state.realFunctionality);
    const idealFuncSelector = useSelector((state) => state.idealFunctionality) // Redux selector for ideal functionality

    const dispatch = useDispatch();

    // eslint-disable-next-line no-unused-vars
    const updateXarrow = useXarrow();

    const transitionInArgRefs = useRef({});
    const transitionOutArgRefs = useRef({});

    const [displayState, setDisplayState] = useState({});
    const [isDone, setIsDone] = useState(false);

    const { subFuncMessages, paramInterMessages } = props;

    useEffect(() => {
        thisStateMachineSelector.states.forEach((state) => {
            let thisState = stateMachineSelector.states.find(element => element.id === state);
            setDisplayState(prevState => {
                let newState = JSON.parse(JSON.stringify(prevState));
                newState[state] = {"left": thisState.left, "top": thisState.top};
                return newState;
            });
        });
        setIsDone(true);
    }, []);

    const [show, setShow] = useState(false);
    const handleClose = () => {
        transitionFromStateRefArray = [];
        transitionToStateRefArray = [];
        transitionInMessageRefArray = [];
        transitionOutMessageRefArray = [];
        transitionGuardRefArray = [];
        transitionPortRefArray = [];

        setShow(false);
    }

    const handleShow = () => {
        thisStateMachineSelector.transitions.forEach(transition => {
            let fromStateRef = React.createRef();
            let toStateRef = React.createRef();
            let inMessageRef = React.createRef();
            let outMessageRef = React.createRef();
            let guardRef = React.createRef();
            let portRef = React.createRef();

            transitionFromStateRefArray.push(fromStateRef);
            transitionToStateRefArray.push(toStateRef);
            transitionInMessageRefArray.push(inMessageRef);
            transitionOutMessageRefArray.push(outMessageRef);
            transitionGuardRefArray.push(guardRef);
            transitionPortRefArray.push(portRef);
            
        });
        
        setShow(true); 
    }

    const remove = (id) => {
        setDisplayState(prevState => {
            let newState = JSON.parse(JSON.stringify(prevState));
            delete newState[id];
            return newState;
        });
    };

    const addState = (left, top) => {
        let id = uuid();
        let newState = {
            "id" : id,
            "name" : "",
            "left" : left,
            "top" : top,
            "color" : "#e3c85b",
            "parameters" : [],
        };

        dispatch(addStateDispatch(newState));
        dispatch(addToStatesDispatch([id, props.component.stateMachine]));

        setDisplayState(prevState => {
            let newState = JSON.parse(JSON.stringify(prevState));
            newState[id] = {"left": left, "top": top};
            return newState;
        });
        
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
                setDisplayState(prevState => {
                    let newState = JSON.parse(JSON.stringify(prevState));
                    newState[item.id] = {"left": left, "top": top};
                    return newState;
                });
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

    const saveComponentInfo = (e) => {
        e.preventDefault();       
        // Dispatch State Machine to Redux
        
        thisStateMachineSelector.transitions.forEach((transition, idx) => {
            let inArgumentValuesArray = [];
            let outArgumentValuesArray = [];

            let thisToState = stateMachineSelector.states.find(element => element.id === transitionToStateRefArray[idx].current.value);
            thisToState && thisToState.parameters.forEach((parameter, argIdx) => {
                inArgumentValuesArray.push({"paraID" : parameter.id, "argValue": transitionInArgRefs.current[transition + parameter.id].value});
            });

            let thisOutMessage = "";

            if (subFuncMessages.find(element => element.id === transitionOutMessageRefArray[idx].current.getValue()[0].value)) {
                thisOutMessage = subFuncMessages.find(element => element.id === transitionOutMessageRefArray[idx].current.getValue()[0].value);
            } else if (paramInterMessages.find(element => element.id === transitionOutMessageRefArray[idx].current.getValue()[0].value)) {
                thisOutMessage = paramInterMessages.find(element => element.id === transitionOutMessageRefArray[idx].current.getValue()[0].value)
            } else {
                thisOutMessage = interSelector.messages.find(element => element.id === transitionOutMessageRefArray[idx].current.getValue()[0].value);
            }
            thisOutMessage && thisOutMessage.parameters.forEach((parameter, msgIdx) => {
                outArgumentValuesArray.push({"paraID" : parameter.id, "argValue" : transitionOutArgRefs.current[transition + parameter.id].value});
            });
            var targetport = "";
            if(transitionPortRefArray[idx].current !== null){         
                targetport = transitionPortRefArray[idx].current.value
            }
            let updatedTransition = {
                "id": transition,
                "fromState": transitionFromStateRefArray[idx].current.getValue()[0].value,
                "toState": transitionToStateRefArray[idx].current.getValue()[0].value,
                "toStateArguments": inArgumentValuesArray,
                "outMessageArguments": outArgumentValuesArray,
                "guard": transitionGuardRefArray[idx].current.value,
                "outMessage": transitionOutMessageRefArray[idx].current.getValue()[0].value,
                "inMessage": transitionInMessageRefArray[idx].current.getValue()[0].value,
                "targetPort": targetport
            }
            
            dispatch(changeTransitionDispatch(updatedTransition));
        });
        

        transitionFromStateRefArray = [];
        transitionToStateRefArray = [];
        transitionInMessageRefArray = [];
        transitionOutMessageRefArray = [];
        transitionGuardRefArray = [];
        transitionPortRefArray = [];

        
        // Close the modal [May not want to do it]
        setShow(false);
    }

    // Transition functions

    const addTransition = () => { // add 
        let id = uuid();
        let newTransition = {
            "id": id,
            "fromState": "",
            "toState": "",
            "toStateArguments": [],
            "outMessageArguments": [],
            "guard": "",
            "outMessage": "",
            "inMessage": "",
            "targetPort": ""
        }

        let fromStateRef = React.createRef();
        let toStateRef = React.createRef();
        let inMessageRef = React.createRef();
        let outMessageRef = React.createRef();
        let guardRef = React.createRef();
        let portRef = React.createRef();

        transitionFromStateRefArray.push(fromStateRef);
        transitionToStateRefArray.push(toStateRef);
        transitionInMessageRefArray.push(inMessageRef);
        transitionOutMessageRefArray.push(outMessageRef);
        transitionGuardRefArray.push(guardRef);
        transitionPortRefArray.push(portRef);

        // Dispatch
        dispatch(addTransitionDispatch(newTransition));
        dispatch(addToTransitionsDispatch([id, thisStateMachineSelector.id]));
    }

    const deleteTransition = (id) => {
        dispatch(removeTransitionDispatch(id));
    }


    // Handles multiple loopback transition arrows
    const loopbackProps = (transition) => {
        let arrowProps = {};

        // Create a local array to hold this state's loopbacks
        let stateLoopbacks = [];

        // Populate the array with all loopbacks for this state
        stateMachineSelector.transitions.filter(value => thisStateMachineSelector.transitions.includes(value.id)).forEach((thisTransition, idx) => {
            if (thisTransition.toState === thisTransition.fromState) {
                if (thisTransition.fromState === transition.fromState) {
                    stateLoopbacks.push(thisTransition)
                }
            }
        })

        // Find the 'local' index of the given loopback
        let idx = stateLoopbacks.findIndex(element => element.id === transition.id)

        // Remainder calculates the position of the arrow on the circle (left, top, right, or bottom)
        const remainder = idx % 4;

        // Multiplier calculates how far out the line is drawn
        const multiplier = (Math.floor(idx / 4) + 1) * 0.5;

        // Offsets that will change based on where the arrow starts and ends
        let x1Off = 0;
        let x2Off = 0;
        let y1Off = 0;
        let y2Off = 0;

        if (remainder === 0){

            // Offsets
            x1Off = -50 * multiplier;
            x2Off = -100 * multiplier;
            y1Off = 100 * multiplier;

            arrowProps = {
                startAnchor: {position: "left"},
                endAnchor: { position: "left", offset: { x: 0.1 } }, // Offset to the left ensure arrow points the right direction
                _cpx1Offset: x1Off,
                _cpx2Offset: x2Off,
                _cpy1Offset: y1Off,
                _cpy2Offset: y2Off
            }

        } else if (remainder === 1) {

            x1Off = -100 * multiplier;
            y1Off = -50 * multiplier;
            y2Off = -100 * multiplier;

            arrowProps = {
                startAnchor: {position: "top"},
                endAnchor: { position: "top", offset: { y: 0.1 } },
                _cpx1Offset: x1Off,
                _cpx2Offset: x2Off,
                _cpy1Offset: y1Off,
                _cpy2Offset: y2Off
            }

        } else if (remainder === 2) {

            x1Off = 50 * multiplier;
            x2Off = 100 * multiplier;
            y1Off = -100 * multiplier;

            arrowProps = {
                startAnchor: {position: "right"},
                endAnchor: { position: "right", offset: { x: -0.1 } },
                _cpx1Offset: x1Off,
                _cpx2Offset: x2Off,
                _cpy1Offset: y1Off,
                _cpy2Offset: y2Off
            }

        } else {

            x1Off = 100 * multiplier;
            y1Off = 50 * multiplier;
            y2Off = 100 * multiplier;

            arrowProps = {
                startAnchor: {position: "bottom"},
                endAnchor: { position: "bottom", offset: { y: -0.1 } },
                _cpx1Offset: x1Off,
                _cpx2Offset: x2Off,
                _cpy1Offset: y1Off,
                _cpy2Offset: y2Off
            }

        }

        return arrowProps;
    }

    // Functions to handle hover over transition arrows

    // Transition line colors
    const transitionColors = {
        // Normal display color
        normal: "#000000",
        // Color for on hover
        hover: "#808080"
    }

    // State for if the arrow is hovered over
    const [hoveredIndex, setHoveredIndex] = useState(null);

    const handleMouseEnter = (index) => {
        setHoveredIndex(index);
    };

    const handleMouseLeave = () => {
        setHoveredIndex(null);
    };

    // Handle rerenders when changing toState and outMessage to update arguments list
    const handleToStateChange = (option, transition) => {
        let payload = {
            "id": transition.id,
            "toState": option.value
        }

        dispatch(changeTransitionToStateDispatch(payload))
    }

    const handleOutMessageChange = (option, transition) => {
        let payload = {
            "id": transition.id,
            "outMessage": option.value
        }

        dispatch(changeTransitionOutMessageDispatch(payload))
    }

    // Name constants for shortening
    const stateNameDnDMaxLength = 28;
    const stateNameDnDModalMaxLength = 21;
    const stateDropDownDisplayLength = 16;

    const messageFilterIn = (mes) => {
        let thisInter = "";
        interSelector.basicInters.forEach((basicInter) => {
            basicInter.messages.forEach((message) => {
                if (message === mes.id) {
                    thisInter = basicInter;
                }
            });
        });
        if (props.component === simSelector) { // if this state machine is the simulator's          
            if (thisInter.id === simSelector.basicAdversarialInterface) { // if this interface is the simulator's basic adversarial
                if ((mes.type === 'out') && (thisInter.type === 'adversarial')) { // flip the in and out messages
                    return (mes)
                }
            } else {
                if (simSelector.realFunctionality) { // if simulator has a real functionality assigned
                    if ((mes.type === 'in') && (thisInter.type === 'adversarial')) {
                        // if this interface belongs to that real functionality
                        let simCompInter = "";
                        
                        interSelector.compInters.forEach((compInter) => {
                            if (compInter.id === realFuncSelector.compositeAdversarialInterface) {
                                simCompInter = compInter;
                            }
                        });
                        
                        if (simCompInter) {
                            let flag = false;
                            interSelector.basicInters.forEach((basicInter) => {
                                simCompInter.basicInterfaces.forEach((basicInterfaceInComp) => {
                                    if (basicInterfaceInComp.idOfBasic === basicInter.id) {
                                        if (basicInter.messages.includes(mes.id)) {
                                            flag = true;
                                        }
                                    }
                                })
                            });

                            if (flag) {
                                return (mes)
                            }
                        }
                    }
                }
            }
        } else if (props.component === idealFuncSelector) { // if this state machine is the idealFunc's
            let idealFuncInterAdv = "";
            let idealFuncCompInter = "";

            interSelector.compInters.forEach((compInter) => {
                if (compInter.id === props.component.compositeDirectInterface) {
                    idealFuncCompInter = compInter;
                }
            });

            interSelector.basicInters.forEach((basicInter) => {
                if (basicInter.id === props.component.basicAdversarialInterface) {
                    idealFuncInterAdv = basicInter;
                }
            });

            if (mes.type === 'in') {
                if (idealFuncInterAdv) { // check existence
                    if (idealFuncInterAdv.messages.includes(mes.id)) {
                        return (mes)
                    }
                }

                if (idealFuncCompInter) { // check existence
                    let flag = false; // use a flag to signal message is part of idealFunc, can't return due to nested forEach()
                    interSelector.basicInters.forEach((basicInter) => {
                        idealFuncCompInter.basicInterfaces.forEach((basicInterfaceInComp) => {
                            if (basicInterfaceInComp.idOfBasic === basicInter.id) {
                                if (basicInter.messages.includes(mes.id)) {
                                    flag = true;
                                }
                            }
                        });
                    });

                    if (flag) {
                        return (mes)
                    }
                }
            }              
        } else { // this state machine is a party's
            let partyInterAdv = "";
            let partyInterDir = "";
            interSelector.compInters.forEach((compInter) => {
                compInter.basicInterfaces.forEach((basicInter) => {
                    if (basicInter.idOfInstance === props.component.basicAdversarialInterface) {
                        partyInterAdv = interSelector.basicInters.find(element => element.id === basicInter.idOfBasic);
                    }
                    if (basicInter.idOfInstance === props.component.basicDirectInterface) {
                        partyInterDir = interSelector.basicInters.find(element => element.id === basicInter.idOfBasic);
                    }
                });
            });

            if (mes.type === 'in') {
                if (partyInterAdv.messages) { // check existence
                    if (partyInterAdv.messages.includes(mes.id)) {
                        return (mes)
                    }
                }
                if (partyInterDir.messages) { // check existence
                    if (partyInterDir.messages.includes(mes.id)) {
                        return (mes)
                    }
                }
            }
        }
    };

    const messageFilterOut = (mes) => {
        let thisInter = "";
        interSelector.basicInters.forEach((basicInter) => {
            basicInter.messages.forEach((message) => {
                if (message === mes.id) {
                    thisInter = basicInter;
                }
            });
        });
        if (props.component === simSelector) { // if this state machine is the simulator's 
            if (thisInter.id === simSelector.basicAdversarialInterface) {
                if ((mes.type === 'in') && (thisInter.type === 'adversarial')) { // flip the in and out messages
                    return (mes)
                }
            } else {
                if (simSelector.realFunctionality) {
                    if ((mes.type === 'out') && (thisInter.type === 'adversarial')) {
                        // if this interface belongs to that real functionality
                        let simCompInter = "";
                        
                        interSelector.compInters.forEach((compInter) => {
                            if (compInter.id === realFuncSelector.compositeAdversarialInterface) {
                                simCompInter = compInter;
                            }
                        });
                        
                        if (simCompInter) {
                            let flag = false;
                            interSelector.basicInters.forEach((basicInter) => {
                                simCompInter.basicInterfaces.forEach((basicInterfaceInComp) => {
                                    if (basicInterfaceInComp.idOfBasic === basicInter.id) {
                                        if (basicInter.messages.includes(mes.id)) {
                                            flag = true;
                                        }
                                    }
                                })
                            });

                            if (flag) {
                                return (mes)
                            }
                        }
                    }
                }
            }
        } else if (props.component === idealFuncSelector) { // if this state machine is the idealFunc's
            let idealFuncInterAdv = "";
            let idealFuncCompInter = "";

            interSelector.compInters.forEach((compInter) => {
                if (compInter.id === props.component.compositeDirectInterface) {
                    idealFuncCompInter = compInter;
                }
            });

            interSelector.basicInters.forEach((basicInter) => {
                if (basicInter.id === props.component.basicAdversarialInterface) {
                    idealFuncInterAdv = basicInter;
                }
            });

            if (mes.type === 'out') {
                if (idealFuncInterAdv) { // check existence
                    if (idealFuncInterAdv.messages.includes(mes.id)) {
                        return (mes)
                    }
                }

                if (idealFuncCompInter) { // check existence
                    let flag = false; // use a flag to signal message is part of idealFunc, can't return due to nested forEach()
                    interSelector.basicInters.forEach((basicInter) => {
                        idealFuncCompInter.basicInterfaces.forEach((basicInterfaceInComp) => {
                            if (basicInterfaceInComp.idOfBasic === basicInter.id) {
                                if (basicInter.messages.includes(mes.id)) {
                                    flag = true;
                                }
                            }
                        });
                    });
                    
                    if (flag) {
                        return (mes)
                    }
                }
            }
        } else { // this state machine is a party's
            let partyInterAdv = "";
            let partyInterDir = "";
            interSelector.compInters.forEach((compInter) => {
                compInter.basicInterfaces.forEach((basicInter) => {
                    if (basicInter.idOfInstance === props.component.basicAdversarialInterface) {
                        partyInterAdv = interSelector.basicInters.find(element => element.id === basicInter.idOfBasic);
                    }
                    if (basicInter.idOfInstance === props.component.basicDirectInterface) {
                        partyInterDir = interSelector.basicInters.find(element => element.id === basicInter.idOfBasic);
                    }
                });
            });
            
            if (mes.type === 'out') {
                if (partyInterAdv.messages) { // check existence
                    if (partyInterAdv.messages.includes(mes.id)) {
                        return (mes)
                    }
                }
                if (partyInterDir.messages) { // check existence
                    if (partyInterDir.messages.includes(mes.id)) {
                        return (mes)
                    }
                }
            }
        }
    };
    const checkMessageType = (mesID, transition) => {
        let flag = false;
        //Returns True on Direct Message Adversarial message returns False
        //Check internal interfaces
        interSelector.basicInters.forEach((basicInter) => {
            basicInter.messages.forEach((message) => {
                if (message === mesID) {
                    if(basicInter.type === "direct"){
                        flag = true;
                    }
                }
            });
        });
        
        return flag

    }
    const setInterfacePortFromMessageID = (mesID, transition) => {
        let port = ""
        interSelector.messages.forEach((message) => {
            if(message.id === mesID){
                port = message.port
            }
        });
        if(port !== transition.targetPort && transition.targetPort !== ""){
            port = transition.targetPort
        }
        return port
    }
    const messagePathConstruction = (mes, type) => {
        if (type === "subFunc") {
            let subFuncPath = ""; // <subfunc name>.<component name>.<message name> (subfunc name)
            subFuncPath += subfuncSelector.subfunctionalities.find(element => element.id === mes.subfuncId).name + ".";
            let flag = false;

            subFuncMessages.some((subMessage) => {
                if (JSON.stringify(subMessage.compInter) !== '{}' && mes.basicInter.type === 'direct' && subMessage.subfuncId === mes.subfuncId) { // this is the ideal func's composite direct interface
                    subMessage.compInter.basicInterfaces.forEach((basicInComp) => {
                        if (basicInComp.idOfBasic === subMessage.basicInter.id) {
                            subFuncPath += basicInComp.name + "." + mes.name;
                            flag = true;
                        }
                    });
                } else if (props.component === simSelector) { // this belongs to the simulator
                    if (mes.basicInter.type === 'adversarial') {
                        subFuncPath += mes.basicInter.name + "." + mes.name;
                        flag = true;
                    }
                } else { // this is the ideal func's basic adversarial interface
                    mes.compInter.basicInterfaces.forEach((basicInComp) => {
                        if (basicInComp.idOfBasic === mes.basicInter.id) {
                            subFuncPath += basicInComp.name + "." + mes.name;
                            flag = true;
                        }
                    })
                    
                }
                
                return flag;
            });

            return (subFuncPath)

        } else if (type === "paramInter") {
            let paramInterPath = ""; // <parameter name>.<component name>.<message name> (parameter name)
            paramInterPath = realFuncSelector.parameterInterfaces.find(element => element.id === mes.paramInterId).name + ".";
            let flag = false;
    
            paramInterMessages.some((paramInterMessage) => {
                paramInterMessage.compInter.basicInterfaces.forEach((basicInComp) => {
                    if (basicInComp.idOfBasic === mes.basicInter.id && paramInterMessage.paramInterId === mes.paramInterId) {
                        paramInterPath += basicInComp.name + "." + mes.name;
                        flag = true;
                    }
                });
                return flag;
            });

            return (paramInterPath)
        }

        let thisInter = "";
        interSelector.basicInters.forEach((basicInter) => {
            basicInter.messages.forEach((message) => {
                if (message === mes.id) {
                    thisInter = basicInter;
                }
            });
        });

        if (props.component === simSelector) { // if this state machine is the simulator's          
            let simPath = "";
            if (thisInter.id === simSelector.basicAdversarialInterface) {
                simPath = thisInter.name + "." + mes.name;
            }

            if (simSelector.realFunctionality) {
                interSelector.compInters.forEach((compInter) => {
                    if (compInter.id === realFuncSelector.compositeAdversarialInterface) {
                        compInter.basicInterfaces.forEach((basicInterfaceInComp) => {
                            if (basicInterfaceInComp.idOfBasic === thisInter.id) {
                                simPath = realFuncSelector.name + "." + compInter.name + "." + basicInterfaceInComp.name + "." + mes.name;
                            }
                        });
                    }
                });
            }

            return (simPath)

        } else if (props.component === idealFuncSelector) { // if this state machine is the idealFunc's
            let idealFuncCompInter = "";

            interSelector.compInters.forEach((compInter) => {
                if (compInter.id === props.component.compositeDirectInterface) {
                    idealFuncCompInter = compInter;
                }
            });

            let idealFuncPath = "";

            interSelector.basicInters.forEach((basicInter) => {
                if (basicInter.id === props.component.basicAdversarialInterface) {
                    if (basicInter.messages.includes(mes.id)) {
                        idealFuncPath = basicInter.name + "." + mes.name;
                        return (idealFuncPath)
                    }
                }
            });

            if (idealFuncCompInter) { // check existence
                interSelector.basicInters.forEach((basicInter) => {
                    idealFuncCompInter.basicInterfaces.forEach((basicInterfaceInComp) => {
                        if (basicInterfaceInComp.idOfBasic === basicInter.id) {
                            if (basicInter.messages.includes(mes.id)) {
                                idealFuncPath = idealFuncCompInter.name + "." + basicInterfaceInComp.name + "." + mes.name;
                            }
                        }
                    });
                });
            } 

            return (idealFuncPath)
                         
        } else { // this state machine is a party's
            let partyInterAdv = "";
            let partyInterDir = "";
            let partyPath = "";
            interSelector.compInters.forEach((compInter) => {
                compInter.basicInterfaces.forEach((basicInter) => {
                    if (basicInter.idOfInstance === props.component.basicAdversarialInterface) {
                        partyInterAdv = interSelector.basicInters.find(element => element.id === basicInter.idOfBasic);
                        if (partyInterAdv.messages.includes(mes.id)) {
                            partyPath = compInter.name + "." + basicInter.name;
                        }         
                    }
                    if (basicInter.idOfInstance === props.component.basicDirectInterface) {
                        partyInterDir = interSelector.basicInters.find(element => element.id === basicInter.idOfBasic);
                        if (partyInterDir.messages.includes(mes.id)) {
                            partyPath = compInter.name + "." + basicInter.name;
                        }
                    }
                });
            });

            let newName = partyPath + "." + mes.name;
            return (newName)
        }
    };

    // Dropdown menu functions
    const [fromStateOptions, setFromStateOptions] = useState([]);
    const [inMessageOptions, setInMessageOptions] = useState([]);
    const [outMessageOptions, setOutMessageOptions] = useState([]);
    const [toStateOptions, setToStateOptions] = useState([]);

    useEffect(() => {
        let optionsArray = [{key : "state", value : "", label : "Select a From State..."}];
        thisStateMachineSelector.states.forEach(state => {
            optionsArray.push({key : "state-" + state, value : state, label : DisplayNameSetup(stateMachineSelector.states.find(element => element.id === state).name, stateDropDownDisplayLength)});
        });
        setFromStateOptions(optionsArray);
    }, [thisStateMachineSelector]);

    useEffect(() => {
        let optionsArray = [{key : "inMessage", value : "", label : "Select an In Message..."}];
        interSelector.messages.filter(messageFilterIn).forEach(message => {
            optionsArray.push({key : "message-" + message.id, value : message.id, label : messagePathConstruction(message, "misc")});
        });
        // Options for subfunc out messages
        partySelector.parties.findIndex(element => element.stateMachine === thisStateMachineSelector.id) !== -1 && subFuncMessages.forEach(message => {
            (message.type === "out" && subfuncSelector.subfunctionalities.find(element => element.id === message.subfuncId) && message.basicInter.type === "direct" &&
            optionsArray.push({key : "message-" + message.id + message.subfuncId, value : message.id, label : messagePathConstruction(message, "subFunc")}));
        });
        // Options for parameterInterfaces out messages
        partySelector.parties.findIndex(element => element.stateMachine === thisStateMachineSelector.id) !== -1 && paramInterMessages.forEach(message => {
            (message.type === "out" && realFuncSelector.parameterInterfaces.find(element => element.id === message.paramInterId) && message.basicInter.type === "direct" &&
            optionsArray.push({key : "message-" + message.id + message.paramInterId, value : message.id, label : messagePathConstruction(message, "paramInter")}));
        });
        // Options for sim subfunc out messages
        (props.component === simSelector) && subFuncMessages.forEach(message => {
            (message.type === "in" && subfuncSelector.subfunctionalities.find(element => element.id === message.subfuncId) && message.basicInter.type === "adversarial" &&
            optionsArray.push({key : "message-" + message.id + message.subfuncId, value : message.id, label : messagePathConstruction(message, "subFunc")}));
        });
        // Options for sim parameterInterfaces out messages
        (props.component === simSelector) && paramInterMessages.forEach(message => {
            (message.type === "in" && realFuncSelector.parameterInterfaces.find(element => element.id === message.paramInterId) && message.basicInter.type === "adversarial" &&
            optionsArray.push({key : "message-" + message.id + message.paramInterId, value : message.id, label : messagePathConstruction(message, "paramInter")}));
        });
        setInMessageOptions(optionsArray);

    }, [interSelector, partySelector, paramInterMessages, subFuncMessages]);

    useEffect(() => {
        let optionsArray = [{key : "outMessage", value : "", label : "Select an Out Message..."}];
        interSelector.messages.filter(messageFilterOut).forEach(message => {
            optionsArray.push({key : "message-" + message.id, value : message.id, label : messagePathConstruction(message, "misc")});
        });
        // Options for subfunc in messages
        partySelector.parties.findIndex(element => element.stateMachine === thisStateMachineSelector.id) !== -1 && subFuncMessages.forEach(message => {
            (message.type === "in" && subfuncSelector.subfunctionalities.find(element => element.id === message.subfuncId) && message.basicInter.type === "direct" &&
            optionsArray.push({key : "message-" + message.id + message.subfuncId, value : message.id, label : messagePathConstruction(message, "subFunc")}));
        });
        // Options for parameterInterfaces in messages
        partySelector.parties.findIndex(element => element.stateMachine === thisStateMachineSelector.id) !== -1 && paramInterMessages.forEach(message => {
            (message.type === "in" && realFuncSelector.parameterInterfaces.find(element => element.id === message.paramInterId) && message.basicInter.type === "direct" &&
            optionsArray.push({key : "message-" + message.id + message.paramInterId, value : message.id, label : messagePathConstruction(message, "paramInter")}));
        });
        // Options for sim subfunc in messages
        (props.component === simSelector) && subFuncMessages.forEach(message => {
            (message.type === "out" && subfuncSelector.subfunctionalities.find(element => element.id === message.subfuncId) && message.basicInter.type === "adversarial" &&
            optionsArray.push({key : "message-" + message.id + message.subfuncId, value : message.id, label : messagePathConstruction(message, "subFunc")}));
        });
        // Options for sim parameterInterfaces in messages
        (props.component === simSelector) && paramInterMessages.forEach(message => {
            (message.type === "out" && realFuncSelector.parameterInterfaces.find(element => element.id === message.paramInterId) && message.basicInter.type === "adversarial" &&
            optionsArray.push({key : "message-" + message.id + message.paramInterId, value : message.id, label : messagePathConstruction(message, "paramInter")}));
        });
        setOutMessageOptions(optionsArray);
    }, [interSelector, partySelector, subFuncMessages, paramInterMessages]);

    useEffect(() => {
        let optionsArray = [{key : "toState", value : "", label : "Select a To State..."}];
        thisStateMachineSelector.states.forEach(state => {
            (thisStateMachineSelector.initState !== state) &&
            optionsArray.push({key : "state-" + state, value : state, label : DisplayNameSetup(stateMachineSelector.states.find(element => element.id === state).name, stateDropDownDisplayLength)}) 
        });
        setToStateOptions(optionsArray);
    }, [thisStateMachineSelector, stateMachineSelector]);

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
                    <div className="smHeader">
                        <header className="smTitle">{DisplayNameSetup(props.component.name, stateNameDnDMaxLength)} State Machine</header>
                        <div className="smOptions">
                            <FontAwesomeIcon data-testid="smOptions" icon={faGear} onClick={handleShow}/>
                        </div>
                    </div>
                    {stateMachineSelector.stateMachines[stateMachineSelector.stateMachines.findIndex(element => element.id === props.component.stateMachine)].states.map((state, idx) => (
                       (displayState[state]) && 
                        <State id={ state } key={ state } draggable={ true }
                               disp={ displayState[state] } 
                               index={ idx } stateMachine={thisStateMachineSelector.id}
                               remove={remove}
                               initState={ (thisStateMachineSelector.initState === state) }/>
                    ))}
                </div>
            </div>
            <Modal show={show} onHide={handleClose} animation={false} data-testid="stateMachine-modal">
                <Modal.Header> 
                    <Modal.Title>Configure { DisplayNameSetup(props.component.name, stateNameDnDModalMaxLength) } State Machine</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div id="dropdown-container">
                        <div id="transitions-container">
                            <span className="transitionTitle">Transitions
                                <FontAwesomeIcon className="transitionAdd" icon={faPlus} variant="outline-success" title="Add Transition"
                                                onClick={() => {addTransition()}} 
                                                />
                            </span>
                            { thisStateMachineSelector && 
                            (stateMachineSelector.transitions.filter(value => thisStateMachineSelector.transitions.includes(value.id)).map((transition, idx) => (
                                <Accordion key={"accordion-" + transition.id} data-testid="accorTransition" className="smaccordion" id="transitionAccordion">
                                    <Accordion.Item eventKey="0">
                                        <Accordion.Header data-testid="accorTransitionButton">
                                            <FontAwesomeIcon className="transitionDel" icon={faTrash} title="Delete Transition" 
                                                            onClick={() => deleteTransition(transition.id)} 
                                                            />
                                            {   transition.inMessage && transition.outMessage ?
                                                (subFuncMessages.find(element => element.id === transition.inMessage) ? subFuncMessages.find(element => element.id === transition.inMessage).name :
                                                paramInterMessages.find(element => element.id === transition.inMessage) ? paramInterMessages.find(element => element.id === transition.inMessage).name :
                                                interSelector.messages.find(element => element.id === transition.inMessage) ? interSelector.messages.find(element => element.id === transition.inMessage).name : "inMessage") + " / " +
                                                (subFuncMessages.find(element => element.id === transition.outMessage) ? subFuncMessages.find(element => element.id === transition.outMessage).name :
                                                paramInterMessages.find(element => element.id === transition.outMessage) ? paramInterMessages.find(element => element.id === transition.outMessage).name :
                                                interSelector.messages.find(element => element.id === transition.outMessage) ? interSelector.messages.find(element => element.id === transition.outMessage).name : "outMessage") :
                                                "Transition Name"  }
                                        </Accordion.Header>
                                        <Accordion.Body>
                                            <Row>
                                                <Col>
                                                    <Select 
                                                        options={fromStateOptions}
                                                        getOptionValue ={(option)=>option.label}
                                                        placeholder="Select a From State..."
                                                        defaultValue={{ value : (transition.fromState && transition.fromState) || "",
                                                            label : transition.fromState && fromStateOptions && fromStateOptions.find(fromState => fromState.value === transition.fromState) ? fromStateOptions.find(fromState => fromState.value === transition.fromState).label : "Select a From State..."}}
                                                        ref={transitionFromStateRefArray[idx]}
                                                    />
                                                </Col>
                                                <Col>
                                                    <Select 
                                                        options={inMessageOptions}
                                                        getOptionValue ={(option)=>option.label}
                                                        placeholder="Select an In Message..."
                                                        defaultValue={{ value : (transition.inMessage && transition.inMessage) || "",
                                                        label : transition.inMessage && inMessageOptions && inMessageOptions.find(message => message.value === transition.inMessage) ? inMessageOptions.find(message => message.value === transition.inMessage).label : "Select an In Message..."}}
                                                        ref={transitionInMessageRefArray[idx]}
                                                    />
                                                </Col>
                                            </Row>
                                            <Row>
                                                <Col>
                                                    <Select 
                                                        options={outMessageOptions}
                                                        getOptionValue ={(option)=>option.label}
                                                        placeholder="Select an Out Message..."
                                                        defaultValue={{ value : (transition.outMessage && transition.outMessage) || "",
                                                            label : transition.outMessage && outMessageOptions && outMessageOptions.find(message => message.value === transition.outMessage) ? outMessageOptions.find(message => message.value === transition.outMessage).label : "Select an Out Message..."}}
                                                        ref={transitionOutMessageRefArray[idx]}
                                                        onChange={option => handleOutMessageChange(option, transition)}
                                                    />
                                                </Col>
                                                <Col>
                                                    <Select 
                                                        options={toStateOptions}
                                                        getOptionValue ={(option)=>option.label}
                                                        placeholder="Select a To State..."
                                                        defaultValue={{ value : (transition.toState && transition.toState) || "",
                                                            label : transition.toState && toStateOptions && toStateOptions.find(state => state.value === transition.toState) ? toStateOptions.find(state => state.value === transition.toState).label : "Select a To State..."}}
                                                        ref={transitionToStateRefArray[idx]}
                                                        onChange={option => handleToStateChange(option, transition)}
                                                    />
                                                </Col>
                                            </Row>
                                            {(transition.outMessage && checkMessageType(transition.outMessage, transition)) &&                                                  
                                                <Row>
                                                    <Form.Control
                                                            ref={transitionPortRefArray[idx]} className="outMessagePort"
                                                            type="text" autoComplete='off' placeholder='Target Port'
                                                            data-testid="TransitionPortInput" title="Out Message Port"
                                                            defaultValue={setInterfacePortFromMessageID(transition.outMessage, transition)}/>
                                                </Row>
                                            }
                                            <Row>
                                                <Form.Control
                                                        ref={transitionGuardRefArray[idx]} className="guardInput"
                                                        type="text" autoComplete='off' placeholder='Guard Description'
                                                        data-testid="guardInput" title="Guard Expression"
                                                        defaultValue={(transition.guard || "")} />
                                            </Row>
                                            { stateMachineSelector.states.find(element => element.id === transition.toState) && 
                                            <Accordion key={"accordion-inArguments"} data-testid="accorHeaderInArg" style={{width: "425px", marginTop: "10px"}}>
                                                <Accordion.Item id="accordion-inArguments-item">
                                                    <Accordion.Header data-testid="accorHeaderInArgButton" >
                                                            To State Arguments
                                                    </Accordion.Header>
                                                    <Accordion.Body>
                                                        { stateMachineSelector.states.find(element => element.id === transition.toState).parameters &&
                                                        (stateMachineSelector.states.find(element => element.id === transition.toState).parameters.map((inArg, argIdx) => (
                                                        <Row key={"inArg-" + inArg.id} className="argNamingRow">
                                                            <Col>
                                                                {inArg.name + (inArg.type ? " (" + inArg.type + ")" : "")}
                                                            </Col>
                                                            <Col>
                                                                <Form.Control key={transition + inArg.id}
                                                                            ref={e => transitionInArgRefs.current[transition.id + inArg.id] = e}
                                                                            defaultValue={ (transition.toStateArguments[argIdx] && transition.toStateArguments[argIdx].argValue) || "" }
                                                                            data-testid="inArgInput"
                                                                            id={"input-" + inArg.id}
                                                                            className="portnamebox" type="text" autoComplete="off"  
                                                                            placeholder="Argument Value"/>
                                                            </Col>
                                                        </Row>)))}
                                                    </Accordion.Body>
                                                </Accordion.Item>
                                            </Accordion>}
                                            { transition.outMessage && 
                                            <Accordion key={"accordion-outArguments"} data-testid="accorHeaderOutArg" style={{width: "425px", marginTop: "10px"}}>
                                                <Accordion.Item id="accordion-inArguments-item">
                                                    <Accordion.Header data-testid="accorHeaderOutArgButton">
                                                            Out Message Arguments
                                                    </Accordion.Header>
                                                    <Accordion.Body>
                                                        { subFuncMessages.find(element => element.id === transition.outMessage) ? subFuncMessages.find(element => element.id === transition.outMessage).parameters && 
                                                        (subFuncMessages.find(element => element.id === transition.outMessage).parameters.map((outArg, argIdx) => (
                                                        <Row key={"outArg-" + outArg.id} className="argNamingRow">
                                                            <Col>
                                                                {outArg.name + (outArg.type ? " (" + outArg.type + ")" : "")}
                                                            </Col>
                                                            <Col>
                                                                <Form.Control key={transition + outArg.id}
                                                                            ref={e => transitionOutArgRefs.current[transition.id + outArg.id] = e}
                                                                            defaultValue={ (transition.outMessageArguments[argIdx] && transition.outMessageArguments[argIdx].argValue) || "" }
                                                                            data-testid="outArgInput"
                                                                            className="portnamebox" type="text" autoComplete="off"
                                                                            placeholder="Argument Value" />
                                                            </Col>
                                                        </Row>))) :
                                                          paramInterMessages.find(element => element.id === transition.outMessage) ? paramInterMessages.find(element => element.id === transition.outMessage) &&
                                                        (paramInterMessages.find(element => element.id === transition.outMessage).parameters.map((outArg, argIdx) => (
                                                        <Row key={"outArg-" + outArg.id} className="argNamingRow">
                                                            <Col>
                                                                {outArg.name + (outArg.type ? " (" + outArg.type + ")" : "")}
                                                            </Col>
                                                            <Col>
                                                                <Form.Control key={transition + outArg.id}
                                                                            ref={e => transitionOutArgRefs.current[transition.id + outArg.id] = e}
                                                                            defaultValue={ (transition.outMessageArguments[argIdx] && transition.outMessageArguments[argIdx].argValue) || "" }
                                                                            data-testid="outArgInput"
                                                                            className="portnamebox" type="text" autoComplete="off"
                                                                            placeholder="Argument Value" />
                                                            </Col>
                                                        </Row>))) :
                                                          interSelector.messages.find(element => element.id === transition.outMessage) ? interSelector.messages.find(element => element.id === transition.outMessage).parameters &&
                                                        (interSelector.messages.find(element => element.id === transition.outMessage).parameters.map((outArg, argIdx) => (
                                                        <Row key={"outArg-" + outArg.id} className="argNamingRow">
                                                            <Col>
                                                                {outArg.name + (outArg.type ? " (" + outArg.type + ")" : "")}
                                                            </Col>
                                                            <Col>
                                                                <Form.Control key={transition + outArg.id}
                                                                            ref={e => transitionOutArgRefs.current[transition.id + outArg.id] = e}
                                                                            defaultValue={ (transition.outMessageArguments[argIdx] && transition.outMessageArguments[argIdx].argValue) || "" }
                                                                            data-testid="outArgInput"
                                                                            className="portnamebox" type="text" autoComplete="off"
                                                                            placeholder="Argument Value" />
                                                            </Col>
                                                        </Row>))) : ""}
                                                    </Accordion.Body>
                                                </Accordion.Item>
                                            </Accordion>}
                                        </Accordion.Body>
                                    </Accordion.Item>
                                </Accordion> 
                            )))}
                        </div>                                   
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="primary" onClick={saveComponentInfo}> Save Changes </Button>
                    <Button variant="secondary" onClick={handleClose}> Close </Button>
                </Modal.Footer>
            </Modal>
            { /* Arrows */ }
            { thisStateMachineSelector && isDone &&
            (stateMachineSelector.transitions.filter(value => thisStateMachineSelector.transitions.includes(value.id)).map((transition, idx) => (
                (transition.fromState && transition.toState) && (
                ((transition.fromState === transition.toState) ? (
                    <div
                        key={transition.id}
                        onMouseEnter={() => handleMouseEnter(idx)}
                        onMouseLeave={handleMouseLeave}
                        style={{position: 'absolute'}}
                    >
                        {/* Loop back transition arrow */}
                        <Xarrow key={ transition.id + "-connector" } start={ transition.fromState } end= { transition.toState } 
                                showHead={true} path="smooth" zIndex= {1}
                                lineColor={hoveredIndex === idx ? transitionColors.hover : transitionColors.normal} headColor={hoveredIndex === idx ? transitionColors.hover : transitionColors.normal}
                                labels={transition.inMessage && transition.outMessage && hoveredIndex === idx && 
                                    <div style={{ fontSize: "1em", color: "#126399", fontWeight: "500"}}>
                                        {   (subFuncMessages.find(element => element.id === transition.inMessage) ? subFuncMessages.find(element => element.id === transition.inMessage).name :
                                            paramInterMessages.find(element => element.id === transition.inMessage) ? paramInterMessages.find(element => element.id === transition.inMessage) :
                                            interSelector.messages.find(element => element.id === transition.inMessage) ? interSelector.messages.find(element => element.id === transition.inMessage).name : "inMessage") + " / " +
                                            (subFuncMessages.find(element => element.id === transition.outMessage) ? subFuncMessages.find(element => element.id === transition.outMessage).name :
                                            paramInterMessages.find(element => element.id === transition.outMessage) ? paramInterMessages.find(element => element.id === transition.outMessage).name :
                                            interSelector.messages.find(element => element.id === transition.outMessage) ? interSelector.messages.find(element => element.id === transition.outMessage).name : "outMessage")
                                        }
                                    </div>}
                                {...loopbackProps(transition)} 
                        />
                    </div>
                ) : 
                <div
                    key={transition.id}
                    onMouseEnter={() => handleMouseEnter(idx)}
                    onMouseLeave={handleMouseLeave}
                    style={{position: 'absolute'}}
                >
                    {/* Normal transition arrow */}
                    <Xarrow key={ transition.id + "-connector" } start={ transition.fromState } end= { transition.toState } 
                            showHead={true} path="smooth" zIndex= {1}
                            lineColor={hoveredIndex === idx ? transitionColors.hover : transitionColors.normal} headColor={hoveredIndex === idx ? transitionColors.hover : transitionColors.normal}
                            labels={transition.inMessage && transition.outMessage && hoveredIndex === idx &&
                                <div style={{ fontSize: "1em", color: "#126399", fontWeight: "500"}}>
                                        {   (subFuncMessages.find(element => element.id === transition.inMessage) ? subFuncMessages.find(element => element.id === transition.inMessage).name :
                                            paramInterMessages.find(element => element.id === transition.inMessage) ? paramInterMessages.find(element => element.id === transition.inMessage) :
                                            interSelector.messages.find(element => element.id === transition.inMessage) ? interSelector.messages.find(element => element.id === transition.inMessage).name : "inMessage") + " / " +
                                            (subFuncMessages.find(element => element.id === transition.outMessage) ? subFuncMessages.find(element => element.id === transition.outMessage).name :
                                            paramInterMessages.find(element => element.id === transition.outMessage) ? paramInterMessages.find(element => element.id === transition.outMessage).name :
                                            interSelector.messages.find(element => element.id === transition.outMessage) ? interSelector.messages.find(element => element.id === transition.outMessage).name : "outMessage")
                                        }                                
                                </div>}
                    />
                </div>))
            )))}
        </div>
    );
}

export default StateMachineDnD;
