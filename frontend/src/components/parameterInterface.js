import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import { useAuth } from "react-oidc-context";
import Xarrow, { useXarrow } from 'react-xarrows';
import { Button, Modal, Form } from "react-bootstrap";
import './parameterInterface.css';
import { useDrag } from "react-dnd";
import { library } from '@fortawesome/fontawesome-svg-core';
import { faGear } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { CirclePicker } from 'react-color';
import { DisplayNameSetup, upperCaseValidation } from "./helperFunctions";
import { changeTransitionDispatch } from '../features/stateMachines/stateMachineSlice';
import { changeParamInterDispatch, deleteParamInterDispatch } from '../features/realFunctionalities/realFuncSlice';


function ParameterInterface(props) {

    const paramInterSelector = useSelector((state) => state.realFunctionality.parameterInterfaces.find(paramInter => paramInter.id === props.id))
    const transitionSelector = useSelector((state) => state.stateMachines.transitions) // Redux selector for transitions
    const realFuncSelector = useSelector((state) => state.realFunctionality)

    const [state, setState] = useState({color: paramInterSelector && paramInterSelector.color, colorTemp: paramInterSelector && paramInterSelector.color});
    const [show, setShow] = useState(props.id && !paramInterSelector.name);
    const [paramInterAPIData, setParamInterAPIData] = useState();

    const updateXarrow = useXarrow();
    const dispatch = useDispatch();
    const auth = useAuth();

    const colorPalette = ["#DE8989", "#89D7DE", "#9F89DE","#E2A82B", "#8998DE", "#89DE91", "#FFFF9C", "#DE89D4", "#65A588", "#A58365", "#AEAEFF", "#EFC3CA"]; 

    const nameRef = React.createRef();
    const compDirRef = React.createRef();

    // aarow display parameters
    const anchorSpacing = index => {
        const multiplier = index % 2 ? -1 : 1;
        return Math.ceil(index/2) * 20 * multiplier;
    };

    const [{ isDragging }, drag] = useDrag(() => ({
        type: "ucComp",
        item: { type: "paramInter", id: props.id },
        canDrag: props.draggable,
        collect: (monitor) => ({
            isDragging: !!monitor.isDragging(),
        }),
    }));

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

    //Deletes the component of the modal and closes the modal
    const handleDeleteComponent = () => {
        //Do we want to have a confirm before we delete?
        props.remove("paramInter", props.id);
        dispatch(deleteParamInterDispatch(props.id));

        // TODO update for transition updates
        let idOfCompInterface = paramInterSelector.idOfInterface
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
                
        dispatch(deleteParamInterDispatch(props.id));

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

        let thisCompInter = paramInterAPIData.find(element => element.compInterface_id === compDirRef.current.value)
        let modelName = thisCompInter ? thisCompInter.model_name : "";
        let compInterName = thisCompInter ? thisCompInter.compInterface_name : "";

        let updatedValue = {
            "id": props.id,
            "name": nameRef.current.value,
            "idOfInterface": compDirRef.current.value,
            "compInterName": compInterName,
            "modelName": modelName,
            "color": state.colorTemp,
            "left": props.disp.left,
            "top": props.disp.top,
        };
        let updatedTempColor = {
            "color" : state.colorTemp,
        };
        if(upperCaseValidation(nameRef.current.value)) {
            setState(prevState => ({
                ...prevState,
                ...updatedTempColor
            }));
            dispatch(changeParamInterDispatch(updatedValue))
        
            //Close the modal [May not want to do it]
            setShow(false);
        }
        
    };

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
    }, [show]);
    

    return (
        <div>
            { /* Parameter Interface Box */ }
            <div id={props.id ? props.id : "parameterInterfaceCompBoxElem"} className="paramInter" 
                ref={drag}
                style={{ left: props.id ? props.disp.left + "px": "", top: props.id ? props.disp.top + "px": "", position: props.id ? "absolute" : "",
                opacity: isDragging ? 0.5 : 1, backgroundColor: props.id ? paramInterSelector.color: "#DE8989"}}>
                {props.id &&
                    <FontAwesomeIcon className="paramInterOptions" data-testid="paramInterOptions" icon={faGear} onClick={handleShow} />
                }
                {props.id && (
                    <span className="paramInterDnDName">{ paramInterSelector.name }</span>
                )}
                {!props.id && (
                    <span>Parameter</span>
                )}
            </div>

            { /* Modal */ }
            <Modal show={show} onHide={handleClose} animation={false} data-testid="paramInter-modal">
                <Modal.Header> 
                    <Modal.Title> Configure {paramInterSelector && paramInterSelector.name ? paramInterSelector.name : "Parameter"}</Modal.Title>
                </Modal.Header>                
                <Modal.Body>
                    <div className="paramInterNameAndColor">                 
                        <div className="paramInterNameComp">
                            <Form onSubmit={ saveComponentInfo }>
                                <Form.Control name="paramInterNameComp" type="text" 
                                    placeholder="Enter a name" size="15"
                                    defaultValue={ paramInterSelector && paramInterSelector.name }  ref={nameRef} 
                                    autoFocus />
                            </Form>
                        </div>
                        <div className="paramInterColorComp">
                            <CirclePicker colors={colorPalette} onChange={handleColorChange} />
                            <div className="paramInterColorVisuals" >
                                <div className="paramInterTempColorDiv">
                                    <div>
                                        Selected:
                                    </div>
                                    <div className="paramInterColorPad">
                                        <Button className="paramInterTempColor" style={{backgroundColor: state.colorTemp}}></Button>
                                    </div>
                                </div>
                                <div className="paramInterCurrentColorDiv">
                                    <div>
                                        Current:
                                    </div>
                                    <div className="paramInterColorPad">
                                        <Button className="paramInterCurColor" style={{backgroundColor: state.color}}></Button>
                                    </div>
                                </div>
                            </div> 
                        </div>
                    </div>
                    
                    <div id="dropdown-container">
                        <div id="composite-direct-interfaces">
                            <h6>Composite Direct Interface</h6>
                            <Form.Select aria-label="Select a Composite Interface" ref={compDirRef}
                                key={"id-" + props.id}
                                defaultValue={ paramInterSelector && paramInterSelector.idOfInterface || "" }
                                title={"realFuncAdvInterface"} >
                                    <option value="">Select a Composite Interface</option>
                                    { paramInterAPIData && paramInterAPIData.map(compositeInt => (
                                            <option key={"composite-interface-id-" + compositeInt.compInterface_id + compositeInt.model_name} data-testid="select-option" value={compositeInt.compInterface_id}>
                                                {compositeInt.compInterface_name + " (" + compositeInt.model_name + ")"}
                                            </option> 
                                    ))}
                            </Form.Select>
                        </div>                                      
                    </div>
                </Modal.Body>
                <Modal.Footer>                    
                    <Button className="deleteParamInter" variant="danger" onClick={handleDeleteComponent}>Delete</Button>
                    <Button variant="primary" onClick={saveComponentInfo}> Save Changes </Button>
                    <Button variant="secondary" onClick={handleClose}> Close </Button>
                </Modal.Footer> 
            </Modal>
        </div>
    )
}

export default ParameterInterface;
