import React, { useState } from "react";
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
            "basicAdversarialInterface": basicAdvIntRef.current.value,
            "compositeDirectInterface": compDirIntRef.current.value,
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
                                <Form.Select aria-label="Select a Composite Direct Interface" ref={compDirIntRef}
                                             defaultValue={idealFuncSelector.compositeDirectInterface}
                                             title={"idealFuncDirInterface"}>
                                    <option value="">Select a Composite Direct Interface</option>
                                    { interSelector.compInters.filter(basicInt => basicInt.type === "direct").map(basicInt => (
                                            <option key={"basic-interface-id-" + basicInt.id} value={basicInt.id}>{DisplayNameSetup(basicInt.name, IFInterfaceMaxLength)}</option> 
                                    ))}
                                </Form.Select>
                            </div>
                            <h6>Basic Adversarial Interface</h6>
                            <div id="basic-adversarial-interface">
                                <Form.Select aria-label="Select an Adversarial Interface" ref={basicAdvIntRef}
                                             defaultValue={idealFuncSelector.basicAdversarialInterface}
                                             title={"idealFuncAdvInterface"}>
                                    <option value="">Select an Adversarial Interface</option>
                                    { interSelector.basicInters.filter(interFilter).map(basicInt => (
                                            <option key={"basic-interface-id-" + basicInt.id} value={basicInt.id}>{DisplayNameSetup(basicInt.name,IFInterfaceMaxLength)}</option> 
                                    ))}
                                    
                                </Form.Select>
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
