/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import { useDrag } from "react-dnd";
import { useParams } from 'react-router';
import { Button, Modal, Form } from "react-bootstrap";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faGear } from '@fortawesome/free-solid-svg-icons'
import { CirclePicker } from "react-color";
import './subFunc.css';
import axios from 'axios';
import { useAuth } from "react-oidc-context";

import { useSelector, useDispatch } from 'react-redux'
import { changeSubfuncDispatch,
         removeSubfuncDispatch } from '../features/subfunctionalities/subfuncSlice'
import { changeTransitionDispatch } from "../features/stateMachines/stateMachineSlice";
import { DisplayNameSetup, upperCaseValidation } from "./helperFunctions";

function SubFunc(props) {
    const dispatch = useDispatch() // dispatch function for altering the Redux store
    
    // Redux selector for subfunctionalities
    // state.subfunctionalities refers to the subfunctionalities Redux state
    // 2nd .subfunctionalities refers to the array of subfunctionalities within the subfunctionalities Redux state
    const subfuncSelector = useSelector((state) => state.subfunctionalities.subfunctionalities.find(element => element.id === props.id))
    // Need the list of transitions to compare message 
    const transitionSelector = useSelector((state) => state.stateMachines.transitions)

    const [state, setState] = useState({color: "#8a6996", colorTemp: "#8a6996"});
    const [idealFuncApiData, setIdealFuncApiData] = useState();

    const { id } = useParams();
    const auth = useAuth();


    const subFuncModalDisplayLength = 21;
    
    const [{ isDragging }, drag] = useDrag(() => ({
        type: "ucComp",
        item: { type: "subFunc", id: props.id },
        canDrag: props.draggable,
        collect: (monitor) => ({
            isDragging: !!monitor.isDragging(),
        }),
    }));

    const [show, setShow] = useState(props.id && !subfuncSelector.name);
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
    const handleShow = () => {
        setShow(true);
    }

    useEffect(() => {
        // API call to handle idealFunctionalities
	let urlPath = process.env.REACT_APP_SERVER_PREFIX + "/idealFunctionalities";
    let token = "none";
    if (process.env.NODE_ENV !== 'test') {
        token = auth.user?.access_token;
    }
        axios({
            method: "GET",
            url: urlPath,
            headers: {
              Authorization: `Bearer ${token}`, SessionTabId: `${localStorage.sessionID}/${sessionStorage.tabID}`,
            }
        })
        .then((response) => {
            const res = response.data;
            setIdealFuncApiData(res);
        })
        .catch((err) => {
            if (err.response) {
                console.log(err.response);
                console.log(err.response.status);
                console.log(err.response.headers);
            }
        });
    }, [setShow]);

    // References
    const nameRef = React.createRef();
    const idealFunctRef = React.createRef();

    const handleColorChange = (color) => {
        let updatedValue = {
            "colorTemp": color.hex,
        } 
        setState(prevState => ({
            ...prevState,
            ...updatedValue
        }));
    }
    const handleDeleteComponent = () => {
        // Get the ideal functionality of what we are pointing to
        let idealIDOfThisSubFunc = subfuncSelector.idealFunctionalityId
        //URL Path needs to be based off of the subFunc that we are deleting
        if(idealIDOfThisSubFunc !== null){
            let token = "none";
            if (process.env.NODE_ENV !== 'test') {
                token = auth.user?.access_token;
            }
            let urlPath = process.env.REACT_APP_SERVER_PREFIX + "/idealFunctionalities/" + idealIDOfThisSubFunc + "/messages";
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
        props.remove("subFunc", props.id);
        dispatch(removeSubfuncDispatch(props.id));
        setShow(false);
    }
    const saveComponentInfo = (e) => {
        
        // Get the ideal functionality of what we are pointing to
        let idealIDOfThisSubFunc = subfuncSelector.idealFunctionalityId
        if((idealIDOfThisSubFunc !== idealFunctRef.current.value) && idealIDOfThisSubFunc !== null){
            //URL Path needs to be based off of the subFunc that we are deleting
            let token = "none";
            if (process.env.NODE_ENV !== 'test') {
                token = auth.user?.access_token;
            }
            let urlPath = process.env.REACT_APP_SERVER_PREFIX + "/idealFunctionalities/" + idealIDOfThisSubFunc + "/messages";
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
        
        
        
        e.preventDefault();
        let idealFuncName = "";
        let IFModelName = "";

        if (idealFunctRef.current.value !== "") {
            const currentApiObj = idealFuncApiData.find(element => element.idealFunctionality_id === idealFunctRef.current.value);
            idealFuncName = currentApiObj.idealFunctionality_name;
            IFModelName = currentApiObj.model_name;
        }

        let updatedValue = {
            "id": props.id,
            "name": nameRef.current.value,
            "idealFunctionalityId": idealFunctRef.current.value,
            "idealFunctionalityName" : idealFuncName,
            "idealFuncModel": IFModelName,
            "color": state.colorTemp,
            "left": props.disp.left,
            "top": props.disp.top,
        };
        let updatedTempColor = {
            "color": state.colorTemp,
        }
        if(upperCaseValidation(nameRef.current.value)){
            setState(prevState => ({
                ...prevState,
                ...updatedTempColor
            }));
            dispatch(changeSubfuncDispatch(updatedValue))
            //Close the modal [May not want to do it]
            setShow(false);
        }
        
    }
    
    let colorPalette = ["#8a6996", "#db585f", "#8e9cc6", "#d1b292", "#5f8ba1", "#e6a545", "#6b9a8d", "#c96383", "#5290a2", "#d1a27d", "#477090", "#c8b47b"];

    return (
        <div className="subFunc" id={props.id}
            ref={drag}
            style={{ left: props.id ? props.disp.left + "px": "", top: props.id ? props.disp.top + "px": "", position: props.id ? "absolute" : "",
            opacity: isDragging ? 0.5 : 1, backgroundColor: props.id ? subfuncSelector.color: "#8a6996"}}>
            {props.id && (
                <FontAwesomeIcon className="subfuncoptions" data-testid="subfuncOptions" icon={faGear} onClick={handleShow}/>
            )}
            {props.id && (
                <span className="subFuncDnDName">{ subfuncSelector.name }</span>
            )}
            {!props.id && (
                <span>Subfunctionality</span>
            )}
            <Modal show={show} onHide={handleClose} animation={false} data-testid="subfunc-modal">
                <Modal.Header> 
                    <Modal.Title> Configure { (subfuncSelector && DisplayNameSetup(subfuncSelector.name, subFuncModalDisplayLength)) || "Subfunctionality" }</Modal.Title>
                </Modal.Header>                
                <Modal.Body>
                    <div className="subfuncnameandcolor" >                 
                        <div className="subfuncnamecomp" >
                            <Form onSubmit={ saveComponentInfo } >
                                <Form.Control name="subfuncnamecomp" type="text" 
                                    placeholder="Enter a name" size="15"
                                    defaultValue={ subfuncSelector && subfuncSelector.name } ref={nameRef} 
                                    autoFocus />
                            </Form>
                        </div>
                        <div className="subfunccolorcomp">
                            <CirclePicker onChange={handleColorChange} colors={colorPalette}/>
                            <div className="subFunccolorvisuals" >
                                <div> 
                                    Selected:
                                </div>
                                <div className="subfunccolorPad">
                                    <Button className="subFunctempColor" style={{backgroundColor: state.colorTemp}} ></Button>
                                </div>
                                <div className="subfunccurrentcolordiv">
                                    <div>
                                        Current:
                                    </div>
                                    <div className="subfunccolorPad">
                                        <Button className="subFunccurColor" style={{backgroundColor: state.color}}></Button>
                                    </div>
                                </div>
                            </div> 
                        </div>
                    </div>
                    
                    <div id="dropdown-container">
                        <div className="real-world-dropdowns">
                            <div id="ideal-functionality">
                            <h6>Ideal Functionality</h6>
                            <Form.Select aria-label="Select an Ideal Functionality" ref={idealFunctRef}
                                            defaultValue={ (subfuncSelector && subfuncSelector.idealFunctionalityId) || "" }>
                                <option value="">Select an Ideal Functionality</option>
                                {idealFuncApiData && (
                                idealFuncApiData.map(idealFunc => (
                                        (id !== idealFunc.model_name &&
                                        <option key={"ideal-Func-id-" + idealFunc.idealFunctionality_id} value={idealFunc.idealFunctionality_id}>{idealFunc.idealFunctionality_name + " (" + idealFunc.model_name + ")"}</option>) 
                                )))}
                            </Form.Select>
                            </div>
                        </div>                                    
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button className="deleteSubFunc" variant="danger" onClick={handleDeleteComponent}>Delete</Button> 
                    <Button variant="primary" onClick={saveComponentInfo}> Save Changes </Button>
                    <Button variant="secondary" onClick={handleClose}> Close </Button>
                </Modal.Footer> 
            </Modal>
        </div>
    );     
}

export default SubFunc;
