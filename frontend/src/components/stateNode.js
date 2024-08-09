import React, { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import './stateNode.css';
import './state.css';
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

function StateNode(props) {

  let { data, isConnectable } = props;

  const dispatch = useDispatch();

  const [key, setKey] = useState(0);

  // Redux selector for State Machine state
  const stateMachineSelector = useSelector((state) => state.stateMachines);
  const transitionSelector = useSelector((state) => state.stateMachines.transitions);
  const thisStateSelector = stateMachineSelector.states.find(element => element.id === data.id);

  const [show, setShow] = useState(data.id && thisStateSelector && !thisStateSelector.name);

  const [state, setState] = useState({color: "#e3c85b", colorTemp: "#e3c85b"});

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
        //props.remove(props.id);
        dispatch(removeStateDispatch(data.id));

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
        "id": data.id,
        "name": nameRef.current.value,
        "color": state.colorTemp,
        "left": props.positionAbsoluteX, 
        "top": props.positionAbsoluteY,
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
      dispatch(addParameterToStateDispatch([data.id, paraID]));
      dispatch(addInArgumentToTransitionDispatch([paraID, data.id]))
  }

  const deleteParameter = (paraId) => {
      dispatch(removeParameterFromStateDispatch([data.id, paraId]));
      dispatch(removeInArgumentFromTransitionsDispatch(paraId))
  }

  library.add(faGear);
  library.add(faArrowRight);
  let colorPalette = ["#c4dd88", "#c7978c", "#6fa5c6", "#c2b8a3", "#b75d69", "#a2c8b3", "#e3c85b", "#bfe1d9", "#cf7b6b", "#8fc7a6", "#ce9bcc", "#5c6e91"]; 
  // Name constants for shortening
  const stateNameModalMaxLength = 21;
  //const stateNameCircleDisplayLength = 16;

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
    <div className="state-node" style={{backgroundColor: data.color}}>
        {data.initState && (
            <FontAwesomeIcon className="initArrow" data-testid="initArrow" icon={faArrowRight}
            style={{ left: (-21) + "px", top: (38) + "px", position: "absolute" }}
            size="xl"/>
        )}
        <div>
            {data.label}
            <FontAwesomeIcon className="stateOptions" data-testid="stateOptions" icon={faGear} onClick={handleShow} />
        </div>
      <Handle type="source" position={Position.Top} id='1' isConnectable={isConnectable} />
      <Handle type="source" position={Position.Top} id='2' style={{left: 30, top: 4}} isConnectable={isConnectable} />
      <Handle type="source" position={Position.Top} id='3' style={{ left: 14, top: 14 }} isConnectable={isConnectable} />
      <Handle type="source" position={Position.Left} id='4' style ={{left: 3, top: 32}} isConnectable={isConnectable} />
      {!data.initState && <Handle type="source" position={Position.Left} id='5' isConnectable={isConnectable} />}
      <Handle type="source" position={Position.Left} id='6' style ={{left: 3, top: 69}} isConnectable={isConnectable} />
      <Handle type="source" position={Position.Bottom} id="7" style={{ left: 14, top: 80 }} isConnectable={isConnectable} />
      <Handle type="source" position={Position.Bottom} id="8" style={{left: 30, top: 90}} isConnectable={isConnectable} />
      <Handle type="source" position={Position.Bottom} id="9" isConnectable={isConnectable} />
      <Handle type="source" position={Position.Bottom} id="10" style={{left: 71, top: 90}} isConnectable={isConnectable} />
      <Handle type="source" position={Position.Right} id="11" style={{ left: 80, top: 85 }} isConnectable={isConnectable} />
      <Handle type="source" position={Position.Right} id="12" style={{right: 3, top: 69}} isConnectable={isConnectable} />
      <Handle type="source" position={Position.Right} id="13" isConnectable={isConnectable} />
      <Handle type="source" position={Position.Right} id="14" style={{left: 91, top: 32}} isConnectable={isConnectable} />
      <Handle type="source" position={Position.Right} id="15" style={{ left: 80, top: 15}} isConnectable={isConnectable} />
      <Handle type="source" position={Position.Top} id='16' style={{left: 70, top: 4}} isConnectable={isConnectable} />
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
              {!data.initState &&
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
              {!data.initState && <Button className="deleteState" variant="danger" onClick={handleDeleteComponent}>Delete</Button>}
              <Button variant="primary" onClick={saveComponentInfo}> Save Changes </Button>
              <Button variant="secondary" onClick={handleClose}> Close </Button>
          </Modal.Footer> 
      </Modal>
    </div>
  );
}

export default StateNode;