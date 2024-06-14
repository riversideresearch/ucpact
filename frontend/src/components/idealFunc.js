/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import Select from "react-select";
import { useDrag } from "react-dnd";
import { Button, Modal, Form } from "react-bootstrap";
import './idealFunc.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faGear } from '@fortawesome/free-solid-svg-icons'
import Xarrow, { useXarrow } from 'react-xarrows';
import { useSelector, useDispatch } from 'react-redux'
import { changeIFDispatch } from '../features/idealFunctionalities/idealFuncSlice'
import { DisplayNameSetup, upperCaseValidation } from "./helperFunctions";

function IdealFunc(props) {
    const dispatch = useDispatch() // dispatch function for altering the Redux store
    const interSelector = useSelector((state) => state.interfaces) // Redux selector for interfaces

    const idealFuncSelector = useSelector((state) => state.idealFunctionality) // Redux selector for ideal functionality

    // Name constants for shortening
    const IFInterfaceMaxLength = 28;
    const IFModalDisplayLength = 21;

    // hook for updating Xarrow
    // eslint-disable-next-line no-unused-vars
    const updateXarrow = useXarrow();

    // eslint-disable-next-line no-unused-vars
    const [{ isDragging }, drag] = useDrag(() => ({
        type: "ucComp",
        item: { type: "idealFunc" },
        canDrag: props.draggable,
        collect: (monitor) => ({
            isDragging: !!monitor.isDragging(),
        }),
    }));

    const [show, setShow] = useState(false);
    library.add(faGear);
    const handleClose = () => {
        setShow(false);
    }
    const handleShow = () => setShow(true);

    // References
    const nameRef = React.createRef();
    const basicAdvIntRef = React.createRef();
    const compDirIntRef = React.createRef();

    const saveComponentInfo = (e) => {
        e.preventDefault();
        let updatedValue = {
            "name": nameRef.current.value,
            "basicAdversarialInterface": basicAdvIntRef.current.getValue()[0].value,
            "compositeDirectInterface": compDirIntRef.current.getValue()[0].value,
        };
        if(upperCaseValidation(nameRef.current.value)){
            dispatch(changeIFDispatch(updatedValue))

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

    // Dropdown menu functions
    const [compDirIntOptions, setCompDirIntOptions] = useState([]);
    const [basicAdvIntOptions, setBasicAdvIntOptions] = useState([]);

    useEffect(() => {
        let optionsArray = [{key : "basic-interface-id", value : "", label : "Select a Composite Direct Interface..."}]
        interSelector.compInters.filter(basicInt => basicInt.type === "direct").forEach(basicInt => {
            optionsArray.push({key : "basic-interface-id-" + basicInt.id, value : basicInt.id, label : DisplayNameSetup(basicInt.name, IFInterfaceMaxLength)})
        });
        setCompDirIntOptions(optionsArray);
    }, [interSelector]);

    useEffect(() => {
        let optionsArray = [{key: "basic-interface-id", value : "", label : "Select an Adversarial Interface..."}];
        interSelector.basicInters.filter(interFilter).forEach(basicInt => {
            optionsArray.push({key : "basic-interface-id-" + basicInt.id, value : basicInt.id, label : DisplayNameSetup(basicInt.name,IFInterfaceMaxLength)})
        });
        setBasicAdvIntOptions(optionsArray);                                    
    }, [interSelector]);
    
    return (
        <div>
            { /* Ideal Func Box */ }
            <div id="idealWorldIdealFunc" className="idealFunc" 
                ref={drag}
                style={{ left: idealFuncSelector.left + "px", top: idealFuncSelector.top + "px", backgroundColor: idealFuncSelector.color }}>
                <FontAwesomeIcon className="idwoptions" data-testid="idwOptions" icon={faGear} onClick={handleShow}/>
                {idealFuncSelector.id && (
                    <span className="idealFuncDnDName">{ idealFuncSelector.name }</span>
                )}
                {!idealFuncSelector.id && (
                    <span>Ideal Functionality</span>
                )}
            </div>

            { /* Modal */ }
            <Modal show={show} onHide={handleClose} animation={false} data-testid="idealFunc-modal">
                <Modal.Header> 
                    <Modal.Title> Configure {DisplayNameSetup(idealFuncSelector.name, IFModalDisplayLength) || "Ideal Functionality"}</Modal.Title>
                </Modal.Header>                
                <Modal.Body>
                    <div className="idwnameandcolor">                 
                        <div className="idwnameComp">
                            <Form onSubmit={ saveComponentInfo }>
                                <Form.Control name="idfnameComp" type="text" 
                                    placeholder="Enter a name" size="15"
                                    defaultValue={idealFuncSelector.name} ref={nameRef} 
                                    autoFocus />
                            </Form>
                        </div>
                    </div>
                    <div id="dropdown-container">
                        <div className="ideal-world-dropdowns">
                        <h6>Composite Direct Interface</h6>
                            <div id="composite-direct-interface">
                                <Select 
                                    options={compDirIntOptions}
                                    getOptionValue ={(option)=>option.label}
                                    placeholder="Select a Composite Direct Interface..."
                                    defaultValue={{ value : (idealFuncSelector.compositeDirectInterface) || "",
                                        label : compDirIntOptions && compDirIntOptions.find(basicInt => basicInt.value === idealFuncSelector.compositeDirectInterface) ? compDirIntOptions.find(basicInt => basicInt.value === idealFuncSelector.compositeDirectInterface).label : "Select a Composite Direct Interface..."}}
                                    ref={compDirIntRef}
                                />
                            </div>
                            <h6>Basic Adversarial Interface</h6>
                            <div id="basic-adversarial-interface">
                                <Select 
                                    options={basicAdvIntOptions}
                                    getOptionValue ={(option)=>option.label}
                                    placeholder="Select a Composite Direct Interface..."
                                    defaultValue={{ value : (idealFuncSelector.basicAdversarialInterface) || "",
                                        label : basicAdvIntOptions && basicAdvIntOptions.find(basicInt => basicInt.value === idealFuncSelector.basicAdversarialInterface) ? basicAdvIntOptions.find(basicInt => basicInt.value === idealFuncSelector.basicAdversarialInterface).label : "Select an Adversarial Interface..."}}
                                    ref={basicAdvIntRef}
                                />
                            </div>
                        </div>                                   
                    </div>                   
                </Modal.Body>
                <Modal.Footer> 
                    <Button variant="primary" onClick={saveComponentInfo}> Save Changes </Button>
                    <Button variant="secondary" onClick={handleClose}> Close </Button>
                </Modal.Footer> 
            </Modal>

            { /* Arrows */ }
            { idealFuncSelector && idealFuncSelector.compositeDirectInterface &&
                <Xarrow key={ idealFuncSelector.id + "-direct-connector" } start="idealWorldIdealFunc" end="idealWorld-environment-upper" 
                        showHead={false} path="grid" startAnchor="top" endAnchor="bottom" zIndex= {-1} />
            }
            { idealFuncSelector && idealFuncSelector.basicAdversarialInterface &&
                <Xarrow key={ idealFuncSelector.id + "-adversarial-connector-to-sim" } start="idealWorldIdealFunc" end="idealWorldSim" 
                        showHead={false} color="red" path="grid" startAnchor="right" endAnchor="left" zIndex= {-1} />
            }

        </div>
    );     
}

export default IdealFunc;
