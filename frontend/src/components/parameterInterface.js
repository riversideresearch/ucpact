/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import Select from "react-select";
import { useAuth } from "react-oidc-context";
import { Button, Modal, Form } from "react-bootstrap";
import './parameterInterface.css';
import { useDrag } from "react-dnd";
import { library } from '@fortawesome/fontawesome-svg-core';
import { faGear } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { CirclePicker } from 'react-color';
import { upperCaseValidation } from "./helperFunctions";
import { changeTransitionDispatch } from '../features/stateMachines/stateMachineSlice';
import { changeParamInterDispatch, deleteParamInterDispatch } from '../features/realFunctionalities/realFuncSlice';
import Xarrow, { useXarrow } from 'react-xarrows';
import { Store } from 'react-notifications-component'

function ParameterInterface(props) {

    const paramInterSelector = useSelector((state) => state.realFunctionality.parameterInterfaces.find(paramInter => paramInter.id === props.id))
    const transitionSelector = useSelector((state) => state.stateMachines.transitions) // Redux selector for transitions
    const allSubFuncSelector = useSelector((state) => state.subfunctionalities.subfunctionalities)
    const allParamSelector = useSelector((state) => state.realFunctionality.parameterInterfaces)

    const [state, setState] = useState({color: paramInterSelector && paramInterSelector.color, colorTemp: paramInterSelector && paramInterSelector.color});
    const [show, setShow] = useState(props.id && !paramInterSelector.name);
    const [paramInterAPIData, setParamInterAPIData] = useState();

    const dispatch = useDispatch();
    const auth = useAuth();

    let [myHeight, setMyHeight] = useState(0)

    const colorPalette = ["#DE8989", "#89D7DE", "#9F89DE","#E2A82B", "#8998DE", "#89DE91", "#FFFF9C", "#DE89D4", "#65A588", "#A58365", "#AEAEFF", "#EFC3CA"]; 

    const nameRef = React.createRef();
    const compDirRef = React.createRef();

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
    const handleShow = () =>{ 
        setState({color: paramInterSelector.color, colorTemp: paramInterSelector.color})
        setShow(true);
    }
    // hook for updating Xarrow
    // eslint-disable-next-line no-unused-vars
    const updateXarrow = useXarrow();
    // arrow display parameters
    const anchorAdv = () => {
        if (document.getElementById(props.id) !== null) {
            if(myHeight === 0 || (document.getElementById(props.id).offsetHeight !== myHeight && document.getElementById(props.id).offsetHeight !== 0)){
                setMyHeight(document.getElementById(props.id).offsetHeight)
            }
            let advLength = 500
            let advTop = 115
            let advCenter = advTop + advLength / 2
            let advBot = advTop + advLength
            let curPosTop = props.disp.top
            let curHeight = myHeight
            let offSet = curHeight / 2 //account for box size
            curPosTop = curPosTop + offSet
            if (curPosTop < advTop) {
                return -advLength / 2 + 40 //Offset the value from the absolute end and take the - value as 0 is the center of the box
            } else if (advCenter > curPosTop && curPosTop >= advTop) {
                return (curPosTop - advCenter)

            } else if (advBot > curPosTop && curPosTop >= advCenter) {
                return -(advCenter - curPosTop)
            }
            else {
                return (advLength / 2) - 5
            }
        }
    }
    //Deletes the component of the modal and closes the modal
    const handleDeleteComponent = () => {
        //Do we want to have a confirm before we delete?
        props.remove("paramInter", props.id);
        dispatch(deleteParamInterDispatch(props.id));

        // TODO update for transition updates
        let idOfCompInterface = paramInterSelector.idOfInterface
        let token = "none";
        if ((process.env.NODE_ENV !== 'test' && process.env.REACT_APP_AUTH_DISABLED !== 'TRUE')) {
            token = auth.user?.access_token;
        }
        if (idOfCompInterface){ //Check if the idOfCompInterface is not empty
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
        }
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

        let thisCompInter = paramInterAPIData.find(element => element.compInterface_id === compDirRef.current.props.value.value)
        let modelName = thisCompInter ? thisCompInter.model_name : "";
        let compInterName = thisCompInter ? thisCompInter.compInterface_name : "";

        let updatedValue = {
            "id": props.id,
            "name": nameRef.current.value,
            "idOfInterface": compDirRef.current.props.value.value,
            "compInterName": compInterName,
            "modelName": modelName,
            "color": state.colorTemp,
            "left": props.disp.left,
            "top": props.disp.top,
        };
        let updatedTempColor = {
            "color" : state.colorTemp,
        };
        if(upperCaseValidation(nameRef.current.value) && checkNameDuplication(nameRef.current.value)) {
            setState(prevState => ({
                ...prevState,
                ...updatedTempColor
            }));
            dispatch(changeParamInterDispatch(updatedValue))
        
            //Close the modal [May not want to do it]
            setShow(false);
        }
        
    };

    const checkNameDuplication = (checkString) => {
            let nameIsNotDup = true;  
            let notiTitle = "Duplicate Name Check Failure"
            let notiMessage = "Message: "
            let notiType = 'danger'
            for(let i = 0; i < allParamSelector.length; i++){
                if(allParamSelector[i].id !== props.id && checkString === allParamSelector[i].name){
                    nameIsNotDup = false
                    notiMessage += "Name is in use by another Parameter Interface"
                }
            }
    
            for(let i = 0; i < allSubFuncSelector.length; i++){
                if(checkString === allSubFuncSelector[i].name){
                    nameIsNotDup = false
                    notiMessage += "Name is in use by a Subfunctionality"
                }
            }
            if(!nameIsNotDup){
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
                }
                Store.addNotification(notification)
            }
            return nameIsNotDup
            
        }

    useEffect(() => {
        // API Call for Parameter Interfaces
        let token = "none";
        if ((process.env.NODE_ENV !== 'test' && process.env.REACT_APP_AUTH_DISABLED !== 'TRUE')) {
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

    // Dropdown menu functions
    const [compDirOptions, setCompDirOptions] = useState([]);

    useEffect(() => {
        let optionsArray = [{key: "composite-interface-id", value: "", label: "Select a Composite Interface..."}];
        paramInterAPIData&& paramInterAPIData.forEach(compositeInt => {
            optionsArray.push({key: "composite-interface-id-" + compositeInt.compInterface_id + compositeInt.model_name, value: compositeInt.compInterface_id,
                label: compositeInt.compInterface_name + " (" + compositeInt.model_name + ")"
            })
        });
        setCompDirOptions(optionsArray);
    }, [paramInterAPIData]);
    


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
                            <Select 
                                options={compDirOptions}
                                getOptionValue ={(option)=>option.label}
                                placeholder="Select a Direct Interface..."
                                defaultValue={{ value : (paramInterSelector && paramInterSelector.idOfInterface) || "",
                                    label : paramInterSelector ? compDirOptions.find(compositeInt => compositeInt.value === paramInterSelector.idOfInterface) ? compDirOptions.find(compositeInt => compositeInt.value === paramInterSelector.idOfInterface).label : "Select a Direct Interface..." : "Select a Direct Interface..."}}
                                ref={compDirRef}
                                id="paramInterCompDirSelect"
                            />
                        </div>                                      
                    </div>
                </Modal.Body>
                <Modal.Footer>                    
                    <Button className="deleteParamInter" variant="danger" onClick={handleDeleteComponent}>Delete</Button>
                    <Button variant="primary" onClick={saveComponentInfo}> Save Changes </Button>
                    <Button variant="secondary" onClick={handleClose}> Close </Button>
                </Modal.Footer> 
            </Modal>
            { paramInterSelector &&
                <Xarrow key={ props.id + "-adversarial-connector" } start={ props.id } end="realFunctionality-environment-right" 
                        showHead={false} color="red" path="smooth" startAnchor="right" 
                        endAnchor={{position: "left", offset: { y: anchorAdv() }}} zIndex= {-1} 
                        data-testid="partyAdversarialArrow"
                /> // Offset is to move the Adv arrow up on the box by a set amount
            }
        </div>
    )
}

export default ParameterInterface;
