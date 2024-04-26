import React, { useState } from 'react';
import './state.css';
import { useDrag } from 'react-dnd';
import { Button, Modal, Form } from "react-bootstrap";
import './stateMachines.css';
import { useDispatch, useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faGear, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { CirclePicker } from 'react-color';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import Accordion from 'react-bootstrap/Accordion';
import { faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import uuid from 'react-uuid';
import { Store } from "react-notifications-component";
import { changeStateDispatch, 
         removeStateDispatch,
         addParameterToStateDispatch,
         removeParameterFromStateDispatch,
         removeInArgumentFromTransitionsDispatch,
         addInArgumentToTransitionDispatch } from '../features/stateMachines/stateMachineSlice';
import { DisplayNameSetup, lowerCaseValidation, upperCaseValidation } from './helperFunctions';

var paraNameRefArray = [];
var paraTypeRefArray = [];

function State(props) {   

    const dispatch = useDispatch();

    // Redux selector for State Machine state
    const stateMachineSelector = useSelector((state) => state.stateMachines);
    const transitionSelector = useSelector((state) => state.stateMachines.transitions);
    const thisStateSelector = stateMachineSelector.states.find(element => element.id === props.id);

    const [show, setShow] = useState(props.id && !thisStateSelector.name);

    const [state, setState] = useState({color: "#e3c85b", colorTemp: "#e3c85b"});

    const [key, setKey] = useState(0);

    const handleClose = () => {
        let updatedValue = {
            "colorTemp": state.color,
        }
        setState(prevState => ({
            ...prevState,
            ...updatedValue
        }));

        // Reinitialize the ref arrays
        paraNameRefArray = [];
        paraTypeRefArray = [];
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
    };
    

    const nameRef = React.createRef();

    const handleShow = () => {
        thisStateSelector.parameters.forEach(nameRef => {
            let paraNameRef = React.createRef();
            let paraTypeRef = React.createRef();
            paraNameRefArray.push(paraNameRef);
            paraTypeRefArray.push(paraTypeRef);
        });

        setShow(true);
    };    

    const [{ isDragging }, dragRef] = useDrag(() => ({
        type: "ucComp",
        item: { type: "state", id: props.id },
        canDrag: props.draggable,
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    }), []);

    // Deletes the state if it is not utilized in any state machines
    const handleDeleteComponent = () => {
        let isUsed = false;
        
        transitionSelector.forEach((transition) => {
            if ((transition.toState === thisStateSelector.id) || (transition.fromState === thisStateSelector.id)) {
                isUsed = true;
            }
        });

        if (isUsed) {
            let notiMessage = "Message: State is currently being used by one or more transitions. STATE NOT DELETED";
            let notiTitle = "State Deletion Failure";
            let notiType = 'danger';
            let notification = {
                title:   notiTitle,
                message: notiMessage,
                type:    notiType,
                insert:  "top",
                container: "top-right",
                animationIn: ["animate__animated", "animate__fadeIn"],
                animationOut: ["animate__animated", "animate__fadeOut"],
                dismiss: {
                    duration: 10000,
                    onScreen: true
                }
            };
            Store.addNotification(notification);
        } else {
            props.remove(props.id);
            dispatch(removeStateDispatch(props.id));

            // Reinitialize the ref arrays
            paraNameRefArray = [];
            paraTypeRefArray = [];
            setShow(false);
        }
    }

    const saveComponentInfo = (e) => {
        e.preventDefault();
        let parameters = [];
        let parametersAreGood = true
        thisStateSelector.parameters.forEach((parameter, idx) => {
            let newParameter = {
                "name": paraNameRefArray[idx].current.value,
                "type": paraTypeRefArray[idx].current.value,
                "id": thisStateSelector.parameters[idx].id
            }
            parameters.push(newParameter);
            if(!lowerCaseValidation(paraNameRefArray[idx].current.value)){
                parametersAreGood = false
            }
        });

        let updatedValue = {
            "id": props.id,
            "name": nameRef.current.value,
            "color": state.colorTemp,
            "left": props.disp.left,
            "top": props.disp.top,
            "parameters": parameters
        };
        let updatedTempColor = {
            "color": state.colorTemp,
        };
        if(upperCaseValidation(nameRef.current.value) && parametersAreGood){
            setState(prevState => ({
                ...prevState,
                ...updatedTempColor
            }));
            dispatch(changeStateDispatch(updatedValue));

            // Reinitialize the ref arrays
            paraNameRefArray = [];
            paraTypeRefArray = [];
            
            //Close the modal [May not want to do it]
            setShow(false);
        }
    }

    const addParameterToState = () => {
        let paraNameRef = React.createRef();
        let paraTypeRef = React.createRef();
        paraNameRefArray.push(paraNameRef);
        paraTypeRefArray.push(paraTypeRef);
        let paraID = uuid();
        dispatch(addParameterToStateDispatch([props.id, paraID]));
        dispatch(addInArgumentToTransitionDispatch([paraID, props.id]))
    }

    const deleteParameter = (id) => {
        dispatch(removeParameterFromStateDispatch([props.id, id]));
        dispatch(removeInArgumentFromTransitionsDispatch(id))
    }

    library.add(faGear);
    library.add(faArrowRight);
    let colorPalette = ["#c4dd88", "#c7978c", "#6fa5c6", "#c2b8a3", "#b75d69", "#a2c8b3", "#e3c85b", "#bfe1d9", "#cf7b6b", "#8fc7a6", "#ce9bcc", "#5c6e91"]; 
    // Name constants for shortening
    const stateNameModalMaxLength = 21;
    const stateNameCircleDisplayLength = 16;

    const lowerCheckParameter = (idx) => {
        if (show) {
            if (paraNameRefArray[idx].current) {
                return lowerCaseValidation(paraNameRefArray[idx].current.value, false)
            } else {
                return true;
            }
        } else {
            return true;
        }
    }

    return (
        <div>
            <div id={props.id ? props.id : "stateCompBoxElem"} className="state"
                ref={dragRef}
                style={{ left: props.id ? props.disp.left + "px": "", top: props.id ? props.disp.top + "px": "", position: props.id ? "absolute" : "",
                opacity: isDragging ? 0.5 : 1, backgroundColor: props.id ? thisStateSelector.color: "#e3c85b"}}>
                {props.id &&
                    <FontAwesomeIcon className="stateOptions" data-testid="stateOptions" icon={faGear} onClick={handleShow}/>
                }
                {props.id && (
                    <span className="stateDnDName">{ DisplayNameSetup(thisStateSelector.name, stateNameCircleDisplayLength) }</span>
                )}
                {!props.id && (
                    <span>State</span>
                )}
            </div>
            {props.initState && (
                    <FontAwesomeIcon className="initArrow" data-testid="initArrow" icon={faArrowRight}
                    style={{ left: (props.disp.left - 20) + "px", top: (props.disp.top + 40 ) + "px", position: "absolute" }}
                    size="xl"/>
            )}

            { /* Modal */ }
            <Modal show={show} onHide={handleClose} animation={false} data-testid="state-modal">
                <Modal.Header> 
                    <Modal.Title> Configure { (thisStateSelector && DisplayNameSetup(thisStateSelector.name, stateNameModalMaxLength)) || "State" }</Modal.Title>
                </Modal.Header>                
                <Modal.Body>
                    <div className="statenameandcolor">                 
                        <div className="statenameComp">
                            <Form onSubmit={ saveComponentInfo }>
                                <Form.Control name="statenameComp" type="text" 
                                    placeholder="Enter a name" size="15"
                                    defaultValue={ thisStateSelector && thisStateSelector.name } ref={nameRef} 
                                    autoFocus />
                            </Form>
                        </div>
                        <div className="statecolorComp">
                            <CirclePicker colors={colorPalette} onChange={handleColorChange} />
                            <div className="statecolorvisuals" >
                                <div className="statetempcolordiv">
                                    <div>
                                        Selected:
                                    </div>
                                    <div className="statecolorPad">
                                        <Button className="statetempColor" style={{backgroundColor: state.colorTemp}}></Button>
                                    </div>
                                </div>
                                <div className="statecurrentcolordiv">
                                    <div>
                                        Current:
                                    </div>
                                    <div className="statecolorPad">
                                        <Button className="statecurColor" style={{backgroundColor: state.color}}></Button>
                                    </div>
                                </div>
                            </div> 
                        </div>
                    </div>
                    {!props.initState &&
                    <div id="parameter-container">
                        <Accordion key={"accordion-stateParameters"} data-testid="accorParam" className="stateaccordion" id="paramAccordion">
                            <Accordion.Item>
                                <Accordion.Header data-testid="accorParamButton">
                                    Parameters
                                </Accordion.Header>
                                <Accordion.Body>
                                    <Row>
                                        <Col>
                                            <span className="stateParamTitle">Add a Parameter
                                                <FontAwesomeIcon className="paramAdd" icon={faPlus} variant="outline-success" title="Add Parameter"
                                                onClick={() => {addParameterToState()}} />
                                            </span>
                                        </Col>
                                    </Row>
                                { thisStateSelector && 
                                    (thisStateSelector.parameters.map((parameter, idx) => (
                                    <Row key={parameter.id}>
                                        <Col>
                                            <FontAwesomeIcon className="paramDel" icon={faTrash} title="Delete Parameter" 
                                                onClick={() => deleteParameter(parameter.id)} 
                                                />
                                        </Col>
                                        <Col>
                                            <Form.Control
                                                ref={paraNameRefArray[idx]}
                                                type="text" autoComplete='off' placeholder='Parameter Name'
                                                defaultValue={(parameter.name || "")} 
                                                isInvalid={!lowerCheckParameter(idx)}
                                                onChange={() => setKey((k) => !k)} 
                                                className='stateParamName'/>
                                        </Col>
                                        <Col>
                                            <Form.Control
                                                ref={paraTypeRefArray[idx]}
                                                type="text" autoComplete='off' placeholder='Parameter Type'
                                                defaultValue={(parameter.type || "")} 
                                                className='stateParamType'/>
                                        </Col>
                                    </Row>
                                    )))}
                                </Accordion.Body>
                            </Accordion.Item>
                        </Accordion> 
                    </div>}
                </Modal.Body>
                <Modal.Footer key={key}>   
                    {!props.initState && <Button className="deleteState" variant="danger" onClick={handleDeleteComponent}>Delete</Button>}
                    <Button variant="primary" onClick={saveComponentInfo}> Save Changes </Button>
                    <Button variant="secondary" onClick={handleClose}> Close </Button>
                </Modal.Footer> 
            </Modal>
        </div>
    );
}

export default State;
