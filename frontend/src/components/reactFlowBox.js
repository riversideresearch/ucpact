import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ReactFlow,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
  reconnectEdge
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import StateNode from './stateNode';
import TransitionEdge from './transitionEdge';
import LoopbackEdge from './loopbackEdge';
import './stateNode.css'
import ConnectionLine from './connectionLine';
import uuid from 'react-uuid';
import { addToTransitionsDispatch,
  addTransitionDispatch, 
  changeTransitionDispatch, 
  removeTransitionDispatch,
  updateStatePositionDispatch,
  changeTransitionToStateDispatch,
  changeTransitionOutMessageDispatch } from '../features/stateMachines/stateMachineSlice';
import { Button, Modal, Form } from "react-bootstrap";
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import Select from 'react-select';
import Accordion from 'react-bootstrap/Accordion';
import './stateMachines.css';
import { DisplayNameSetup } from './helperFunctions';
import { Store } from "react-notifications-component";
 
function ReactFlowBox(props) {

  const { subFuncMessages, paramInterMessages, tableClick, setTableClick, tableIndex, setTableIndex } = props;

  const stateMachineSelector = useSelector((state) => state.stateMachines);
  const thisStateMachineSelector = stateMachineSelector.stateMachines[stateMachineSelector.stateMachines.findIndex(element => element.id === props.component.stateMachine)];
  const stateSelector = useSelector((state) => state.stateMachines.states);
  const transitionSelector = useSelector((state) => state.stateMachines.transitions);
  const interSelector = useSelector((state) => state.interfaces);
  const subfuncSelector = useSelector(state => state.subfunctionalities);
  const partySelector = useSelector(state => state.parties);
  const realFuncSelector = useSelector(state => state.realFunctionality);
  const idealFuncSelector = useSelector((state) => state.idealFunctionality) // Redux selector for ideal functionality
  const simSelector = useSelector((state) => state.simulator) // Redux selector for simulator

  const dispatch = useDispatch();

  const proOptions = { hideAttribution: true };

  const nodeTypes = useMemo(() => ({ stateNode: StateNode }), []);
  const edgeTypes = useMemo(() => ({'transition': TransitionEdge, 'loopback': LoopbackEdge}), []);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const [show, setShow] = useState();
  const [modalTransition, setModalTransition] = useState('');

  const transitionFromStateRef = React.createRef();
  const transitionToStateRef = React.createRef();
  const transitionInMessageRef = React.createRef();
  const transitionOutMessageRef = React.createRef();
  const transitionGuardRef = React.createRef();
  const transitionPortRef = React.createRef();
  const transitionNameRef = React.createRef();

  const transitionInArgRefs = useRef({});
  const transitionOutArgRefs = useRef({});

  const onReconnect = useCallback((oldEdge, newConnection) => {
      let thisTransition = transitionSelector.find(transition => transition.id === oldEdge.id);

      let updatedTransition = {
        "id": oldEdge.id,
        "name": thisTransition.name,
        "fromState": newConnection.source,
        "toState": newConnection.target,
        "sourceHandle": newConnection.sourceHandle,
        "targetHandle": newConnection.targetHandle,
        "toStateArguments": thisTransition.toStateArguments,
        "outMessageArguments": thisTransition.outMessageArguments,
        "guard": thisTransition.guard,
        "outMessage": thisTransition.outMessage,
        "inMessage": thisTransition.inMessage,
        "targetPort": thisTransition.targetPort
      }

      dispatch(changeTransitionDispatch(updatedTransition));
      setEdges((els) => reconnectEdge(oldEdge, newConnection, els))
    },
    [transitionSelector, dispatch, setEdges]
  );

  const onNodeDragStop = (event, node) => {
    dispatch(updateStatePositionDispatch([node.id, node.position.x, node.position.y]));
  };

  const onConnect = useCallback(
    (connection) => {
      if (connection.target === thisStateMachineSelector.initState) {
        let notiMessage = "Message: Initial State cannot be To State. TRANSITION NOT CREATED";
        let notiTitle = " Transition Creation Failure"
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
        let edge;
        if (connection.source === connection.target) {
            edge = { ...connection, type: 'loopback', markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 14,
            height: 14,
            color: '#000000',
            }}
        } else {
            edge = { ...connection, type: 'transition', markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 14,
            height: 14,
            color: '#000000',
            }, };
        }  
        let id = uuid();
        let newTransition = {
            "id": id,
            "name": "",
            "fromState": connection.source,
            "toState": connection.target,
            "sourceHandle": connection.sourceHandle,
            "targetHandle": connection.targetHandle,
            "toStateArguments": [],
            "outMessageArguments": [],
            "guard": "",
            "outMessage": "",
            "inMessage": "",
            "targetPort": ""
        }    
        // Dispatch
        dispatch(addTransitionDispatch(newTransition));
        dispatch(addToTransitionsDispatch([id, thisStateMachineSelector.id]));

        setEdges((eds) => addEdge(edge, eds));
        setModalTransition(newTransition);
        handleShow();
      }
    },
    [setEdges, thisStateMachineSelector, dispatch],
  );

  const onEdgeMouseEnter = ((event, edge) => {
    let thisTransitionIndex = thisStateMachineSelector.transitions.findIndex(element => element === edge.id);
    setTableIndex(thisTransitionIndex);
  });

  const onEdgeMouseLeave = ((event, edge) => {
    setTableIndex('');
  });

  // Display states
  useEffect(() => {
    let newNodes = [];
    thisStateMachineSelector.states.forEach(state => {
      let thisState = stateSelector.find(thisState => thisState.id === state);
      let isInitState = false;
      if (thisStateMachineSelector.initState === thisState.id) {
        isInitState = true;
      }
      newNodes.push({id : thisState.id, position: { x: thisState.left, y: thisState.top }, data: { label: thisState.name, id: thisState.id, initState: isInitState, color: thisState.color }, type: 'stateNode'});
    });
    setNodes(newNodes);
  }, [stateMachineSelector]);

  // Display transitions
  useEffect(() => {
    let newEdges = [];
    thisStateMachineSelector.transitions.forEach((transition, idx) => {
      let thisTransition = stateMachineSelector.transitions.find(thisTransition => thisTransition.id === transition);

      let renderLabel = false;
      if (idx === tableIndex) {
        renderLabel = true;
      }

      if (thisTransition && thisTransition.fromState && thisTransition.toState) {

        let type = '';
        if (thisTransition.fromState === thisTransition.toState) {
            type = 'loopback';
        } else {
            type = 'transition'
        }

        let transitionLabel = '';
        if (thisTransition.name !== '') {
            transitionLabel = thisTransition.name;
        } else if (thisTransition.inMessage && thisTransition.outMessage) {
            let inMessage = '';
            if (interSelector.messages.find(element => element.id === thisTransition.inMessage)) {
                inMessage = interSelector.messages.find(element => element.id === thisTransition.inMessage).name;
            } else if (subFuncMessages.find(element => element.id === thisTransition.inMessage)) {
                inMessage = subFuncMessages.find(element => element.id === thisTransition.inMessage).name;
            } else if (paramInterMessages.find(element => element.id === thisTransition.inMessage)) {
                inMessage = paramInterMessages.find(element => element.id === thisTransition.inMessage).name;
            }

            let outMessage = '';
            if (interSelector.messages.find(element => element.id === thisTransition.outMessage)) {
                outMessage = interSelector.messages.find(element => element.id === thisTransition.outMessage).name;
            } else if (subFuncMessages.find(element => element.id === thisTransition.outMessage)) {
                outMessage = subFuncMessages.find(element => element.id === thisTransition.outMessage).name;
            } else if (paramInterMessages.find(element => element.id === thisTransition.outMessage)) {
                outMessage = paramInterMessages.find(element => element.id === thisTransition.outMessage).name;
            }

            transitionLabel = inMessage + " / " + outMessage;
        } else {
            transitionLabel = '';
        }

        let sourceHandle = ''
        if (thisTransition.sourceHandle) {
            sourceHandle = thisTransition.sourceHandle
        } else {
            sourceHandle = '1'
        }

        let targetHandle = ''
        if (thisTransition.targetHandle) {
            targetHandle = thisTransition.targetHandle
        } else {
            targetHandle = '1'
        }

        newEdges.push({id: thisTransition.id, type: type, source: thisTransition.fromState, sourceHandle: sourceHandle, target: thisTransition.toState, targetHandle: targetHandle,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 14,
            height: 14,
            color: '#000000',
          },
          data: { label: transitionLabel, renderLabel: renderLabel, sourceHandle: thisTransition.sourceHandle, targetHandle: thisTransition.targetHandle}
        });
      }
    });
    setEdges(newEdges);

  }, [stateMachineSelector, nodes, tableIndex]);

  const onEdgeClick = (evt, edge) => {
    let thisTransition = transitionSelector.find(transition => transition.id === edge.id);
    setModalTransition(thisTransition);
    handleShow();
  };

  const updateModalTransition = () => {
    let thisTransition = transitionSelector.find(element => element.id === modalTransition.id);
    setModalTransition(thisTransition);
  }

  const handleShow = () => {
    setShow(true);
  }

  const handleClose = () => {
    setShow(false);
    setModalTransition('');
    setTableClick('');
  }

  const deleteTransition = () => {
    dispatch(removeTransitionDispatch(modalTransition.id));
    handleClose();
  }

  useEffect(() => {
    if (tableClick !== '') {
        let thisTransitionId = thisStateMachineSelector.transitions[tableClick];
        let thisTransition = transitionSelector.find(element => element.id === thisTransitionId);
        setModalTransition(thisTransition);
        handleShow();
    }   
  }, [tableClick])

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

  const saveComponentInfo = (e) => {
    e.preventDefault();       
    // Dispatch State Machine to Redux

    let targetport = "";
    if(transitionPortRef.current !== null){         
        targetport = transitionPortRef.current.value
    }

    let inArgumentValuesArray = [];
    let outArgumentValuesArray = [];

    let thisToState = stateMachineSelector.states.find(element => element.id === transitionToStateRef.current.getValue()[0].value);
    thisToState && thisToState.parameters.forEach((parameter, argIdx) => {
        inArgumentValuesArray.push({"paraID" : parameter.id, "argValue": transitionInArgRefs.current[modalTransition.id + parameter.id].value});
    });

    let thisOutMessage = "";
    if (subFuncMessages.find(element => element.id === transitionOutMessageRef.current.getValue()[0].value)) {
        thisOutMessage = subFuncMessages.find(element => element.id === transitionOutMessageRef.current.getValue()[0].value);
    } else if (paramInterMessages.find(element => element.id === transitionOutMessageRef.current.getValue()[0].value)) {
        thisOutMessage = paramInterMessages.find(element => element.id === transitionOutMessageRef.current.getValue()[0].value)
    } else {
        thisOutMessage = interSelector.messages.find(element => element.id === transitionOutMessageRef.current.getValue()[0].value);
    }
    thisOutMessage && thisOutMessage.parameters.forEach((parameter, msgIdx) => {
        outArgumentValuesArray.push({"paraID" : parameter.id, "argValue" : transitionOutArgRefs.current[modalTransition.id + parameter.id].value});
    });


    let updatedTransition = {
        "id": modalTransition.id,
        "name": transitionNameRef.current.value,
        "fromState": transitionFromStateRef.current.getValue()[0].value,
        "toState": transitionToStateRef.current.getValue()[0].value,
        "sourceHandle": modalTransition.sourceHandle,
        "targetHandle": modalTransition.targetHandle, 
        "toStateArguments": inArgumentValuesArray,
        "outMessageArguments": outArgumentValuesArray,
        "guard": transitionGuardRef.current.value,
        "outMessage": transitionOutMessageRef.current.getValue()[0].value,
        "inMessage": transitionInMessageRef.current.getValue()[0].value,
        "targetPort": targetport
    }

    updatedTransition.toStateArguments = inArgumentValuesArray;
    updatedTransition.outMessageArguments = outArgumentValuesArray;

    dispatch(changeTransitionDispatch(updatedTransition));
    
    // Close the modal
    handleClose();
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

  // Handle rerenders when changing toState and outMessage to update arguments list
  const handleToStateChange = (option) => {
    let payload = {
        "id": modalTransition.id,
        "toState": option.value
    }

    dispatch(changeTransitionToStateDispatch(payload));
  };

  const handleOutMessageChange = (option) => {
    let payload = {
        "id": modalTransition.id,
        "outMessage": option.value
    }

    dispatch(changeTransitionOutMessageDispatch(payload));
  };

  useEffect(() => {
    if (modalTransition) {
        updateModalTransition();
    }
  }, [transitionSelector]);

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
    <>
        <div className='providerflow' style={{width: 946, height: 596}}>
            <ReactFlowProvider>
                <div className='reactflow-wrapper' style={{width: 946, height: 596}}> 
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        nodeTypes={nodeTypes}
                        edgeTypes={edgeTypes}
                        connectionMode={'loose'}
                        panOnDrag={false}
                        panOnScroll={false}
                        zoomOnScroll={false}
                        autoPanOnNodeDrag={false}
                        autoPanOnConnect={false}
                        onReconnect={onReconnect}
                        zoomOnDoubleClick={false}
                        onEdgeClick={(evt, edge) => onEdgeClick(evt, edge)}
                        connectionLineComponent={ConnectionLine}
                        proOptions={proOptions}
                        onNodeDragStop={onNodeDragStop}
                        onEdgeMouseEnter={onEdgeMouseEnter}
                        onEdgeMouseLeave={onEdgeMouseLeave}
                    >
                        <div className="smHeader">
                            <header className="smTitle">{DisplayNameSetup(props.component.name, stateNameDnDMaxLength)} State Machine</header>
                        </div>
                    </ReactFlow>
                </div>
            </ReactFlowProvider>
      </div>
      <Modal show={show} onHide={handleClose} animation={false} data-testid="transition-modal" key={modalTransition.id}>
        <Modal.Header> 
            <Modal.Title>Configure { modalTransition.name || 'Transition' }</Modal.Title>
        </Modal.Header>
        <Modal.Body>
            <div id="dropdown-container">
                <div id="transitions-container">  
                    <div className="statenameandcolor">                 
                    <div className="statenameComp">
                        <Form>
                            <Form.Control name="statenameComp" type="text" 
                                placeholder="Enter a name" size="15" style={{width: 466}}
                                defaultValue={ modalTransition.name } ref={transitionNameRef} 
                                autoFocus />
                        </Form>
                    </div>
                    </div>                                    
                      <Row>
                          <Col>
                              <Select 
                                  options={fromStateOptions}
                                  getOptionValue ={(option)=>option.label}
                                  placeholder="Select a From State..."
                                  defaultValue={{ value : (modalTransition.fromState && modalTransition.fromState) || "",
                                    label : modalTransition.fromState && fromStateOptions && fromStateOptions.find(fromState => fromState.value === modalTransition.fromState) ? fromStateOptions.find(fromState => fromState.value === modalTransition.fromState).label : "Select a From State..."}}
                                  ref={transitionFromStateRef}
                              />
                          </Col>
                          <Col>
                              <Select 
                                  options={inMessageOptions}
                                  getOptionValue ={(option)=>option.label}
                                  placeholder="Select an In Message..."
                                  defaultValue={{ value : (modalTransition.inMessage && modalTransition.inMessage) || "",
                                    label : modalTransition.inMessage && inMessageOptions && inMessageOptions.find(message => message.value === modalTransition.inMessage) ? inMessageOptions.find(message => message.value === modalTransition.inMessage).label : "Select an In Message..."}}
                                  ref={transitionInMessageRef}
                              />
                          </Col>
                      </Row>
                      <Row>
                          <Col>
                              <Select 
                                  options={outMessageOptions}
                                  getOptionValue ={(option)=>option.label}
                                  placeholder="Select an Out Message..."
                                  defaultValue={{ value : (modalTransition.outMessage && modalTransition.outMessage) || "",
                                    label : modalTransition.outMessage && outMessageOptions && outMessageOptions.find(message => message.value === modalTransition.outMessage) ? outMessageOptions.find(message => message.value === modalTransition.outMessage).label : "Select an Out Message..."}}
                                  ref={transitionOutMessageRef}
                                  onChange={handleOutMessageChange}
                              />
                          </Col>
                          <Col>
                              <Select 
                                  options={toStateOptions}
                                  getOptionValue ={(option)=>option.label}
                                  placeholder="Select a To State..."
                                  defaultValue={{ value : (modalTransition.toState && modalTransition.toState) || "",
                                    label : modalTransition.toState && toStateOptions && toStateOptions.find(state => state.value === modalTransition.toState) ? toStateOptions.find(state => state.value === modalTransition.toState).label : "Select a To State..."}}
                                  ref={transitionToStateRef}
                                  onChange={handleToStateChange}
                              />
                          </Col>
                      </Row>
                      {(modalTransition.outMessage && checkMessageType(modalTransition.outMessage, modalTransition)) &&                                                  
                          <Row>
                              <Form.Control
                                      ref={transitionPortRef} 
                                      className="outMessagePort"
                                      type="text" autoComplete='off' placeholder='Target Port'
                                      data-testid="TransitionPortInput" title="Out Message Port"
                                      defaultValue={setInterfacePortFromMessageID(modalTransition.outMessage, modalTransition)}
                                      />
                          </Row>
                      }
                      <Row>
                          <Form.Control
                                  ref={transitionGuardRef}
                                  className="guardInput"
                                  type="text" autoComplete='off' placeholder='Guard Description'
                                  data-testid="guardInput" title="Guard Expression"
                                  defaultValue={(modalTransition.guard || "")} 
                          />
                      </Row>
                    { stateMachineSelector.states.find(element => element.id === modalTransition.toState) && 
                    <Accordion key={"accordion-inArguments-" + modalTransition.toState} id={"accordion-inArguments-" + modalTransition.toState} data-testid="accorHeaderInArg" style={{width: "466px", marginTop: "10px"}}>
                        <Accordion.Item id="accordion-inArguments-item">
                            <Accordion.Header data-testid="accorHeaderInArgButton" >
                                    To State Arguments
                            </Accordion.Header>
                            <Accordion.Body>
                                { stateMachineSelector.states.find(element => element.id === modalTransition.toState).parameters &&
                                (stateMachineSelector.states.find(element => element.id === modalTransition.toState).parameters.map((inArg, argIdx) => (
                                <Row key={"inArg-" + inArg.id} className="argNamingRow">
                                    <Col>
                                        {inArg.name + (inArg.type ? " (" + inArg.type + ")" : "")}
                                    </Col>
                                    <Col>
                                        <Form.Control key={modalTransition.id + inArg.id}
                                                    ref={e => transitionInArgRefs.current[modalTransition.id + inArg.id] = e}
                                                    defaultValue={ (modalTransition.toStateArguments[argIdx] && modalTransition.toStateArguments[argIdx].argValue) || "" }
                                                    data-testid="inArgInput"
                                                    id={"input-" + inArg.id}
                                                    className="portnamebox" type="text" autoComplete="off"  
                                                    placeholder="Argument Value"/>
                                    </Col>
                                </Row>)))}
                            </Accordion.Body>
                        </Accordion.Item>
                    </Accordion>}
                    { modalTransition.outMessage && 
                    <Accordion key={"accordion-outArguments-" + modalTransition.outMessage} id={"accordion-outArguments-" + modalTransition.outMessage}  data-testid="accorHeaderOutArg" style={{width: "466px", marginTop: "10px"}}>
                        <Accordion.Item id="accordion-inArguments-item">
                            <Accordion.Header data-testid="accorHeaderOutArgButton">
                                    Out Message Arguments
                            </Accordion.Header>
                            <Accordion.Body>
                                { subFuncMessages.find(element => element.id === modalTransition.outMessage) ? subFuncMessages.find(element => element.id === modalTransition.outMessage).parameters && 
                                (subFuncMessages.find(element => element.id === modalTransition.outMessage).parameters.map((outArg, argIdx) => (
                                <Row key={"outArg-" + outArg.id} className="argNamingRow">
                                    <Col>
                                        {outArg.name + (outArg.type ? " (" + outArg.type + ")" : "")}
                                    </Col>
                                    <Col>
                                        <Form.Control key={modalTransition.id + outArg.id}
                                                    ref={e => transitionOutArgRefs.current[modalTransition.id + outArg.id] = e}
                                                    defaultValue={ (modalTransition.outMessageArguments[argIdx] && modalTransition.outMessageArguments[argIdx].argValue) || "" }
                                                    data-testid="outArgInput"
                                                    className="portnamebox" type="text" autoComplete="off"
                                                    placeholder="Argument Value" />
                                    </Col>
                                </Row>))) :
                                    paramInterMessages.find(element => element.id === modalTransition.outMessage) ? paramInterMessages.find(element => element.id === modalTransition.outMessage) &&
                                (paramInterMessages.find(element => element.id === modalTransition.outMessage).parameters.map((outArg, argIdx) => (
                                <Row key={"outArg-" + outArg.id} className="argNamingRow">
                                    <Col>
                                        {outArg.name + (outArg.type ? " (" + outArg.type + ")" : "")}
                                    </Col>
                                    <Col>
                                        <Form.Control key={modalTransition.id + outArg.id}
                                                    ref={e => transitionOutArgRefs.current[modalTransition.id + outArg.id] = e}
                                                    defaultValue={ (modalTransition.outMessageArguments[argIdx] && modalTransition.outMessageArguments[argIdx].argValue) || "" }
                                                    data-testid="outArgInput"
                                                    className="portnamebox" type="text" autoComplete="off"
                                                    placeholder="Argument Value" />
                                    </Col>
                                </Row>))) :
                                    interSelector.messages.find(element => element.id === modalTransition.outMessage) ? interSelector.messages.find(element => element.id === modalTransition.outMessage).parameters &&
                                (interSelector.messages.find(element => element.id === modalTransition.outMessage).parameters.map((outArg, argIdx) => (
                                <Row key={"outArg-" + outArg.id} className="argNamingRow">
                                    <Col>
                                        {outArg.name + (outArg.type ? " (" + outArg.type + ")" : "")}
                                    </Col>
                                    <Col>
                                        <Form.Control key={modalTransition.id + outArg.id}
                                                    ref={e => transitionOutArgRefs.current[modalTransition.id + outArg.id] = e}
                                                    defaultValue={ (modalTransition.outMessageArguments[argIdx] && modalTransition.outMessageArguments[argIdx].argValue) || "" }
                                                    data-testid="outArgInput"
                                                    className="portnamebox" type="text" autoComplete="off"
                                                    placeholder="Argument Value" />
                                    </Col>
                                </Row>))) : ""}
                            </Accordion.Body>
                        </Accordion.Item>
                    </Accordion>}
                </div>                                   
            </div>
        </Modal.Body>
        <Modal.Footer>
            <Button className="deleteState" variant="danger" onClick={deleteTransition}>Delete</Button>
            <Button variant="primary" onClick={saveComponentInfo}> Save Changes </Button>
            <Button variant="secondary" onClick={handleClose}> Close </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default ReactFlowBox;