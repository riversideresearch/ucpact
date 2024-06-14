/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useRef } from "react";
import Select from 'react-select';
import Form from 'react-bootstrap/Form';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import Dropdown from 'react-bootstrap/Dropdown';
import Accordion from 'react-bootstrap/Accordion';
import ToggleButton from 'react-bootstrap/ToggleButton';
import ToggleButtonGroup from 'react-bootstrap/ToggleButtonGroup';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import uuid from 'react-uuid';
import './interfaces.css';

import { useSelector, useDispatch } from 'react-redux'
import { setCompInterfaceNameDispatch, 
         addCompositeInterfaceDispatch,
         setCompInterfaceTypeDispatch,
         deleteCompInterfaceDispatch,
         setBasicInterfaceNameForCompositeDispatch,
         addBasicToCompositeDispatch,
         deleteBasicFromCompositeDispatch,
         setBasicInterfaceIDForCompositeDispatch,
         addBasicInterfaceDispatch,
         setBasicInterfaceNameDispatch,
         setMessageNameDispatch,
         setBasicInterfaceTypeDispatch,
         deleteBasicInterfaceDispatch,
         addMessageToInterfaceDispatch,
         deleteMessageFromInterfaceDispatch,
         setMessageTypeDispatch,
         addParameterToMessageDispatch,
         deleteParameterFromMessageDispatch,
         setParameterNameDispatch,
         setParameterTypeDispatch, 
         setMessagePortDispatch} from '../features/interfaces/interfacesSlice'
import { clearAdversarialInterfaceDispatch, clearDirectInterfaceDispatch, removeInterFromPartiesDispatch } from '../features/parties/partiesSlice'
import { removeInterFromSimDispatch } from '../features/simulators/simulatorSlice'
import { removeInterFromIFDispatch } from '../features/idealFunctionalities/idealFuncSlice'
import { removeInterFromRealFuncDispatch } from '../features/realFunctionalities/realFuncSlice';
import { removeOutArgumentFromTransitionsDispatch,
         addOutArgumentToTransitionDispatch } from '../features/stateMachines/stateMachineSlice';
import { DisplayNameSetup, upperCaseValidation, lowerCaseValidation } from "./helperFunctions";



function Interfaces(props) {
    /* 
       Composite Interfaces have the state: {id:<uuid>, name: <string>, type: <direct|adversarial>,
                                basicInterfaces: [{name:<string>, idOfBasic:<id of basic interface>,key:<uuid>}, ...]}
       Basic Interfaces have the state: {id:<uuid>, name: <string>, type: <direct|adversarial>,
                                   messages: [<id of message>,...]}
       Messages have the state: {id:<uuid>, name: <string>, type: <in|out>, port: <string>, parameters: [{name: <string>, id:<uuid>, type: <string>}, ...]}

    */
    
    const dispatch = useDispatch() // dispatch function for altering the Redux store
    const interSelector = useSelector((state) => state.interfaces) // Redux selector for interfaces
    const realFuncSelector = useSelector((state) => state.realFunctionality)
    const partySelector = useSelector((state) => state.parties)

    const [nameState, setNameState] = useState([]);
    
    //Name length constants
    const interfaceDisplayLength = 30;
    const messageDisplayLength = 25;
    const dropdownDisplayLength = 60;

    // Refs
    const basicInterNameRefs = useRef([])
    const compInterNameRefs = useRef([])
    const basicForCompIntNameRefs = useRef([])
    const parameterNameRefs = useRef({})
    const messageNameRefs = useRef([])
    const messagePortNameRefs = useRef([])
    
    useEffect(() => {
        const getData = setTimeout(() => {
            switch (nameState[nameState.length - 1]) {
                case "compositeName":
                    if(upperCaseValidation(nameState[1],true)){
                        setCompInterfaceName(nameState[0], nameState[1]);
                    }
                    break;
                case "basicName":
                    if(upperCaseValidation(nameState[1], true)){
                        setBasicInterfaceName(nameState[0], nameState[1]);
                    }
                    break;
                case "messageName":
                    if(lowerCaseValidation(nameState[1],true)){
                        setMessageName(nameState[0], nameState[1]);
                    }
                    break;
                case "messagePortName":
                    if(lowerCaseValidation(nameState[1],true)){
                        setMessagePortName(nameState[0], nameState[1]);
                    }
                    break;
                case "parameterName":
                    if(lowerCaseValidation(nameState[2], true)){
                        setParameterName(nameState[0], nameState[1], nameState[2]);
                    }
                    break;
                case "basicForComposite":
                    if(upperCaseValidation(nameState[2], true)){
                        setBasicInterfaceNameForComposite(nameState[0], nameState[1], nameState[2]);
                    }
                    break;
                case "parameterType":
                    setParameterType(nameState[0], nameState[1], nameState[2]);
                    break;
                default:
                    break;
            }
        }, 1000)

        return () => clearTimeout(getData)
    }, [nameState])

    const finalCall = (e) => {  
        e.preventDefault();  
        switch (nameState[nameState.length - 1]) {
            case "compositeName":
                if(upperCaseValidation(nameState[1],true)){
                    setCompInterfaceName(nameState[0], nameState[1]);
                }
                break;
            case "basicName":
                if(upperCaseValidation(nameState[1],true)){
                    setBasicInterfaceName(nameState[0], nameState[1]);
                }
                break;
            case "messageName":
                if(lowerCaseValidation(nameState[1],true)){
                    setMessageName(nameState[0], nameState[1]);
                }
                break;
            case "messagePortName":
                if(lowerCaseValidation(nameState[1],true)){
                    setMessagePortName(nameState[0], nameState[1]);
                }
                break;
            case "parameterName":
                if(lowerCaseValidation(nameState[2], true)){
                    setParameterName(nameState[0], nameState[1], nameState[2]);
                }
                break;
            case "basicForComposite":
                if(upperCaseValidation(nameState[2], true)){
                    setBasicInterfaceNameForComposite(nameState[0], nameState[1], nameState[2]);
                }
                break;
            case "parameterType":
                setParameterType(nameState[0], nameState[1], nameState[2]);
                break;
            default:
                break;
        }
    };

    /* 
      This function sets the name of a composite interface into the Redux compInters state
    */
    const setCompInterfaceName = (interID, value) => {
        dispatch(setCompInterfaceNameDispatch([interID, value]))  
    };

    /* 
      This function sets the name of a basic interface for a composite interface into the Redux compInters state
    */
    const setBasicInterfaceNameForComposite = (interID, index, value) => {
        dispatch(setBasicInterfaceNameForCompositeDispatch([interID, index, value]))
        dispatch(removeInterFromIFDispatch(interID))
        let testinterface = interSelector.compInters.find(int => int.id === interID);
        if(testinterface.id === realFuncSelector.compositeDirectInterface){
            realFuncSelector.parties.forEach(party => {
                let partyInterface = partySelector.parties[partySelector.parties.findIndex(element => element.id === party)].basicDirectInterface
                if(testinterface.basicInterfaces[index].idOfInstance === partyInterface){
                    dispatch(clearDirectInterfaceDispatch(party));
                }                   
            });
        }
        if(testinterface.id === realFuncSelector.compositeAdversarialInterface){
            realFuncSelector.parties.forEach(party => {
                let partyInterface = partySelector.parties[partySelector.parties.findIndex(element => element.id === party)].basicAdversarialInterface
                if(testinterface.basicInterfaces[index].idOfInstance === partyInterface){
                    dispatch(clearAdversarialInterfaceDispatch(party));  
                } 
            });
            dispatch(removeInterFromSimDispatch(interID))
        }
    };

    /* 
      This function sets the ID of a basic interface for a composite interface into the Redux compInters state
    */
    const setBasicInterfaceIDForComposite = (interID, index, value) => {
        dispatch(setBasicInterfaceIDForCompositeDispatch([interID, index, value]))
    };

    /* 
      This function sets the name of a basic interface into the Redux basicInters state
    */
    const setBasicInterfaceName = (interID, value) => {
        dispatch(setBasicInterfaceNameDispatch([interID, value]))
    };

    /* 
      This function sets the name of a message into the Redux messages state
    */
    const setMessageName = (msgID, value) => {
        dispatch(setMessageNameDispatch([msgID, value]))
    };
    /* 
      This function sets the name of a message port into the Redux messages state
    */
    const setMessagePortName = (msgID, value) => {
        dispatch(setMessagePortDispatch([msgID, value]))
    };
    /* 
      This function sets the name of a message into the Redux messages state
    */
      const setParameterName = (msgID, paraID, value) => {
        dispatch(setParameterNameDispatch([msgID, paraID, value]))
    };

    /* 
      This function sets the name of a message into the Redux messages state
    */
      const setParameterType = (msgID, paraID, value) => {
        dispatch(setParameterTypeDispatch([msgID, paraID, value]))
    };

    /* 
      This function sets the type of a composite interface into the Redux compInters state
      Types can be "direct" or "adversarial"
      It also removes interfaces from components based on type
    */
    const setCompInterfaceType = (interID, value) => {
        dispatch(setCompInterfaceTypeDispatch([interID, value]))
        dispatch(removeInterFromIFDispatch(interID))
        dispatch(removeInterFromRealFuncDispatch(interID))
        let testinterface = interSelector.compInters.find(int => int.id === interID);
        if(testinterface.id === realFuncSelector.compositeDirectInterface){
            realFuncSelector.parties.forEach(party => {
                dispatch(clearDirectInterfaceDispatch(party));   
            });
        }
        if(testinterface.id === realFuncSelector.compositeAdversarialInterface){
            realFuncSelector.parties.forEach(party => {
                dispatch(clearAdversarialInterfaceDispatch(party));   
            });
            dispatch(removeInterFromSimDispatch(interID))
        }
    };

    /* 
      This function sets the type of a basic interface into the Redux basicInters state
      Types can be "direct" or "adversarial"
      It also removes interfaces from components based on type
    */
    const setBasicInterfaceType = (interID, value) => {
        dispatch(setBasicInterfaceTypeDispatch([interID, value]))
        dispatch(removeInterFromPartiesDispatch(interID))
        dispatch(removeInterFromSimDispatch(interID))
        dispatch(removeInterFromIFDispatch(interID))
    };

    /* 
      This function sets the type of a message into the Redux messages state
      Types can be "in" or "out"
    */
    const setMessageType = (msgID, value) => {
        dispatch(setMessageTypeDispatch([msgID, value]))
    };

    /*
      This function adds a new composite interface with default values into the Redux compInters state
    */
    const addCompositeInterface = () => {
        let interId = uuid();
        let inter = {id: interId, name: "", type: "direct", basicInterfaces:[]};
        dispatch(addCompositeInterfaceDispatch(inter))
    };

    /*
      This function adds a new basic interface with default values into the Redux baiscInters state
    */
    const addBasicInterface = () => {
        let interId = uuid();
        let inter = {id: interId, name: "", type: "direct", messages: []};
        dispatch(addBasicInterfaceDispatch(inter))
    };

    /*
      This function adds a new basic interface with default values to a composite interface into the Redux compInters state
    */
    const addBasicToComposite = (interID) => {
        dispatch(addBasicToCompositeDispatch(interID))
    };

    /*
      This function adds a new message with default values to a composite interface into the Redux compInters state
    */
    const addMessageToInterface = (interID) => {
        dispatch(addMessageToInterfaceDispatch(interID))
    };

    const addParameterToMessage = (msgID) => {
        let paraID = uuid();
        dispatch(addParameterToMessageDispatch([paraID, msgID]))
        dispatch(addOutArgumentToTransitionDispatch([paraID, msgID]))
    };

    /*
      This function deletes a composite interface from the Redux compInters state
      It also removes the interface from the corresponding components
    */
    const deleteCompositeInterface = (interID) => {
        dispatch(deleteCompInterfaceDispatch(interID))
        dispatch(removeInterFromIFDispatch(interID))
        dispatch(removeInterFromRealFuncDispatch(interID))
        let testinterface = interSelector.compInters.find(int => int.id === interID);
        if(testinterface.id === realFuncSelector.compositeDirectInterface){
            realFuncSelector.parties.forEach(party => {
                dispatch(clearDirectInterfaceDispatch(party));   
            });
        }
        if(testinterface.id === realFuncSelector.compositeAdversarialInterface){
            realFuncSelector.parties.forEach(party => {
                dispatch(clearAdversarialInterfaceDispatch(party));   
            });
        }
    };

    /*
      This function deletes a basic interface from the Redux basicInters state
      It also removes the interface from the corresponding components
    */
    const deleteBasicInterface = (interID) => {
        dispatch(deleteBasicInterfaceDispatch(interID))
        dispatch(removeInterFromPartiesDispatch(interID))
        dispatch(removeInterFromSimDispatch(interID))
        dispatch(removeInterFromIFDispatch(interID))
    };

    /*
      This function deletes a basic interface from a composite interface from the Redux compInters state
    */
    const deleteBasicFromComposite = (interID, index) => {
        
        //Need to get id of basic interface deleted from composite
        // Then remove it from parties that use it
        let testinterface = interSelector.compInters.find(int => int.id === interID);
        let basicInstance = testinterface.basicInterfaces[index]
        if(testinterface.id === realFuncSelector.compositeDirectInterface){
            realFuncSelector.parties.forEach(party => {
                let partyInterface = partySelector.parties[partySelector.parties.findIndex(element => element.id === party)].basicDirectInterface
                if(partyInterface === basicInstance.idOfInstance){
                    dispatch(clearDirectInterfaceDispatch(party))
                }
                  
            });
        }
        if(testinterface.id === realFuncSelector.compositeAdversarialInterface){
            realFuncSelector.parties.forEach(party => {
                let partyInterface = partySelector.parties[partySelector.parties.findIndex(element => element.id === party)].basicAdversarialInterface
                if(partyInterface === basicInstance.idOfInstance){
                    dispatch(clearAdversarialInterfaceDispatch(party));
                }
                   
            });
        }
        dispatch(deleteBasicFromCompositeDispatch([interID, index]))
    };

    /*
      This function deletes a message from a basic interface from the Redux basicInters state
      It also deletes the message from the Redux messages state
    */
    const deleteMessageFromInterface = (interID, msgID) => {
        dispatch(deleteMessageFromInterfaceDispatch([interID, msgID]))
    };

    /*
      This function deletes a parameter from a message from the Redux state
    */
      const deleteParameterFromMessage = (msgID, paraID) => {
        dispatch(deleteParameterFromMessageDispatch([msgID, paraID]))
        dispatch(removeOutArgumentFromTransitionsDispatch(paraID))
    };


    const upperCheckBasic = (idx) => {
        if(basicInterNameRefs.current[idx]){
            return upperCaseValidation(basicInterNameRefs.current[idx].value, false)
        }else{
            return true
        }
    }
    const upperCheckComp = (idx) => {
        if(compInterNameRefs.current[idx]){
            return upperCaseValidation(compInterNameRefs.current[idx].value, false)
        }else{
            return true
        }
    }
    const upperCheckBasicForComp = (idx) => {
        if(basicForCompIntNameRefs.current[idx]){
            return upperCaseValidation(basicForCompIntNameRefs.current[idx].value, false)
        }else{
            return true
        }
    }
    const lowerCheckParameter = (idx) => {
        if(parameterNameRefs.current[idx]){
            return lowerCaseValidation(parameterNameRefs.current[idx].value, false)
        }else{
            return true
        }
    }
    const lowerCheckMessage = (idx) => {
        if(messageNameRefs.current[idx]){
            return lowerCaseValidation(messageNameRefs.current[idx].value, false)
        }else{
            return true
        }
    }
    const lowerCheckMessagePort = (idx) => {
        if(messagePortNameRefs.current[idx]){
            return lowerCaseValidation(messagePortNameRefs.current[idx].value, false)
        }else{
            return true
        }
    }
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
          }
        
    }

    // Dropdown menu functions
    let optionsArray = [];

    const makeBasicIntanceOptions = (value) => {
        optionsArray = [{key : "basic-interface-id", value : "", label : "Select an Interface..."}];
        interSelector.basicInters.filter(basicInt => basicInt.type === value.type).forEach(basicInt => {
            optionsArray.push({key : "basic-interface-id-" + basicInt.id, value : basicInt.id, label : DisplayNameSetup(basicInt.name, dropdownDisplayLength)});
        });
        return optionsArray;
    }

    return (
        <div className="interBox">
            <Form className="interForm">
                <span className="interTitle">Interfaces
                    <Dropdown className="interAdd">
                      <Dropdown.Toggle className="interAdd-toggle" variant="primary-outline">
                        <FontAwesomeIcon className="interAdd" icon={faPlus} variant="outline-success" title="Add Interface" />
                      </Dropdown.Toggle>
                      <Dropdown.Menu>
                        <Dropdown.Item onClick={addBasicInterface} title="Add Basic Interface">Basic Interface</Dropdown.Item>
                        <Dropdown.Item onClick={addCompositeInterface} title="Add Composite Interface">Composite Interface</Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                </span>
                <div className='allInterfaces'>
                    <Form.Group className="mb-3">
                        <div className="BasicInterfacesCol">
                            <h4> Basic Interfaces </h4>
                        { interSelector.basicInters.map((value, idx) => (
                            <Accordion key={"accordion-" + value.id} data-testid="accorBasicHeader" className="accordion-basic-interface">
                                <Accordion.Item eventKey="0">
                                    <Accordion.Header data-testid="accorBasicHeaderButton">
                                        <FontAwesomeIcon className="interfaceDel" icon={faTrash} title="Delete Basic Interface" 
                                                        onClick={() => deleteBasicInterface(value.id)} />
                                        { value.name ? DisplayNameSetup(value.name, interfaceDisplayLength) : "Interface Name" }
                                                                                  
                                    </Accordion.Header>
                                    <Accordion.Body>                                        
                                        <Row>
                                            <Col>
                                                <Form.Control key={"basic-interface-name-" + value.id} id={"basic-interface-name-" + value.id}
                                                    defaultValue={value.name || ""}
                                                    ref={e => basicInterNameRefs.current[idx] = e} onChange={ e => setNameState([value.id, e.target.value, "basicName"]) }
                                                    onBlur={e => finalCall(e) } isInvalid={!upperCheckBasic(idx)}
                                                    type="text" autoComplete='off' placeholder='Interface Name'
                                                    onKeyDown={handleKeyDown}/>
                                            </Col>
                                            <Col>
                                                <ToggleButtonGroup name={"radio-" + value.id} type="radio" value={value.type} 
                                                                
                                                                onChange={ (v,e) => setBasicInterfaceType(value.id, v) }>
                                                    <ToggleButton id={"tbg-radio-direct-" + value.id} variant='outline-success' value={"direct"} title={"directBasicButton"}>
                                                        Direct
                                                    </ToggleButton>
                                                    <ToggleButton id={"tbg-radio-adv-" + value.id} variant='outline-danger' value={"adversarial"} title={"adversarialBasicButton"}>
                                                        Adversarial
                                                    </ToggleButton>
                                                </ToggleButtonGroup>
                                            </Col>
                                        </Row>
                                        <Row>
                                            <span className="messageTitle">Messages
                                            <FontAwesomeIcon className="messageAdd" icon={faPlus} variant="outline-success" 
                                                            onClick={() => {addMessageToInterface(value.id)}} title="Add Message" />
                                            </span>
                                        </Row>
                                        { interSelector.messages.filter(message => value.messages.includes(message.id)).map((message, idc) => (
                                            <Accordion key={"accordion-" + message.id} data-testid="accorHeaderMessage" className="accordion-message">
                                                <Accordion.Item eventKey="0">
                                                    <Accordion.Header data-testid="accorHeaderMessageButton">
                                                        <FontAwesomeIcon className="messageDel" icon={faTrash} title="Delete Message" 
                                                            onClick={() => deleteMessageFromInterface(value.id, message.id)} />
                                                            { message.name ? DisplayNameSetup(message.name, messageDisplayLength) : "Message Name" }
                                                    </Accordion.Header>
                                                    <Accordion.Body>
                                                        <Row key={"message-" + value.id + "-" + message.id} className="messageNamingRow">
                                                            <Col>
                                                                <Form.Control key={"basic-message-name" + message.id} id={"basic-message-name" + message.id}
                                                                            defaultValue={message.name || ""}
                                                                            ref={e => messageNameRefs.current[idc] = e} className="messagenamebox" type="text" autoComplete="off"
                                                                            onChange={ e => setNameState([message.id, e.target.value, "messageName"]) }
                                                                            onBlur={e => finalCall(e) } isInvalid={!lowerCheckMessage(idc)}
                                                                            placeholder="Message Name" onKeyDown={handleKeyDown}/>
                                                            </Col>
                                                            {(value.type === 'direct') ? 
                                                            <Col>
                                                                <Form.Control key={"basic-message-port" + message.id} id={"basic-message-port" + message.id}
                                                                            defaultValue={message.port || ""}
                                                                            ref={e => messagePortNameRefs.current[idc] = e} className="portnamebox" type="text" autoComplete="off"
                                                                            onChange={ e => setNameState([message.id, e.target.value, "messagePortName"]) }
                                                                            onBlur={e => finalCall(e) } isInvalid={!lowerCheckMessagePort(idc)}
                                                                            placeholder="Port Name" onKeyDown={handleKeyDown}/>
                                                            </Col>: 
                                                            setMessagePortName(message.id, "")}
                                                            <Col>
                                                                <ToggleButtonGroup name={"radio-" + value.id + "-" + message.id} type="radio" value={message.type} 
                                                                                onChange={ (v,e) => setMessageType(message.id, v) }>
                                                                    <ToggleButton id={"tbg-radio-in-" + value.id + "-" + message.id} variant='outline-info' data-testid="message-in" value={"in"}>
                                                                        In 
                                                                    </ToggleButton>
                                                                    <ToggleButton id={"tbg-radio-out-" + value.id + "-" + message.id} variant='outline-dark' data-testid="message-out" value={"out"}>
                                                                        Out 
                                                                    </ToggleButton>
                                                                </ToggleButtonGroup>
                                                            </Col>
                                                        </Row>
                                                        <Row>
                                                            <span className="parameterTitle">Parameters
                                                            <FontAwesomeIcon className="parameterAdd" icon={faPlus} variant="outline-success" 
                                                                            onClick={() => {addParameterToMessage(message.id)}} title="Add Parameter" />
                                                            </span>
                                                        </Row>
                                                        { message.parameters.map((parameter) =>
                                                            <Row key={"parameter-" + message.id + "-" + parameter.id}>
                                                                <Col className="parameterDelCol">
                                                                    <FontAwesomeIcon className="parameterDel" icon={faTrash} title="Delete Parameter" 
                                                                                    onClick={() => deleteParameterFromMessage(message.id, parameter.id)} />
                                                                </Col>
                                                                <Col>
                                                                    <Form.Control key={"basic-message-param-name" + parameter.id} id={"basic-message-param-name" + parameter.id} 
                                                                                defaultValue={parameter.name || ""}
                                                                                ref={e => parameterNameRefs.current[message.id+parameter.id] = e} type="text" autoComplete="off"
                                                                                onChange={ e => setNameState([message.id, parameter.id, e.target.value, "parameterName"]) }
                                                                                onBlur={e => finalCall(e) } isInvalid={!lowerCheckParameter(message.id+parameter.id)}
                                                                                placeholder="Parameter Name" className='parametertextbox' onKeyDown={handleKeyDown}/>
                                                                </Col>
                                                                <Col>
                                                                    <Form.Control key={"basic-messsage-parameter-type" + parameter.id} id={"basic-messsage-parameter-type" + parameter.id}
                                                                                defaultValue={parameter.type || ""}
                                                                                type="text" autoComplete="off"
                                                                                onChange={ e => setNameState([message.id, parameter.id, e.target.value, "parameterType"]) }
                                                                                onBlur={e => finalCall(e) } 
                                                                                placeholder="Parameter Type" className='parametertextbox' onKeyDown={handleKeyDown}/>
                                                                </Col>
                                                            </Row>
                                                        )}
                                                    </Accordion.Body>
                                                </Accordion.Item>
                                            </Accordion>
                                        ))}
                                    </Accordion.Body>
                                </Accordion.Item>
                            </Accordion>
                        )) 
                        }
                        </div>
                        </Form.Group>
                        <Form.Group className='mb-3'>
                        <div className='CompositeInterfaceCol'>
                            <h4> Composite Interfaces </h4>
                        { interSelector.compInters.map((value, idx) => (
                            <Accordion key={"accordion-" + value.id} data-testid="accorCompHeader" className="accordion-composite-interface">
                                <Accordion.Item eventKey="0">
                                    <Accordion.Header data-testid="accorCompHeaderButton">
                                        <FontAwesomeIcon className="interfaceDel" icon={faTrash} title="Delete Composite Interface" 
                                                        onClick={() => deleteCompositeInterface(value.id)} />
                                        { value.name ? DisplayNameSetup(value.name, interfaceDisplayLength) : "Interface Name" }
                                    </Accordion.Header>
                                    <Accordion.Body>
                                        <Row>
                                            <Col>
                                                <Form.Control key={"cmop-interface-name-" + value.id} id={"cmop-interface-name-" + value.id} 
                                                            defaultValue={value.name || ""}
                                                            ref={e => compInterNameRefs.current[idx] = e} onChange={ e => setNameState([value.id, e.target.value, "compositeName"]) } 
                                                            onBlur={e => finalCall(e) } isInvalid={!upperCheckComp(idx)}
                                                            type="text" autoComplete='off' placeholder='Interface Name' onKeyDown={handleKeyDown}/>
                                            </Col>
                                            <Col>
                                                <ToggleButtonGroup name={"radio-" + value.id} type="radio" value={value.type} 
                                                                
                                                                onChange={ (v,e) => setCompInterfaceType(value.id, v) }>
                                                    <ToggleButton id={"tbg-radio-direct-" + value.id} variant='outline-success' value={"direct"} title={"directCompButton"}>
                                                        Direct
                                                    </ToggleButton>
                                                    <ToggleButton id={"tbg-radio-adv-" + value.id} variant='outline-danger' value={"adversarial"} title={"adversarialCompButton"}>
                                                        Adversarial
                                                    </ToggleButton>
                                                </ToggleButtonGroup>
                                            </Col>
                                        </Row>
                                        <Row>
                                            <span className="messageTitle">Basic Interfaces
                                            <FontAwesomeIcon className="messageAdd" icon={faPlus} variant="outline-success" 
                                                            onClick={() => {addBasicToComposite(value.id)}} title="Add Basic to Composite" />
                                            </span>
                                        </Row>
                                        { value.basicInterfaces.map((inter, index) => (
                                            <Row key={"basic-interface-" + inter.idOfInstance}>
                                                <Col className="messageDelCol">
                                                    <FontAwesomeIcon className="messageDel" icon={faTrash} title="Delete Basic Instance" 
                                                                onClick={() => deleteBasicFromComposite(value.id, index)} />
                                                </Col>
                                                <Col>
                                                    <Form.Control key={"comp-interface-basic-name" + inter.idOfInstance} id={"comp-interface-basic-name" + inter.idOfInstance} 
                                                                defaultValue={inter.name || ""}
                                                                ref={e => basicForCompIntNameRefs.current[index] = e} type="text" autoComplete="off"
                                                                onChange={ e => setNameState([value.id, index, e.target.value, "basicForComposite"]) }
                                                                onBlur={e => finalCall(e) } onKeyDown={handleKeyDown}
                                                                isInvalid={!upperCheckBasicForComp(index)}
                                                                placeholder="Instance Name"/>
                                                </Col>
                                                <Col>
                                                    <Select 
                                                        options={makeBasicIntanceOptions(value)}
                                                        getOptionValue ={(option)=>option.label}
                                                        placeholder="Select an Interface..."
                                                        defaultValue={{ value : (inter.idOfBasic) || "",
                                                            label : optionsArray && optionsArray.find(basicInt => basicInt.value === inter.idOfBasic) ? optionsArray.find(basicInt => basicInt.value === inter.idOfBasic).label : "Select an Interface..."}}                                                        key={"comp-interface-basic-id" + inter.idOfInstance} id={"comp-interface-basic-id" + inter.idOfInstance} 
                                                        onChange={ e => setBasicInterfaceIDForComposite(value.id, index, e.value)}
                                                    />
                                                </Col>
                                            </Row>
                                        ))}
                                    </Accordion.Body>
                                </Accordion.Item>
                            </Accordion>
                        )) 
                        }
                        </div>
                        
                    </Form.Group>
                </div>
            </Form>
        </div>
    );
}

export default Interfaces
