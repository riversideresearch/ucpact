/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/ext-language_tools";
import "ace-builds/src-noconflict/mode-jsx";
import "ace-builds/src-noconflict/theme-pastel_on_dark";
import 'ace-builds/src-noconflict/theme-chrome';
import { useSelector } from 'react-redux'
import { Button } from "react-bootstrap";
import UcdslMode from '../features/ace-modes/mode-ucdsl.js';
import { Store } from 'react-notifications-component'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faCopy, faFileArrowDown, faPaintBrush } from '@fortawesome/free-solid-svg-icons';
import './codeGenerator.css'
import { useParams } from 'react-router';
import axios from 'axios';
import { useAuth } from "react-oidc-context";
import { commentBreaker } from './helperFunctions.js';

function CodeGenerator(props) {
  const interSelector = useSelector((state) => state.interfaces) // Redux selector for interfaces
  const idealFuncSelector = useSelector((state) => state.idealFunctionality) // Redux selector for ideal functionality
  const simSelector = useSelector((state) => state.simulator) // Redux selector for simulator
  const realFuncSelector = useSelector((state) => state.realFunctionality) // Redux selector for Real Functionality
  const partySelector = useSelector((state) => state.parties) // Redux selector for parties
  const stateMachineSelector = useSelector((state) => state.stateMachines); // Redux selector for state machines
  const subfuncSelector = useSelector(state => state.subfunctionalities); // Redux selector for subfunctionalities
  const editorRef = React.createRef();

  const auth = useAuth();

  const { subFuncMessages, paramInterMessages, clickCount } = props;
  const [idealFuncApiData, setIdealFuncApiData] = useState();
  const [isLight, changeIsLight] = useState(true);

  library.add(faCopy);
  library.add(faFileArrowDown);
  library.add(faPaintBrush);

  useEffect(() => {
      editorRef.current.editor.renderer.updateFull();
      const ucdslMode = new UcdslMode();
  
      editorRef.current.editor.getSession().setMode(ucdslMode);
  }, [isLight]);

  // API call for ideal functionalities for simulator's parameters
  useEffect(() => {
    let urlPath = process.env.REACT_APP_SERVER_PREFIX + "/idealFunctionalities";
    let token = "none";
    if ((process.env.NODE_ENV !== 'test' && process.env.REACT_APP_AUTH_DISABLED !== 'TRUE')) {
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
  }, [simSelector]);

  useEffect(() => {
    // refresh editor whenever a new section might need to be rendered
    editorRef.current.editor.renderer.updateFull();
  }, [partySelector, subfuncSelector, simSelector, interSelector, realFuncSelector, clickCount]);

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    Store.addNotification({
      title: "Code copied to clipboard.",
      type: "info",
      insert: "top",
      container: "top-right",
      animationIn: ["animate__animated", "animate__fadeIn"],
      animationOut: ["animate__animated", "animate__fadeOut"],
      dismiss: {
        duration: 2000,
        onScreen: true
      }
    });
  }

  const { id } = useParams();

  const exportCode = (code) => {
    const blob = new Blob([code], {type: "text/plain"});
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = id + ".uc";
    link.href = url;
    link.click();
  }

  // generate the code for the interfaces
  const interCodeConstructor = () => {
    let finalString = "";
    interSelector.basicInters.forEach((element) => {
      // do stuff for each basic inter here
      if (element.type === "direct") {
        finalString +=  "(* Basic direct interface *)\n"
        if(element.interfaceComment.length>0){
          if(element.interfaceComment.length >= 80){
            finalString += "(* "+commentBreaker(element.interfaceComment, 80, 0) + "\n *)\n"
          }else{finalString+= "(* "+element.interfaceComment +" *)\n"}
        }
        finalString += "direct " + element.name + " {\n";
      } else if (element.type === "adversarial") {
          finalString += "(* Basic adversarial interface *)\n"
          if(element.interfaceComment.length>0){
            if(element.interfaceComment.length>= 80){
              finalString += "(* "+commentBreaker(element.interfaceComment, 80, 0) + "\n *)\n"
            }else{finalString+= "(* "+element.interfaceComment +" *)\n"}
        }
        finalString += "adversarial " + element.name + " {\n"
      }

      element.messages.forEach((message) => {
        let theMessageIndex = interSelector.messages.findIndex(m => m.id === message)
        let theMessageState = interSelector.messages[theMessageIndex];

        if (theMessageState) {
          if (theMessageState.type === "in") {
            if(theMessageState.messageComment.length > 0){
              if(theMessageState.messageComment.length >= 65){
                finalString += "   (* " +commentBreaker(theMessageState.messageComment, 65, 1) +"\n    *)\n"
              }else{finalString += "   (* "+theMessageState.messageComment +" *)\n"}
            }
            finalString += (
              "   " + theMessageState.type + " " + ((element.type === "direct") ? (theMessageState.port || "undefined") + "@" + (theMessageState.name || "undefined") : (theMessageState.name || "undefined"))
            );
            if (theMessageState.parameters.length > 0) {
              finalString += "(";
            }
            theMessageState.parameters.forEach((param) => {
              if (param !== theMessageState.parameters[theMessageState.parameters.length - 1]) {
                finalString += (
                  param.name + " : " + param.type + ", "
                );
              } else {
                finalString += (
                  param.name + " : " + param.type
                );
              }
            })
            if ((message !== element.messages[element.messages.length - 1]) && (theMessageState.parameters.length > 0)) {
              finalString += ")\n";
            } else if (theMessageState.parameters.length > 0) {
              finalString += ")";
            } else if (message !== element.messages[element.messages.length - 1]) {
              finalString += "\n";
            }
            
          } else if (theMessageState.type === "out") {
            if(theMessageState.messageComment.length > 0){
              if(theMessageState.messageComment.length >= 65){
                finalString += "   (* " + commentBreaker(theMessageState.messageComment, 65, 1) +"\n    *)\n"
              }else{finalString += "   (* " +theMessageState.messageComment +" *)\n"}
            }
            finalString += (
              "   " + theMessageState.type + " " + (theMessageState.name || "undefined")
            );
            if (theMessageState.parameters.length > 0) {
              finalString += "(";
            }
            theMessageState.parameters.forEach((param) => {
              if (param !== theMessageState.parameters[theMessageState.parameters.length - 1]) {
                finalString += (
                  param.name + " : " + param.type + ", "
                );
              } else {
                finalString += (
                  param.name + " : " + param.type + ")"
                );
              }   
            })
            if (element.type === "direct") {
              finalString += (
                "@" + (theMessageState.port || "undefined")
              );
            }
            if (message !== element.messages[element.messages.length - 1]) {
              finalString += "\n";
            }
          }
        }
      })

      finalString += "\n}"
      finalString += "\n\n"
    });

    interSelector.compInters.forEach((element) => {
      // do stuff for each composite inter here
      if (element.type === "direct") {
        finalString += "(* Composite direct interface *)\n"
        if(element.interfaceComment.length > 0){
          if(element.interfaceComment.length >= 80){
            finalString += "(* " +commentBreaker(element.interfaceComment,80,0) +"\n *)\n"
          }else{finalString += "(* "  + element.interfaceComment+" *)\n"}
        }
        finalString += "direct " + element.name + " {\n";
      } else if (element.type === "adversarial") {
        finalString += "(* Composite adversarial interface *)\n"
        if(element.interfaceComment.length > 0){
          if(element.interfaceComment.length >= 80){
            finalString += "(* " +commentBreaker(element.interfaceComment,80,0) +"\n *)\n"
          }else{finalString += "(* "  + element.interfaceComment+" *)\n"}
        }
        
          finalString += "adversarial " + element.name + " {\n"
      }

      element.basicInterfaces.forEach((basicInt) => {
        let theInterfaceIndex = interSelector.basicInters.findIndex(i => i.id === basicInt.idOfBasic)
        if (theInterfaceIndex !== -1) {
          let theInterfaceState = interSelector.basicInters[theInterfaceIndex];
          finalString += (
            "   " + basicInt.name + " : " + theInterfaceState.name + "\n"
          );
        }
      })
      finalString += "}"
      finalString += "\n\n"
    });

    return finalString;
  }

  const genTransitionNameComment = (transition, preSpaces) => {
    return transition.name ? `${preSpaces}(* Transition Name: ${transition.name} *) \n` : "";
  }

  // generate the code for the Ideal Functionality
  const idealFuncCodeConstructor = () => {
    let finalString = "";

    let compDir = (interSelector.compInters[interSelector.compInters.findIndex(inter => inter.id === idealFuncSelector.compositeDirectInterface)]) || "";
    let basicAdv = (interSelector.basicInters[interSelector.basicInters.findIndex(inter => inter.id === idealFuncSelector.basicAdversarialInterface)]) || {name: ""};

    finalString += (
      "(* Ideal functionality *)\n" +
      "functionality " + idealFuncSelector.name + " implements " + compDir.name + " " + basicAdv.name + "{\n\n"
    );

    // add the initial state code
    let thisStateMachine = (stateMachineSelector.stateMachines[stateMachineSelector.stateMachines.findIndex(element => element.id === idealFuncSelector.stateMachine)]) || "";
    let initState = (stateMachineSelector.states[stateMachineSelector.states.findIndex(element => element.id === thisStateMachine.initState)]) || "";
    let thisStateMachineTransitionArray = stateMachineSelector.transitions.filter(element => thisStateMachine.transitions.includes(element.id));
    let thisInitStateTransitionArray = thisStateMachineTransitionArray.filter(element => element.fromState === initState.id);

    if('comment' in initState){
      if(initState.comment.length > 70){
        finalString += "  (* " +commentBreaker(initState.comment, 70, 2) + "\n   *)\n"
      }
      else if(initState.comment.length >0){
        finalString += "  (* " +initState.comment + " *)\n"
      }
    }

    finalString += (
      "  initial state " + initState.name + " {\n" +
      "    match message with\n"
    );

    let thisInitStateInMessageArray = [];
    let thisInitStateInMessageInfo = {};

    // State Machine Code
    if (thisStateMachine) {
      thisInitStateTransitionArray.forEach(transition => {
        if (thisInitStateInMessageInfo[transition.inMessage]) {
          thisInitStateInMessageInfo[transition.inMessage].push(transition);
        } else {
          thisInitStateInMessageArray.push(transition.inMessage);
          thisInitStateInMessageInfo[transition.inMessage] = [transition];
        }
      });

      thisInitStateInMessageArray.forEach(currentInMessage => {
        // Determine if single transition guard code is needed
        // For this message, determine if any transitions include guard code
        let singleTransitionGuard = false;
        thisInitStateTransitionArray.forEach(transition => {
          if (transition.inMessage === currentInMessage && transition.guard !== "") {
            singleTransitionGuard = true;
          }
        });
        // Guard Code
        if (thisInitStateInMessageInfo[currentInMessage].length > 1) {
          // In Message Info
          let inMessage = interSelector.messages.find(element => element.id === currentInMessage) || "";
          let inMessageBasic = "";
          interSelector.basicInters.forEach((basic) => {
            basic.messages.forEach((message) => {
              if (message === inMessage.id) {
                inMessageBasic = basic;
              }
            })
          })

          let inMessageComp = interSelector.compInters.find(element => element.basicInterfaces.find(element => element.idOfBasic === inMessageBasic.id)) || "";
          let inMessageBasicInstance = "";
          if (inMessageComp) {
            inMessageBasicInstance = inMessageComp.basicInterfaces.find(element => element.idOfBasic === inMessageBasic.id) || "";  
          }
          let inMessageTrace = ((inMessageComp.name) ? (inMessageComp.name + ".") : "") + ((inMessageComp.name) ? inMessageBasicInstance.name : inMessageBasic.name) + "." + inMessage.name;

          let receiveArguments = "";
          if (currentInMessage) {
            interSelector.messages.find(element => element.id === currentInMessage).parameters.forEach((param, idx, arr) => {
              if (idx === arr.length - 1) {
                if (arr.length === 1) {
                  receiveArguments += (
                    "(" + param.name + ")"
                  );
                } else {
                  receiveArguments += (
                    param.name + ")"
                  );
                }
              } else if (idx === 0) {
                receiveArguments += (
                  "(" + param.name + ", "
                );
              } else {
                receiveArguments += (
                  param.name + ", "
                );
              }
            })
          }

          finalString +=  "      | " + ((inMessage.port) ? (inMessage.port + "@") : (inMessageBasic.type === "adversarial") ? "" : "undefined@") + inMessageTrace + receiveArguments + " => {\n"
          
          finalString += (
            "        (* The below 'if else' branches represent Guards in the UCDSL\n" + 
            "         * Guards are used to differentiate transitions that may have\n" +
            "         * identical 'from' states and 'in' messages *)\n"
          )
          // Code for each transition
          thisInitStateInMessageInfo[currentInMessage].forEach((transition, idx, arr) => {
            if (idx === 0) {
              finalString += (
                "        if (" + (transition.guard) +") { \n"
              );
            } else {
              finalString += (
                " elif (" + (transition.guard) + ") { \n"
              )
            }

            // Out Message Info
            let outMessage = interSelector.messages.find(element => element.id === transition.outMessage) || "";
            let outMessageBasic = "";
            interSelector.basicInters.forEach((basic) => {
              basic.messages.forEach((message) => {
                if (message === outMessage.id) {
                  outMessageBasic = basic;
                }
              })
            })
            let outMessageComp = interSelector.compInters.find(element => element.basicInterfaces.find(element => element.idOfBasic === outMessageBasic.id)) || "";
            let outMessageBasicInstance = "";
            if (outMessageComp) {
              outMessageBasicInstance = outMessageComp.basicInterfaces.find(element => element.idOfBasic === outMessageBasic.id) || "";
            }

            let outMessageTrace = ((outMessageComp.name) ? (outMessageComp.name + ".") : "") + ((outMessageComp.name) ? outMessageBasicInstance.name : outMessageBasic.name) + "." + outMessage.name;

            let toState = "";
            if (stateMachineSelector.states.find(element => element.id === transition.toState)) {
              toState = stateMachineSelector.states.find(element => element.id === transition.toState).name
            }

            let sendArguments = "";
            if (transition.outMessage) {
              transition.outMessageArguments.forEach((arg, idx, arr) => {
                if (idx === arr.length - 1) {
                  if (arr.length === 1) {
                    sendArguments += (
                      "(" + arg.argValue + ")"
                    );
                  } else {
                    sendArguments += (
                      arg.argValue + ")"
                    );
                  }
                } else if (idx === 0) {
                  sendArguments += (
                    "(" + arg.argValue + ", "
                  );
                } else {
                  sendArguments += (
                    arg.argValue + ", "
                  );
                }
              })
            }

            let nameComment = genTransitionNameComment(transition, "           ");

            finalString += ( 
              nameComment +
              "           send " + outMessageTrace + sendArguments + ((transition.targetPort) ? ("@" + transition.targetPort) : (outMessageBasic.type === "adversarial") ? "" : "@undefined") + "\n" +
              "           and transition " + toState           
            );

            if (toState) {
              if (transition.toStateArguments.length > 0) {

                transition.toStateArguments.forEach((param, idx, arr) => {
                  if (idx === arr.length - 1) {
                    if (arr.length === 1) {
                      finalString += (
                        "(" + param.argValue + ")"
                      );
                    } else {
                      finalString += (
                        param.argValue + ")"
                      );
                    }
                    
                  } else if (idx === 0) {
                    finalString += (
                      "(" + param.argValue + ", "
                    );
                  } else {
                    finalString += (
                      param.argValue + ", "
                    );
                  } 
                })
              }
            }
            finalString += ".\n        }" 
            
            if (idx === arr.length - 1) {
              finalString += " else { fail. }\n"
            }
          });
          finalString += "      }\n\n"

        } else if (singleTransitionGuard) { // Guard code for single transitions
          let transition = thisInitStateTransitionArray.find(transition => transition.inMessage === currentInMessage)
          // In Message Info
          let inMessage ="";
          let inMessageBasic = "";
          let inMessageComp = "";
          let inMessageBasicInstance = "";
          let inMessageTrace = "";
          if (subFuncMessages.find(element => element.id === currentInMessage)) {
            inMessage = subFuncMessages.find(element => element.id === currentInMessage);
            inMessageComp = inMessage.compInter;
            inMessageBasicInstance = inMessage.compInter.basicInterfaces.find(element => element.idOfBasic === inMessage.basicInter.id);
            let thisSubFunc = subfuncSelector.subfunctionalities.find(element => element.id === subFuncMessages.find(element => element.id === currentInMessage).subfuncId) || { "name" : "" };
            inMessageTrace = thisSubFunc.name + "." + inMessageBasicInstance.name + "." + inMessage.name;
          } else if (paramInterMessages.find(element => element.id === currentInMessage)) {
            inMessage = paramInterMessages.find(element => element.id === currentInMessage);
            inMessageComp = inMessage.compInter;
            inMessageBasicInstance = inMessage.compInter.basicInterfaces.find(element => element.idOfBasic === inMessage.basicInter.id);
            let thisParamInter = realFuncSelector.parameterInterfaces.find(element => element.id === paramInterMessages.find(element => element.id === currentInMessage).paramInterId) || { "name" : "" };
            inMessageTrace = thisParamInter.name + "." + inMessageBasicInstance.name + "." + inMessage.name;
          } else {
            inMessage = interSelector.messages.find(element => element.id === currentInMessage) || "";

            interSelector.basicInters.forEach((basic) => {
              basic.messages.forEach((message) => {
                if (message === inMessage.id) {
                  inMessageBasic = basic;
                }
              })
            });

            inMessageComp = interSelector.compInters.find(element => element.basicInterfaces.find(element => element.idOfBasic === inMessageBasic.id)) || "";
            if (inMessageComp) {
              inMessageBasicInstance = inMessageComp.basicInterfaces.find(element => element.idOfBasic === inMessageBasic.id) || "";  
            }  
            inMessageTrace = inMessageComp.name + "." + inMessageBasicInstance.name + "." + inMessage.name;
          }


          let receiveArguments = "";
          if (currentInMessage) {
            let parameters = [];
            if (subFuncMessages.find(element => element.id === currentInMessage)) {
              parameters = subFuncMessages.find(element => element.id === currentInMessage).parameters;
            } else if (paramInterMessages.find(element => element.id === currentInMessage)) {
              parameters = paramInterMessages.find(element => element.id === currentInMessage).parameters;
            } else if (interSelector.messages.find(element => element.id === currentInMessage)) {
              parameters = interSelector.messages.find(element => element.id === currentInMessage).parameters;
            }
            parameters.forEach((param, idx, arr) => {
              if (idx === arr.length - 1) {
                if (arr.length === 1) {
                  receiveArguments += (
                    "(" + param.name + ")"
                  );
                } else {
                  receiveArguments += (
                    param.name + ")"
                  );
                }
              } else if (idx === 0) {
                receiveArguments += (
                  "(" + param.name + ", "
                );
              } else {
                receiveArguments += (
                  param.name + ", "
                );
              }
            })
          }
          if (subFuncMessages.find(element => element.id === currentInMessage) || 
              (paramInterMessages.find(element => element.id === currentInMessage))) {
            finalString +=  "        | " + inMessageTrace + receiveArguments + " => {\n"
          } else {
            finalString +=  "        | " + ((inMessage.port) ? (inMessage.port + "@") : (inMessageBasic.type === "adversarial") ? "" : "undefined@") + inMessageTrace + receiveArguments + " => {\n"
          }
          finalString += "        (* The below 'if else' branches represent Guards in the UCDSL *)\n"
            
          
          // Code for the transition
          let nameComment = genTransitionNameComment(transition, "         ");
          finalString += nameComment;
          finalString += (
            "          if (" + (transition.guard) +") { \n"
          );

          // Out Message Info
          let outMessage ="";
          let outMessageBasic = "";
          let outMessageComp = "";
          let outMessageBasicInstance = "";
          let outMessageTrace = "";
          let outMessageIsNotDirect = false;
          if (subFuncMessages.find(element => element.id === transition.outMessage)) {
            outMessage = subFuncMessages.find(element => element.id === transition.outMessage);
            outMessageComp = outMessage.compInter;
            outMessageBasicInstance = outMessage.compInter.basicInterfaces.find(element => element.idOfBasic === outMessage.basicInter.id);
            let thisSubFunc = subfuncSelector.subfunctionalities.find(element => element.id === subFuncMessages.find(element => element.id === transition.outMessage).subfuncId) || { "name" : "" };
            outMessageTrace = thisSubFunc.name + "." + outMessageBasicInstance.name + "." + outMessage.name;
            outMessageIsNotDirect = true;
          } else if (paramInterMessages.find(element => element.id === transition.outMessage)) {
            outMessage = paramInterMessages.find(element => element.id === transition.outMessage);
            outMessageComp = outMessage.compInter;
            outMessageBasicInstance = outMessage.compInter.basicInterfaces.find(element => element.idOfBasic === outMessage.basicInter.id);
            let thisParamInter = realFuncSelector.parameterInterfaces.find(element => element.id === paramInterMessages.find(element => element.id === transition.outMessage).paramInterId) || { "name" : "" };
            outMessageTrace = thisParamInter.name + "." + outMessageBasicInstance.name + "." + outMessage.name;
            outMessageIsNotDirect = true;
          } else {
            outMessage = interSelector.messages.find(element => element.id === transition.outMessage) || "";
          
            outMessageBasic = "";
            interSelector.basicInters.forEach((basic) => {
              basic.messages.forEach((message) => {
                if (message === outMessage.id) {
                  outMessageBasic = basic;
                }
              })
            })

            if (outMessageBasic.type === 'direct') {
              outMessageComp = interSelector.compInters.find(element => element.basicInterfaces.find(element => element.idOfBasic === outMessageBasic.id)) || "";
              outMessageBasicInstance = "";
              if (outMessageComp) {
                outMessageBasicInstance = outMessageComp.basicInterfaces.find(element => element.idOfBasic === outMessageBasic.id) || "";
              }

              outMessageTrace = realFuncSelector.name + "." + outMessageComp.name + "." + outMessageBasicInstance.name + "." + outMessage.name;
            } else {
              outMessageTrace =  outMessageBasic.name + "." + outMessage.name;
              outMessageIsNotDirect = true
            }
          }

          let toState = "";
          if (stateMachineSelector.states.find(element => element.id === transition.toState)) {
            toState = stateMachineSelector.states.find(element => element.id === transition.toState).name
          }

          let sendArguments = "";
          if (transition.outMessage) {
            transition.outMessageArguments.forEach((arg, idx, arr) => {
              if (idx === arr.length - 1) {
                if (arr.length === 1) {
                  sendArguments += (
                    "(" + arg.argValue + ")"
                  );
                } else {
                  sendArguments += (
                    arg.argValue + ")"
                  );
                }
              } else if (idx === 0) {
                sendArguments += (
                  "(" + arg.argValue + ", "
                );
              } else {
                sendArguments += (
                  arg.argValue + ", "
                );
              }
            })
          }


          finalString += ( 
            "             send " + outMessageTrace + sendArguments + ((transition.targetPort) ? ("@" + transition.targetPort) : (outMessageIsNotDirect) ? "" : "@undefined") + "\n" +
            "             and transition " + toState           
          );

          if (toState) {
            if (transition.toStateArguments.length > 0) {

              transition.toStateArguments.forEach((param, idx, arr) => {
                if (idx === arr.length - 1) {
                  if (arr.length === 1) {
                    finalString += (
                      "(" + param.argValue + ")"
                    );
                  } else {
                    finalString += (
                      param.argValue + ")"
                    );
                  }
                  
                } else if (idx === 0) {
                  finalString += (
                    "(" + param.argValue + ", "
                  );
                } else {
                  finalString += (
                    param.argValue + ", "
                  );
                } 
              })
            }
          }
          finalString += ".\n" 
          finalString += (
            "          } else {\n"
          );
          finalString += (
            "             fail.\n          }\n"
          );
          
          finalString += "        }\n\n"
        } else {
          // Normal transition code
          let thisTransition = thisInitStateInMessageInfo[currentInMessage][0];

          // In Message Info
          let inMessage = interSelector.messages.find(element => element.id === currentInMessage) || "";
          let inMessageBasic = "";
          let inMessageIsAdv =  false;
          interSelector.basicInters.forEach((basic) => {
            basic.messages.forEach((message) => {
              if (message === inMessage.id) {
                inMessageBasic = basic;
              }
            })
          })
        if(inMessageBasic.type === "adversarial"){
          inMessageIsAdv = true;
        }
          let inMessageComp = interSelector.compInters.find(element => element.basicInterfaces.find(element => element.idOfBasic === inMessageBasic.id)) || "";
          let inMessageBasicInstance = "";
          if (inMessageComp) {
            inMessageBasicInstance = inMessageComp.basicInterfaces.find(element => element.idOfBasic === inMessageBasic.id) || "";  
          }  
          let inMessageTrace = ((inMessageComp.name) ? (inMessageComp.name + ".") : "") + ((inMessageComp.name) ? inMessageBasicInstance.name : inMessageBasic.name) + "." + inMessage.name;

          // Out Message Info
          let outMessage = interSelector.messages.find(element => element.id === thisTransition.outMessage) || "";
          let outMessageBasic = "";
          let outMessageIsAdv = false
          interSelector.basicInters.forEach((basic) => {
            basic.messages.forEach((message) => {
              if (message === outMessage.id) {
                outMessageBasic = basic;
              }
            })
          })
          if(outMessageBasic.type === "adversarial"){
            outMessageIsAdv = true;
          }
          let outMessageComp = interSelector.compInters.find(element => element.basicInterfaces.find(element => element.idOfBasic === outMessageBasic.id)) || "";
          let outMessageBasicInstance = "";
          if (outMessageComp) {
            outMessageBasicInstance = outMessageComp.basicInterfaces.find(element => element.idOfBasic === outMessageBasic.id) || "";
          }

          let outMessageTrace = ((outMessageComp.name) ? (outMessageComp.name + ".") : "") + ((outMessageComp.name) ? outMessageBasicInstance.name : outMessageBasic.name) + "." + outMessage.name;

          let toState = "";
          if (stateMachineSelector.states.find(element => element.id === thisTransition.toState)) {
            toState = stateMachineSelector.states.find(element => element.id === thisTransition.toState).name
          }

          let sendArguments = "";
          if (thisTransition.outMessage) {
            thisTransition.outMessageArguments.forEach((arg, idx, arr) => {
              if (idx === arr.length - 1) {
                if (arr.length === 1) {
                  sendArguments += (
                    "(" + arg.argValue + ")"
                  );
                } else {
                  sendArguments += (
                    arg.argValue + ")"
                  );
                }
              } else if (idx === 0) {
                sendArguments += (
                  "(" + arg.argValue + ", "
                );
              } else {
                sendArguments += (
                  arg.argValue + ", "
                );
              }
            })
          }

          let receiveArguments = "";
          if (thisTransition.inMessage && interSelector.messages.find(element => element.id === thisTransition.inMessage)) {
            interSelector.messages.find(element => element.id === thisTransition.inMessage).parameters.forEach((param, idx, arr) => {
              if (idx === arr.length - 1) {
                if (arr.length === 1) {
                  receiveArguments += (
                    "(" + param.name + ")"
                  );
                } else {
                  receiveArguments += (
                    param.name + ")"
                  );
                }
              } else if (idx === 0) {
                receiveArguments += (
                  "(" + param.name + ", "
                );
              } else {
                receiveArguments += (
                  param.name + ", "
                );
              }
            })
          }

          let nameComment = genTransitionNameComment(thisTransition, "          ");

          finalString += ( 
            "      | " + ((inMessage.port) ? (inMessage.port + "@") : (inMessageIsAdv) ? "" : "undefined@") + inMessageTrace + receiveArguments + " => {\n" +
            nameComment +
            "          send " + outMessageTrace + sendArguments + ((thisTransition.targetPort) ? ("@" + thisTransition.targetPort) : (outMessageIsAdv) ?  "" : "@undefined") + "\n" +
            "          and transition " + toState           
          );

          if (toState) {
            if (thisTransition.toStateArguments.length > 0) {

              thisTransition.toStateArguments.forEach((param, idx, arr) => {
                if (idx === arr.length - 1) {
                  if (arr.length === 1) {
                    finalString += (
                      "(" + param.argValue + ").\n" +
                      "      }\n\n" 
                    );
                  } else {
                    finalString += (
                      param.argValue + ").\n" +
                      "      }\n\n" 
                    );
                  }
                  
                } else if (idx === 0) {
                  finalString += (
                    "(" + param.argValue + ", "
                  );
                } else {
                  finalString += (
                    param.argValue + ", "
                  );
                } 
              })
            } else {
              finalString += ".\n      }\n\n"
            }
          } 
        }
      });

      finalString += (
        "\n      | * => { fail. }\n" +
        "    end\n" +
        "  }\n\n"
        );
    }
    
    // add the other states' code
    if (thisStateMachine) {
      thisStateMachine.states.filter(element => element !== thisStateMachine.initState).forEach(state => { // for each state that is not the initState
        let thisState = stateMachineSelector.states.find(element => element.id === state);
        let thisStateTransitionArray = thisStateMachineTransitionArray.filter(element => element.fromState === thisState.id);
        let thisStateInMessageArray = [];
        let thisStateInMessageInfo = {};

        if (thisState) {
        if('comment' in thisState){
          if(thisState.comment.length > 70){
            finalString += "  (* " +commentBreaker(thisState.comment, 70, 2) + "\n   *)\n"
          }
          else if(thisState.comment.length >0){
            finalString += "  (* " +thisState.comment + " *)\n"
          }
        }
        finalString += (
          "  state " + thisState.name 
        );
          
        thisState.parameters.forEach((param, idx, arr) => {
          if (idx === arr.length - 1) {
            if (arr.length === 1) {
              finalString += (
                "(" + param.name + " : " + param.type + ")"
              );
            } else {
              finalString += (
                param.name + " : " + param.type + ")"
              );
            }  
          } else if (idx === 0) {
            finalString += (
              "(" + param.name + " : " + param.type + ", "
            );
          } else {
            finalString += (
              param.name + " : " + param.type + ", "
            );
          }
        });

        finalString += (
          " {\n" +
          "    match message with\n"
        );

        thisStateTransitionArray.forEach(transition => {
          if (thisStateInMessageInfo[transition.inMessage]) {
            thisStateInMessageInfo[transition.inMessage].push(transition);
          } else {
            thisStateInMessageArray.push(transition.inMessage);
            thisStateInMessageInfo[transition.inMessage] = [transition];
          }
        });
        
        thisStateInMessageArray.forEach(currentInMessage => {
          // Determine if single transition guard code is needed
          // For this message, determine if any transitions include guard code
          let singleTransitionGuard = false;
          thisStateTransitionArray.forEach(transition => {
            if (transition.inMessage === currentInMessage && transition.guard !== "") {
              singleTransitionGuard = true;
            }
          });
          // Guard Code
          if (thisStateInMessageInfo[currentInMessage].length > 1) {
            // In Message Info
            let inMessage = interSelector.messages.find(element => element.id === currentInMessage) || "";
            let inMessageBasic = "";
            let inMessageIsAdv = false;
            interSelector.basicInters.forEach((basic) => {
              basic.messages.forEach((message) => {
                if (message === inMessage.id) {
                  inMessageBasic = basic;
                }
              })
            });
            if(inMessageBasic.type === "adversarial"){
              inMessageIsAdv = true;
            }
            let inMessageComp = interSelector.compInters.find(element => element.basicInterfaces.find(element => element.idOfBasic === inMessageBasic.id)) || "";
            let inMessageBasicInstance = "";
            if (inMessageComp) {
              inMessageBasicInstance = inMessageComp.basicInterfaces.find(element => element.idOfBasic === inMessageBasic.id) || "";  
            }  
            let inMessageTrace = ((inMessageComp.name) ? (inMessageComp.name + ".") : "") + ((inMessageComp.name) ? inMessageBasicInstance.name : inMessageBasic.name) + "." + inMessage.name;
  
            let receiveArguments = "";
            if (currentInMessage) {
              interSelector.messages.find(element => element.id === currentInMessage).parameters.forEach((param, idx, arr) => {
                if (idx === arr.length - 1) {
                  if (arr.length === 1) {
                    receiveArguments += (
                      "(" + param.name + ")"
                    );
                  } else {
                    receiveArguments += (
                      param.name + ")"
                    );
                  }
                } else if (idx === 0) {
                  receiveArguments += (
                    "(" + param.name + ", "
                  );
                } else {
                  receiveArguments += (
                    param.name + ", "
                  );
                }
              })
            }
  
            finalString +=  "      | " + ((inMessage.port) ? (inMessage.port + "@") : (inMessageIsAdv) ? "" : "undefined@") + inMessageTrace + receiveArguments + " => {\n"
            
            finalString += (
              "        (* The below 'if else' branches represent Guards in the UCDSL\n" + 
              "         * Guards are used to differentiate transitions that may have\n" +
              "         * identical 'from' states and 'in' messages *)\n"
            )
            // Code for each transition
            thisStateInMessageInfo[currentInMessage].forEach((transition, idx, arr) => {
              if (idx === 0) {
                finalString += (
                  "        if (" + (transition.guard) +") { \n"
                );
              } else {
                finalString += (
                  " elif (" + (transition.guard) + ") { \n"
                )
              }
  
              // Out Message Info
              let outMessage = interSelector.messages.find(element => element.id === transition.outMessage) || "";
              let outMessageBasic = "";
              let outMessageIsAdv = false;
              interSelector.basicInters.forEach((basic) => {
                basic.messages.forEach((message) => {
                  if (message === outMessage.id) {
                    outMessageBasic = basic;
                  }
                })
              })
              if(outMessageBasic.type === "adversarial"){
                outMessageIsAdv = true;
              }
              let outMessageComp = interSelector.compInters.find(element => element.basicInterfaces.find(element => element.idOfBasic === outMessageBasic.id)) || "";
              let outMessageBasicInstance = "";
              if (outMessageComp) {
                outMessageBasicInstance = outMessageComp.basicInterfaces.find(element => element.idOfBasic === outMessageBasic.id) || "";
              }
  
              let outMessageTrace = ((outMessageComp.name) ? (outMessageComp.name + ".") : "") + ((outMessageComp.name) ? outMessageBasicInstance.name : outMessageBasic.name) + "." + outMessage.name;
  
              let toState = "";
              if (stateMachineSelector.states.find(element => element.id === transition.toState)) {
                toState = stateMachineSelector.states.find(element => element.id === transition.toState).name
              }
  
              let sendArguments = "";
              if (transition.outMessage) {
                transition.outMessageArguments.forEach((arg, idx, arr) => {
                  if (idx === arr.length - 1) {
                    if (arr.length === 1) {
                      sendArguments += (
                        "(" + arg.argValue + ")"
                      );
                    } else {
                      sendArguments += (
                        arg.argValue + ")"
                      );
                    }
                  } else if (idx === 0) {
                    sendArguments += (
                      "(" + arg.argValue + ", "
                    );
                  } else {
                    sendArguments += (
                      arg.argValue + ", "
                    );
                  }
                })
              }

              let nameComment = genTransitionNameComment(transition, "           ");
  
              finalString += ( 
                nameComment +
                "           send " + outMessageTrace + sendArguments + ((transition.targetPort) ? ("@" + transition.targetPort) : (outMessageIsAdv) ? "" : "@undefined") + "\n" +
                "           and transition " + toState           
              );
  
              if (toState) {
                if (transition.toStateArguments.length > 0) {
  
                  transition.toStateArguments.forEach((param, idx, arr) => {
                    if (idx === arr.length - 1) {
                      if (arr.length === 1) {
                        finalString += (
                          "(" + param.argValue + ")"
                        );
                      } else {
                        finalString += (
                          param.argValue + ")"
                        );
                      }
                      
                    } else if (idx === 0) {
                      finalString += (
                        "(" + param.argValue + ", "
                      );
                    } else {
                      finalString += (
                        param.argValue + ", "
                      );
                    } 
                  })
                }
              }
              finalString += ".\n        }" 
              
              if (idx === arr.length - 1) {
                finalString += " else { fail. }\n"
              }
            });
            finalString += "      }\n\n"
          
          } else if (singleTransitionGuard) { // Guard code for single transitions
              let transition = thisStateTransitionArray.find(transition => transition.inMessage === currentInMessage)
              // In Message Info
              let inMessage ="";
              let inMessageBasic = "";
              let inMessageComp = "";
              let inMessageBasicInstance = "";
              let inMessageTrace = "";
              if (subFuncMessages.find(element => element.id === currentInMessage)) {
                inMessage = subFuncMessages.find(element => element.id === currentInMessage);
                inMessageComp = inMessage.compInter;
                inMessageBasicInstance = inMessage.compInter.basicInterfaces.find(element => element.idOfBasic === inMessage.basicInter.id);
                let thisSubFunc = subfuncSelector.subfunctionalities.find(element => element.id === subFuncMessages.find(element => element.id === currentInMessage).subfuncId) || { "name" : "" };
                inMessageTrace = thisSubFunc.name + "." + inMessageBasicInstance.name + "." + inMessage.name;
              } else if (paramInterMessages.find(element => element.id === currentInMessage)) {
                inMessage = paramInterMessages.find(element => element.id === currentInMessage);
                inMessageComp = inMessage.compInter;
                inMessageBasicInstance = inMessage.compInter.basicInterfaces.find(element => element.idOfBasic === inMessage.basicInter.id);
                let thisParamInter = realFuncSelector.parameterInterfaces.find(element => element.id === paramInterMessages.find(element => element.id === currentInMessage).paramInterId) || { "name" : "" };
                inMessageTrace = thisParamInter.name + "." + inMessageBasicInstance.name + "." + inMessage.name;
              } else {
                inMessage = interSelector.messages.find(element => element.id === currentInMessage) || "";

                interSelector.basicInters.forEach((basic) => {
                  basic.messages.forEach((message) => {
                    if (message === inMessage.id) {
                      inMessageBasic = basic;
                    }
                  })
                });

              if (inMessageBasic.type === 'direct') {
                inMessageComp = interSelector.compInters.find(element => element.basicInterfaces.find(element => element.idOfBasic === inMessageBasic.id)) || "";
                inMessageBasicInstance = "";
                if (inMessageComp) {
                  inMessageBasicInstance = inMessageComp.basicInterfaces.find(element => element.idOfBasic === inMessageBasic.id) || "";
                }
    
                inMessageTrace = inMessageComp.name + "." + inMessageBasicInstance.name + "." + inMessage.name;
              } else {
                inMessageTrace = inMessageBasic.name + "." + inMessage.name;
              }
            }
    
    
              let receiveArguments = "";
              if (currentInMessage) {
                let parameters = [];
                if (subFuncMessages.find(element => element.id === currentInMessage)) {
                  parameters = subFuncMessages.find(element => element.id === currentInMessage).parameters;
                } else if (paramInterMessages.find(element => element.id === currentInMessage)) {
                  parameters = paramInterMessages.find(element => element.id === currentInMessage).parameters;
                } else if (interSelector.messages.find(element => element.id === currentInMessage)) {
                  parameters = interSelector.messages.find(element => element.id === currentInMessage).parameters;
                }
                parameters.forEach((param, idx, arr) => {
                  if (idx === arr.length - 1) {
                    if (arr.length === 1) {
                      receiveArguments += (
                        "(" + param.name + ")"
                      );
                    } else {
                      receiveArguments += (
                        param.name + ")"
                      );
                    }
                  } else if (idx === 0) {
                    receiveArguments += (
                      "(" + param.name + ", "
                    );
                  } else {
                    receiveArguments += (
                      param.name + ", "
                    );
                  }
                })
              }
              if (subFuncMessages.find(element => element.id === currentInMessage) || 
                  (paramInterMessages.find(element => element.id === currentInMessage))) {
                finalString +=  "        | " + inMessageTrace + receiveArguments + " => {\n"
              } else {
                finalString +=  "        | " + ((inMessage.port) ? (inMessage.port + "@") : (inMessageBasic.type === "adversarial") ? "" : "undefined@") + inMessageTrace + receiveArguments + " => {\n"
              }
              finalString += "        (* The below 'if else' branches represent Guards in the UCDSL *)\n"
                
              
              // Code for the transition
              let nameComment = genTransitionNameComment(transition, "         ");
              finalString += nameComment;
              finalString += (
                "          if (" + (transition.guard) +") { \n"
              );

              // Out Message Info
              let outMessage ="";
              let outMessageBasic = "";
              let outMessageComp = "";
              let outMessageBasicInstance = "";
              let outMessageTrace = "";
              let outMessageIsSubOrPara = false;
              if (subFuncMessages.find(element => element.id === transition.outMessage)) {
                outMessage = subFuncMessages.find(element => element.id === transition.outMessage);
                outMessageComp = outMessage.compInter;
                outMessageBasicInstance = outMessage.compInter.basicInterfaces.find(element => element.idOfBasic === outMessage.basicInter.id);
                let thisSubFunc = subfuncSelector.subfunctionalities.find(element => element.id === subFuncMessages.find(element => element.id === transition.outMessage).subfuncId) || { "name" : "" };
                outMessageTrace = thisSubFunc.name + "." + outMessageBasicInstance.name + "." + outMessage.name;
                outMessageIsSubOrPara = true;
              } else if (paramInterMessages.find(element => element.id === transition.outMessage)) {
                outMessage = paramInterMessages.find(element => element.id === transition.outMessage);
                outMessageComp = outMessage.compInter;
                outMessageBasicInstance = outMessage.compInter.basicInterfaces.find(element => element.idOfBasic === outMessage.basicInter.id);
                let thisParamInter = realFuncSelector.parameterInterfaces.find(element => element.id === paramInterMessages.find(element => element.id === transition.outMessage).paramInterId) || { "name" : "" };
                outMessageTrace = thisParamInter.name + "." + outMessageBasicInstance.name + "." + outMessage.name;
                outMessageIsSubOrPara = true;
              } else {
                outMessage = interSelector.messages.find(element => element.id === transition.outMessage) || "";
              
                outMessageBasic = "";
                interSelector.basicInters.forEach((basic) => {
                  basic.messages.forEach((message) => {
                    if (message === outMessage.id) {
                      outMessageBasic = basic;
                    }
                  })
                })
    
                if (outMessageBasic.type === 'direct') {
                  outMessageComp = interSelector.compInters.find(element => element.basicInterfaces.find(element => element.idOfBasic === outMessageBasic.id)) || "";
                  outMessageBasicInstance = "";
                  if (outMessageComp) {
                    outMessageBasicInstance = outMessageComp.basicInterfaces.find(element => element.idOfBasic === outMessageBasic.id) || "";
                  }
    
                  outMessageTrace = realFuncSelector.name + "." + outMessageComp.name + "." + outMessageBasicInstance.name + "." + outMessage.name;
                } else {
                  
                  outMessageTrace = outMessageBasic.name + "." + outMessage.name;
                }
              }

              let toState = "";
              if (stateMachineSelector.states.find(element => element.id === transition.toState)) {
                toState = stateMachineSelector.states.find(element => element.id === transition.toState).name
              }

              let sendArguments = "";
              if (transition.outMessage) {
                transition.outMessageArguments.forEach((arg, idx, arr) => {
                  if (idx === arr.length - 1) {
                    if (arr.length === 1) {
                      sendArguments += (
                        "(" + arg.argValue + ")"
                      );
                    } else {
                      sendArguments += (
                        arg.argValue + ")"
                      );
                    }
                  } else if (idx === 0) {
                    sendArguments += (
                      "(" + arg.argValue + ", "
                    );
                  } else {
                    sendArguments += (
                      arg.argValue + ", "
                    );
                  }
                })
              }


              finalString += ( 
                "             send " + outMessageTrace + sendArguments + ((transition.targetPort) ? ("@" + transition.targetPort) : (outMessageIsSubOrPara || outMessageBasic.type === "adversarial") ? "" : "@undefined") + "\n" +
                "             and transition " + toState           
              );

              if (toState) {
                if (transition.toStateArguments.length > 0) {

                  transition.toStateArguments.forEach((param, idx, arr) => {
                    if (idx === arr.length - 1) {
                      if (arr.length === 1) {
                        finalString += (
                          "(" + param.argValue + ")"
                        );
                      } else {
                        finalString += (
                          param.argValue + ")"
                        );
                      }
                      
                    } else if (idx === 0) {
                      finalString += (
                        "(" + param.argValue + ", "
                      );
                    } else {
                      finalString += (
                        param.argValue + ", "
                      );
                    } 
                  })
                }
              }
              finalString += ".\n" 
              finalString += (
                "          } else {\n"
              );
              finalString += (
                "             fail.\n          }\n"
              );
              finalString += "        }\n\n"
          } else {
            // Normal transition code
            let thisTransition = thisStateInMessageInfo[currentInMessage][0];
  
            // In Message Info
            let inMessage = interSelector.messages.find(element => element.id === currentInMessage) || "";
            let inMessageBasic = "";
            let inMessageIsAdv = false;
            interSelector.basicInters.forEach((basic) => {
              basic.messages.forEach((message) => {
                if (message === inMessage.id) {
                  inMessageBasic = basic;
                }
              })
            })
            if(inMessageBasic.type === "adversarial"){
              inMessageIsAdv = true;
            }
            let inMessageComp = interSelector.compInters.find(element => element.basicInterfaces.find(element => element.idOfBasic === inMessageBasic.id)) || "";
            let inMessageBasicInstance = "";
            if (inMessageComp) {
              inMessageBasicInstance = inMessageComp.basicInterfaces.find(element => element.idOfBasic === inMessageBasic.id) || "";  
            }  
            let inMessageTrace = ((inMessageComp.name) ? (inMessageComp.name + ".") : "") + ((inMessageComp.name) ? inMessageBasicInstance.name : inMessageBasic.name) + "." + inMessage.name;
  
            // Out Message Info
            let outMessageIsAdv = false;
            let outMessage = interSelector.messages.find(element => element.id === thisTransition.outMessage) || "";
            let outMessageBasic = "";
            interSelector.basicInters.forEach((basic) => {
              basic.messages.forEach((message) => {
                if (message === outMessage.id) {
                  outMessageBasic = basic;
                }
              })
            })
            if (outMessageBasic.type === "adversarial"){
              outMessageIsAdv = true;
            }
            let outMessageComp = interSelector.compInters.find(element => element.basicInterfaces.find(element => element.idOfBasic === outMessageBasic.id)) || "";
            let outMessageBasicInstance = "";
            if (outMessageComp) {
              outMessageBasicInstance = outMessageComp.basicInterfaces.find(element => element.idOfBasic === outMessageBasic.id) || "";
            }
  
            let outMessageTrace = ((outMessageComp.name) ? (outMessageComp.name + ".") : "") + ((outMessageComp.name) ? outMessageBasicInstance.name : outMessageBasic.name) + "." + outMessage.name;
  
            let toState = "";
            if (stateMachineSelector.states.find(element => element.id === thisTransition.toState)) {
              toState = stateMachineSelector.states.find(element => element.id === thisTransition.toState).name
            }
  
            let sendArguments = "";
            if (thisTransition.outMessage) {
              thisTransition.outMessageArguments.forEach((arg, idx, arr) => {
                if (idx === arr.length - 1) {
                  if (arr.length === 1) {
                    sendArguments += (
                      "(" + arg.argValue + ")"
                    );
                  } else {
                    sendArguments += (
                      arg.argValue + ")"
                    );
                  }
                } else if (idx === 0) {
                  sendArguments += (
                    "(" + arg.argValue + ", "
                  );
                } else {
                  sendArguments += (
                    arg.argValue + ", "
                  );
                }
              });
            }
  
            let receiveArguments = "";
            if (thisTransition.inMessage && interSelector.messages.find(element => element.id === thisTransition.inMessage)) {
              interSelector.messages.find(element => element.id === thisTransition.inMessage).parameters.forEach((param, idx, arr) => {
                if (idx === arr.length - 1) {
                  if (arr.length === 1) {
                    receiveArguments += (
                      "(" + param.name + ")"
                    );
                  } else {
                    receiveArguments += (
                      param.name + ")"
                    );
                  }
                } else if (idx === 0) {
                  receiveArguments += (
                    "(" + param.name + ", "
                  );
                } else {
                  receiveArguments += (
                    param.name + ", "
                  );
                }
              })
            }

            let nameComment = genTransitionNameComment(thisTransition, "          ");
  
            finalString += ( 
              "      | " + ((inMessage.port) ? (inMessage.port + "@") : (inMessageIsAdv) ? "" : "undefined@") + inMessageTrace + receiveArguments + " => {\n" +
              nameComment +
              "          send " + outMessageTrace + sendArguments + ((thisTransition.targetPort) ? ("@" + thisTransition.targetPort) : (outMessageIsAdv) ? "" : "@undefined") + "\n" +
              "          and transition " + toState           
            );
  
            if (toState) {
              if (thisTransition.toStateArguments.length > 0) {
  
                thisTransition.toStateArguments.forEach((param, idx, arr) => {
                  if (idx === arr.length - 1) {
                    if (arr.length === 1) {
                      finalString += (
                        "(" + param.argValue + ").\n" +
                        "      }\n" 
                      );
                    } else {
                      finalString += (
                        param.argValue + ").\n" +
                        "      }\n\n" 
                      );
                    }
                    
                  } else if (idx === 0) {
                    finalString += (
                      "(" + param.argValue + ", "
                    );
                  } else {
                    finalString += (
                      param.argValue + ", "
                    );
                  } 
                })
              } else {
                finalString += ".\n      }\n\n"
              }
            } 
          }
        });
  
        finalString += (
          "\n      | * => { fail. }\n" +
          "    end\n" +
          "  }\n\n"
          );
        }
      });
    } 

    finalString += "}\n\n";
    
    return finalString;
  }

  // generate the code for the Simulator
  const simulatorCodeConstructor = () => {
    let finalString = "";

    let basicAdv = (interSelector.basicInters[interSelector.basicInters.findIndex(inter => inter.id === simSelector.basicAdversarialInterface)]) || "";

    let paramInterCode = "";
    if (realFuncSelector.parameterInterfaces && realFuncSelector.parameterInterfaces.length > 0) {
      paramInterCode += "("
      realFuncSelector.parameterInterfaces.forEach((parameter, idx) => {
        let paramIdealFunc = {"idealFunctionality_name" : "undefined"};
        if (idealFuncApiData && parameter.modelName) {
          paramIdealFunc = idealFuncApiData.find(element => element.model_name === parameter.modelName);
        }
        paramInterCode += (parameter.modelName ? parameter.modelName : "undefined") + "." + (paramIdealFunc ? paramIdealFunc.idealFunctionality_name : "undefined");
        if (idx < realFuncSelector.parameterInterfaces.length - 1) {
          paramInterCode += ", "
        }
      });
      paramInterCode += ")";
    }

    finalString += (
      "(* Simulator *)\n" +
      "simulator " + simSelector.name + " uses " + basicAdv.name + " simulates " + (simSelector.realFunctionality ? realFuncSelector.name : "undefined") + paramInterCode + " {\n\n"
    );

    // add the initial state code
    let thisStateMachine = (stateMachineSelector.stateMachines[stateMachineSelector.stateMachines.findIndex(element => element.id === simSelector.stateMachine)]) || "";
    let initState = (stateMachineSelector.states[stateMachineSelector.states.findIndex(element => element.id === thisStateMachine.initState)]) || "";
    let thisStateMachineTransitionArray = stateMachineSelector.transitions.filter(element => thisStateMachine.transitions.includes(element.id));
    let thisInitStateTransitionArray = thisStateMachineTransitionArray.filter(element => element.fromState === initState.id);

    if('comment' in initState){
      if(initState.comment.length > 70){
        finalString += "  (* " +commentBreaker(initState.comment, 70, 2) + "\n   *)\n"
      }
      else if(initState.comment.length >0){
        finalString += "  (* " +initState.comment + " *)\n"
      }
    }

    finalString += (
      "  initial state " + initState.name + " {\n" +
      "    match message with\n"
    );

    let thisInitStateInMessageArray = [];
    let thisInitStateInMessageInfo = {};

    // Initial State Machine code
    if (thisStateMachine) {
      thisInitStateTransitionArray.forEach(transition => {
        if (thisInitStateInMessageInfo[transition.inMessage]) {
          thisInitStateInMessageInfo[transition.inMessage].push(transition);
        } else {
          thisInitStateInMessageArray.push(transition.inMessage);
          thisInitStateInMessageInfo[transition.inMessage] = [transition];
        }
      });

      thisInitStateInMessageArray.forEach(currentInMessage => {
        // Determine if single transition guard code is needed
        // For this message, determine if any transitions include guard code
        let singleTransitionGuard = false;
        thisInitStateTransitionArray.forEach(transition => {
          if (transition.inMessage === currentInMessage && transition.guard !== "") {
            singleTransitionGuard = true;
          }
        });
        // Guard Code
        if (thisInitStateInMessageInfo[currentInMessage].length > 1) {
          // In Message Info
          let inMessage ="";
          let inMessageBasic = "";
          let inMessageComp = "";
          let inMessageBasicInstance = "";
          let inMessageTrace = "";
          if (subFuncMessages.find(element => element.id === currentInMessage)) {
            inMessage = subFuncMessages.find(element => element.id === currentInMessage);
            let thisSubFunc = subfuncSelector.subfunctionalities.find(element => element.id === subFuncMessages.find(element => element.id === currentInMessage).subfuncId) || { "name" : "" };
            inMessageTrace = thisSubFunc.name + "." + inMessage.basicInter.name + "." + inMessage.name;
          } else if (paramInterMessages.find(element => element.id === currentInMessage)) {
            inMessage = paramInterMessages.find(element => element.id === currentInMessage);
            let thisParamInter = realFuncSelector.parameterInterfaces.find(element => element.id === paramInterMessages.find(element => element.id === currentInMessage).paramInterId) || { "name" : "" };
            inMessageTrace = thisParamInter.name + "." + inMessage.basicInter.name + "." + inMessage.name;
          } else {
            inMessage = interSelector.messages.find(element => element.id === currentInMessage) || "";

            inMessageBasic = "";
            interSelector.basicInters.forEach((basic) => {
              basic.messages.forEach((message) => {
                if (message === inMessage.id) {
                  inMessageBasic = basic;
                }
              })
            })

            if (inMessageBasic.type === 'direct') {
              inMessageComp = interSelector.compInters.find(element => element.basicInterfaces.find(element => element.idOfBasic === inMessageBasic.id)) || "";
              inMessageBasicInstance = "";
              if (inMessageComp) {
                inMessageBasicInstance = inMessageComp.basicInterfaces.find(element => element.idOfBasic === inMessageBasic.id) || "";
              }
              inMessageTrace = realFuncSelector.name + "." + inMessageComp.name + "." + inMessageBasicInstance.name + "." + inMessage.name;
            } else {
              inMessageTrace = inMessageBasic.name + "." + inMessage.name;
            }
            
          }       

          let receiveArguments = "";
          if (currentInMessage) {
            let parameters = [];
            if (subFuncMessages.find(element => element.id === currentInMessage)) {
              parameters = subFuncMessages.find(element => element.id === currentInMessage).parameters;
            } else if (paramInterMessages.find(element => element.id === currentInMessage)) {
              parameters = paramInterMessages.find(element => element.id === currentInMessage).parameters;
            } else if (interSelector.messages.find(element => element.id === currentInMessage)) {
              parameters = interSelector.messages.find(element => element.id === currentInMessage).parameters;
            }
            parameters.forEach((param, idx, arr) => {
              if (idx === arr.length - 1) {
                if (arr.length === 1) {
                  receiveArguments += (
                    "(" + param.name + ")"
                  );
                } else {
                  receiveArguments += (
                    param.name + ")"
                  );
                }
              } else if (idx === 0) {
                receiveArguments += (
                  "(" + param.name + ", "
                );
              } else {
                receiveArguments += (
                  param.name + ", "
                );
              }
            })
          }

          finalString +=  "      | " + ((inMessage.port) ? (inMessage.port + "@") : "") + inMessageTrace + receiveArguments + " => {\n"
          
          finalString += (
            "        (* The below 'if else' branches represent Guards in the UCDSL\n" + 
            "         * Guards are used to differentiate transitions that may have\n" +
            "         * identical 'from' states and 'in' messages *)\n"
          )
          // Code for each transition
          thisInitStateInMessageInfo[currentInMessage].forEach((transition, idx, arr) => {
            if (idx === 0) {
              finalString += (
                "        if (" + (transition.guard) +") { \n"
              );
            } else {
              finalString += (
                " elif (" + (transition.guard) + ") { \n"
              )
            }

            // Out Message Info
            let outMessage = "";
            let outMessageBasic = "";
            let outMessageComp = "";
            let outMessageBasicInstance = "";
            let outMessageTrace = "";
            if (subFuncMessages.find(element => element.id === transition.outMessage)) {
              outMessage = subFuncMessages.find(element => element.id === transition.outMessage);
              let thisSubFunc = subfuncSelector.subfunctionalities.find(element => element.id === subFuncMessages.find(element => element.id === transition.outMessage).subfuncId) || { "name" : "" };
              outMessageTrace = thisSubFunc.name + "." + outMessage.basicInter.name + "." + outMessage.name;
            } else if (paramInterMessages.find(element => element.id === transition.outMessage)) {
              outMessage = paramInterMessages.find(element => element.id === transition.outMessage);
              let thisParamInter = realFuncSelector.parameterInterfaces.find(element => element.id === paramInterMessages.find(element => element.id === transition.outMessage).paramInterId) || { "name" : "" };
              outMessageTrace = thisParamInter.name + "." + outMessage.basicInter.name + "." + outMessage.name;
            } else {
              outMessage = interSelector.messages.find(element => element.id === transition.outMessage) || "";
            
              outMessageBasic = "";
              interSelector.basicInters.forEach((basic) => {
                basic.messages.forEach((message) => {
                  if (message === outMessage.id) {
                    outMessageBasic = basic;
                  }
                })
              })
  
              if (outMessageBasic.type === 'direct') {
                outMessageComp = interSelector.compInters.find(element => element.basicInterfaces.find(element => element.idOfBasic === outMessageBasic.id)) || "";
                outMessageBasicInstance = "";
                if (outMessageComp) {
                  outMessageBasicInstance = outMessageComp.basicInterfaces.find(element => element.idOfBasic === outMessageBasic.id) || "";
                }
  
                outMessageTrace = realFuncSelector.name + "." + outMessageComp.name + "." + outMessageBasicInstance.name + "." + outMessage.name;
              } else {
                outMessageTrace = outMessageBasic.name + "." + outMessage.name;
              }     
            }       

            let toState = "";
            if (stateMachineSelector.states.find(element => element.id === transition.toState)) {
              toState = stateMachineSelector.states.find(element => element.id === transition.toState).name
            }

            let sendArguments = "";
            if (transition.outMessage) {
              transition.outMessageArguments.forEach((arg, idx, arr) => {
                if (idx === arr.length - 1) {
                  if (arr.length === 1) {
                    sendArguments += (
                      "(" + arg.argValue + ")"
                    );
                  } else {
                    sendArguments += (
                      arg.argValue + ")"
                    );
                  }
                } else if (idx === 0) {
                  sendArguments += (
                    "(" + arg.argValue + ", "
                  );
                } else {
                  sendArguments += (
                    arg.argValue + ", "
                  );
                }
              })
            }

            let nameComment = genTransitionNameComment(transition, "           ");

            finalString += ( 
              nameComment +
              "           send " + outMessageTrace + sendArguments + ((transition.targetPort) ? ("@" + transition.targetPort) : "") + "\n" +
              "           and transition " + toState           
            );

            if (toState) {
              if (transition.toStateArguments.length > 0) {

                transition.toStateArguments.forEach((param, idx, arr) => {
                  if (idx === arr.length - 1) {
                    if (arr.length === 1) {
                      finalString += (
                        "(" + param.argValue + ")"
                      );
                    } else {
                      finalString += (
                        param.argValue + ")"
                      );
                    }
                    
                  } else if (idx === 0) {
                    finalString += (
                      "(" + param.argValue + ", "
                    );
                  } else {
                    finalString += (
                      param.argValue + ", "
                    );
                  } 
                })
              }
            }
            finalString += ".\n        }" 
            
            if (idx === arr.length - 1) {
              finalString += " else { fail. }\n"
            }
          });
          finalString += "      }\n\n"
        } else if (singleTransitionGuard) { // Guard code for single transitions
          let transition = thisInitStateTransitionArray.find(transition => transition.inMessage === currentInMessage)
          // In Message Info
          let inMessage ="";
          let inMessageBasic = "";
          let inMessageComp = "";
          let inMessageBasicInstance = "";
          let inMessageTrace = "";
          if (subFuncMessages.find(element => element.id === currentInMessage)) {
            inMessage = subFuncMessages.find(element => element.id === currentInMessage);
            inMessageComp = inMessage.compInter;
            inMessageBasicInstance = inMessage.compInter.basicInterfaces.find(element => element.idOfBasic === inMessage.basicInter.id);
            let thisSubFunc = subfuncSelector.subfunctionalities.find(element => element.id === subFuncMessages.find(element => element.id === currentInMessage).subfuncId) || { "name" : "" };
            if(inMessageBasicInstance){      
              inMessageTrace = thisSubFunc.name + "." + inMessageBasicInstance.name + "." + inMessage.name;
            }else{
              inMessageBasicInstance = inMessage.basicInter;
              inMessageTrace = thisSubFunc.name + "." + inMessageBasicInstance.name + "." + inMessage.name;
            }
          } else if (paramInterMessages.find(element => element.id === currentInMessage)) {
            inMessage = paramInterMessages.find(element => element.id === currentInMessage);
            inMessageComp = inMessage.compInter;
            inMessageBasicInstance = inMessage.compInter.basicInterfaces.find(element => element.idOfBasic === inMessage.basicInter.id);
            let thisParamInter = realFuncSelector.parameterInterfaces.find(element => element.id === paramInterMessages.find(element => element.id === currentInMessage).paramInterId) || { "name" : "" };
            inMessageTrace = thisParamInter.name + "." + inMessageBasicInstance.name + "." + inMessage.name;
          } else {
            inMessage = interSelector.messages.find(element => element.id === currentInMessage) || "";

            interSelector.basicInters.forEach((basic) => {
              basic.messages.forEach((message) => {
                if (message === inMessage.id) {
                  inMessageBasic = basic;
                }
              })
            });

            inMessageComp = interSelector.compInters.find(element => element.basicInterfaces.find(element => element.idOfBasic === inMessageBasic.id)) || "";
            if (inMessageComp) {
              inMessageBasicInstance = inMessageComp.basicInterfaces.find(element => element.idOfBasic === inMessageBasic.id) || "";  
            }  
            inMessageTrace = inMessageComp.name + "." + inMessageBasicInstance.name + "." + inMessage.name;
          }


          let receiveArguments = "";
          if (currentInMessage) {
            let parameters = [];
            if (subFuncMessages.find(element => element.id === currentInMessage)) {
              parameters = subFuncMessages.find(element => element.id === currentInMessage).parameters;
            } else if (paramInterMessages.find(element => element.id === currentInMessage)) {
              parameters = paramInterMessages.find(element => element.id === currentInMessage).parameters;
            } else if (interSelector.messages.find(element => element.id === currentInMessage)) {
              parameters = interSelector.messages.find(element => element.id === currentInMessage).parameters;
            }
            parameters.forEach((param, idx, arr) => {
              if (idx === arr.length - 1) {
                if (arr.length === 1) {
                  receiveArguments += (
                    "(" + param.name + ")"
                  );
                } else {
                  receiveArguments += (
                    param.name + ")"
                  );
                }
              } else if (idx === 0) {
                receiveArguments += (
                  "(" + param.name + ", "
                );
              } else {
                receiveArguments += (
                  param.name + ", "
                );
              }
            })
          }
          if (subFuncMessages.find(element => element.id === currentInMessage) || 
              (paramInterMessages.find(element => element.id === currentInMessage))) {
            finalString +=  "        | " + inMessageTrace + receiveArguments + " => {\n"
          } else {
            finalString +=  "        | " + ((inMessage.port) ? (inMessage.port + "@") : "") + inMessageTrace + receiveArguments + " => {\n"
          }
          finalString += "        (* The below 'if else' branches represent Guards in the UCDSL *)\n"
            
          
          // Code for the transition
          let nameComment = genTransitionNameComment(transition, "         ");
          finalString += nameComment;
          finalString += (
            "          if (" + (transition.guard) +") { \n"
          );

          // Out Message Info
          let outMessage ="";
          let outMessageBasic = "";
          let outMessageComp = "";
          let outMessageBasicInstance = "";
          let outMessageTrace = "";
          if (subFuncMessages.find(element => element.id === transition.outMessage)) {
            outMessage = subFuncMessages.find(element => element.id === transition.outMessage);
            outMessageComp = outMessage.compInter;
            outMessageBasicInstance = outMessage.compInter.basicInterfaces.find(element => element.idOfBasic === outMessage.basicInter.id);
            let thisSubFunc = subfuncSelector.subfunctionalities.find(element => element.id === subFuncMessages.find(element => element.id === transition.outMessage).subfuncId) || { "name" : "" };
            if(outMessageBasicInstance){      
                outMessageTrace = thisSubFunc.name + "." + outMessageBasicInstance.name + "." + outMessage.name;
              }else{
                outMessageBasicInstance = outMessage.basicInter;
                outMessageTrace = thisSubFunc.name + "." + outMessageBasicInstance.name + "." + outMessage.name;
              }   
          } else if (paramInterMessages.find(element => element.id === transition.outMessage)) {
            outMessage = paramInterMessages.find(element => element.id === transition.outMessage);
            outMessageComp = outMessage.compInter;
            outMessageBasicInstance = outMessage.compInter.basicInterfaces.find(element => element.idOfBasic === outMessage.basicInter.id);
            let thisParamInter = realFuncSelector.parameterInterfaces.find(element => element.id === paramInterMessages.find(element => element.id === transition.outMessage).paramInterId) || { "name" : "" };
            outMessageTrace = thisParamInter.name + "." + outMessageBasicInstance.name + "." + outMessage.name;
          } else {
            outMessage = interSelector.messages.find(element => element.id === transition.outMessage) || "";
          
            outMessageBasic = "";
            interSelector.basicInters.forEach((basic) => {
              basic.messages.forEach((message) => {
                if (message === outMessage.id) {
                  outMessageBasic = basic;
                }
              })
            })

            outMessageComp = interSelector.compInters.find(element => element.basicInterfaces.find(element => element.idOfBasic === outMessageBasic.id)) || "";
            outMessageBasicInstance = "";
            if (outMessageComp) {
              outMessageBasicInstance = outMessageComp.basicInterfaces.find(element => element.idOfBasic === outMessageBasic.id) || "";
              outMessageTrace = outMessageComp.name + "." + outMessageBasicInstance.name + "." + outMessage.name;
            }else{
              outMessageBasicInstance = interSelector.basicInters.find(element => element.id === outMessageBasic.id) || "";
              outMessageTrace = outMessageBasicInstance.name + "." + outMessage.name;
            }
            

            
          }

          let toState = "";
          if (stateMachineSelector.states.find(element => element.id === transition.toState)) {
            toState = stateMachineSelector.states.find(element => element.id === transition.toState).name
          }

          let sendArguments = "";
          if (transition.outMessage) {
            transition.outMessageArguments.forEach((arg, idx, arr) => {
              if (idx === arr.length - 1) {
                if (arr.length === 1) {
                  sendArguments += (
                    "(" + arg.argValue + ")"
                  );
                } else {
                  sendArguments += (
                    arg.argValue + ")"
                  );
                }
              } else if (idx === 0) {
                sendArguments += (
                  "(" + arg.argValue + ", "
                );
              } else {
                sendArguments += (
                  arg.argValue + ", "
                );
              }
            })
          }
          finalString += ( 
            "             send " + outMessageTrace + sendArguments + ((transition.targetPort) ? ("@" + transition.targetPort) : "") + "\n" +
            "             and transition " + toState           
          );

          if (toState) {
            if (transition.toStateArguments.length > 0) {

              transition.toStateArguments.forEach((param, idx, arr) => {
                if (idx === arr.length - 1) {
                  if (arr.length === 1) {
                    finalString += (
                      "(" + param.argValue + ")"
                    );
                  } else {
                    finalString += (
                      param.argValue + ")"
                    );
                  }
                  
                } else if (idx === 0) {
                  finalString += (
                    "(" + param.argValue + ", "
                  );
                } else {
                  finalString += (
                    param.argValue + ", "
                  );
                } 
              })
            }
          }
          finalString += ".\n" 
          finalString += (
            "          } else {\n"
          );
          finalString += (
            "             fail.\n          }\n"
          );
          finalString += "        }\n\n"
        } else {
          // Normal transition code
          let thisTransition = thisInitStateInMessageInfo[currentInMessage][0];

          // In Message Info
          let inMessage ="";
          let inMessageBasic = "";
          let inMessageComp = "";
          let inMessageBasicInstance = "";
          let inMessageTrace = "";
          if (subFuncMessages.find(element => element.id === thisTransition.inMessage)) {
            inMessage = subFuncMessages.find(element => element.id === thisTransition.inMessage);
            let thisSubFunc = subfuncSelector.subfunctionalities.find(element => element.id === subFuncMessages.find(element => element.id === thisTransition.inMessage).subfuncId) || { "name" : "" };
            inMessageTrace = thisSubFunc.name + "." + inMessage.basicInter.name + "." + inMessage.name;
          } else if (paramInterMessages.find(element => element.id === thisTransition.inMessage)) {
            inMessage = paramInterMessages.find(element => element.id === thisTransition.inMessage);
            let thisParamInter = realFuncSelector.parameterInterfaces.find(element => element.id === paramInterMessages.find(element => element.id === thisTransition.inMessage).paramInterId) || { "name" : "" };
            inMessageTrace = thisParamInter.name + "." + inMessage.basicInter.name + "." + inMessage.name;
          } else {
            inMessage = interSelector.messages.find(element => element.id === thisTransition.inMessage) || "";

            inMessageBasic = "";
            interSelector.basicInters.forEach((basic) => {
              basic.messages.forEach((message) => {
                if (message === inMessage.id) {
                  inMessageBasic = basic;
                }
              })
            })

            if (inMessageBasic.type === 'direct') {
              inMessageComp = interSelector.compInters.find(element => element.basicInterfaces.find(element => element.idOfBasic === inMessageBasic.id)) || "";
              inMessageBasicInstance = "";
              if (inMessageComp) {
                inMessageBasicInstance = inMessageComp.basicInterfaces.find(element => element.idOfBasic === inMessageBasic.id) || "";
              }

              inMessageTrace = realFuncSelector.name + "." + inMessageComp.name + "." + inMessageBasicInstance.name + "." + inMessage.name;
            } else {
              inMessageTrace = inMessageBasic.name + "." + inMessage.name;
            }
            
          }

          // Out Message Info
          let outMessage ="";
          let outMessageBasic = "";
          let outMessageComp = "";
          let outMessageBasicInstance = "";
          let outMessageTrace = "";
          if (subFuncMessages.find(element => element.id === thisTransition.outMessage)) {
            outMessage = subFuncMessages.find(element => element.id === thisTransition.outMessage);
            let thisSubFunc = subfuncSelector.subfunctionalities.find(element => element.id === subFuncMessages.find(element => element.id === thisTransition.outMessage).subfuncId) || { "name" : "" };
            outMessageTrace = thisSubFunc.name + "." + outMessage.basicInter.name + "." + outMessage.name;
          } else if (paramInterMessages.find(element => element.id === thisTransition.outMessage)) {
            outMessage = paramInterMessages.find(element => element.id === thisTransition.outMessage);
            let thisParamInter = realFuncSelector.parameterInterfaces.find(element => element.id === paramInterMessages.find(element => element.id === thisTransition.outMessage).paramInterId) || { "name" : "" };
            outMessageTrace = thisParamInter.name + "." + outMessage.basicInter.name + "." + outMessage.name;
          } else {
            outMessage = interSelector.messages.find(element => element.id === thisTransition.outMessage) || "";
          
            outMessageBasic = "";
            interSelector.basicInters.forEach((basic) => {
              basic.messages.forEach((message) => {
                if (message === outMessage.id) {
                  outMessageBasic = basic;
                }
              })
            })

            if (outMessageBasic.type === 'direct') {
              outMessageComp = interSelector.compInters.find(element => element.basicInterfaces.find(element => element.idOfBasic === outMessageBasic.id)) || "";
              outMessageBasicInstance = "";
              if (outMessageComp) {
                outMessageBasicInstance = outMessageComp.basicInterfaces.find(element => element.idOfBasic === outMessageBasic.id) || "";
              }

              outMessageTrace = realFuncSelector.name + "." + outMessageComp.name + "." + outMessageBasicInstance.name + "." + outMessage.name;
            } else {
              outMessageTrace = outMessageBasic.name + "." + outMessage.name;
            }
          }

          let toState = "";
          if (stateMachineSelector.states.find(element => element.id === thisTransition.toState)) {
            toState = stateMachineSelector.states.find(element => element.id === thisTransition.toState).name
          }

          let sendArguments = "";
          if (thisTransition.outMessage) {
            thisTransition.outMessageArguments.forEach((arg, idx, arr) => {
              if (idx === arr.length - 1) {
                if (arr.length === 1) {
                  sendArguments += (
                    "(" + arg.argValue + ")"
                  );
                } else {
                  sendArguments += (
                    arg.argValue + ")"
                  );
                }
              } else if (idx === 0) {
                sendArguments += (
                  "(" + arg.argValue + ", "
                );
              } else {
                sendArguments += (
                  arg.argValue + ", "
                );
              }
            })
          }

          let receiveArguments = "";
          if (thisTransition.inMessage && interSelector.messages.find(element => element.id === thisTransition.inMessage)) {
            let parameters = [];
            if (subFuncMessages.find(element => element.id === thisTransition.inMessage)) {
              parameters = subFuncMessages.find(element => element.id === thisTransition.inMessage).parameters;
            } else if (paramInterMessages.find(element => element.id === thisTransition.inMessage)) {
              parameters = paramInterMessages.find(element => element.id === thisTransition.inMessage).parameters;
            } else if (interSelector.messages.find(element => element.id === thisTransition.inMessage)) {
              parameters = interSelector.messages.find(element => element.id === thisTransition.inMessage).parameters;
            }
            parameters.forEach((param, idx, arr) => {
              if (idx === arr.length - 1) {
                if (arr.length === 1) {
                  receiveArguments += (
                    "(" + param.name + ")"
                  );
                } else {
                  receiveArguments += (
                    param.name + ")"
                  );
                }
              } else if (idx === 0) {
                receiveArguments += (
                  "(" + param.name + ", "
                );
              } else {
                receiveArguments += (
                  param.name + ", "
                );
              }
            })
          }

          let nameComment = genTransitionNameComment(thisTransition, "          ");

          finalString += ( 
            "      | " + ((inMessage.port) ? (inMessage.port + "@") : "") + inMessageTrace + receiveArguments + " => {\n" +
            nameComment +
            "          send " + outMessageTrace + sendArguments + ((thisTransition.targetPort) ? ("@" + thisTransition.targetPort) : "") + "\n" +
            "          and transition " + toState           
          );

          if (toState) {
            if (thisTransition.toStateArguments.length > 0) {

              thisTransition.toStateArguments.forEach((param, idx, arr) => {
                if (idx === arr.length - 1) {
                  if (arr.length === 1) {
                    finalString += (
                      "(" + param.argValue + ").\n" +
                      "      }\n" 
                    );
                  } else {
                    finalString += (
                      param.argValue + ").\n" +
                      "      }\n\n" 
                    );
                  }
                  
                } else if (idx === 0) {
                  finalString += (
                    "(" + param.argValue + ", "
                  );
                } else {
                  finalString += (
                    param.argValue + ", "
                  );
                } 
              })
            } else {
              finalString += ".\n      }\n\n"
            }
          } 
        }
      });

      finalString += (
        "\n      | * => { fail. }\n" +
        "    end\n" +
        "  }\n\n"
        );
    }

    // add the other states' code
    if (thisStateMachine) {
      thisStateMachine.states.filter(element => element !== thisStateMachine.initState).forEach(state => { // for each state that is not the initState
        let thisState = stateMachineSelector.states.find(element => element.id === state);
        let thisStateTransitionArray = thisStateMachineTransitionArray.filter(element => element.fromState === thisState.id);
        let thisStateInMessageArray = [];
        let thisStateInMessageInfo = {};

        if('comment' in thisState){
          if(thisState.comment.length > 70){
            finalString += "  (* " +commentBreaker(thisState.comment, 70, 2) + "\n   *)\n"
          }
          else if(thisState.comment.length >0){
            finalString += "  (* " +thisState.comment + " *)\n"
          }
        }
        finalString += (
          "  state " + thisState.name 
        );
          
        thisState.parameters.forEach((param, idx, arr) => {
          if (idx === arr.length - 1) {
            if (arr.length === 1) {
              finalString += (
                "(" + param.name + " : " + param.type + ")"
              );
            } else {
              finalString += (
                param.name + " : " + param.type + ")"
              );
            }  
          } else if (idx === 0) {
            finalString += (
              "(" + param.name + " : " + param.type + ", "
            );
          } else {
            finalString += (
              param.name + " : " + param.type + ", "
            );
          }
        });

        finalString += (
          " {\n" +
          "    match message with\n"
        );

        thisStateTransitionArray.forEach(transition => {
          if (thisStateInMessageInfo[transition.inMessage]) {
            thisStateInMessageInfo[transition.inMessage].push(transition);
          } else {
            thisStateInMessageArray.push(transition.inMessage);
            thisStateInMessageInfo[transition.inMessage] = [transition];
          }
        });
        
        thisStateInMessageArray.forEach(currentInMessage => {
          // Determine if single transition guard code is needed
          // For this message, determine if any transitions include guard code
          let singleTransitionGuard = false;
          thisStateTransitionArray.forEach(transition => {
            if (transition.inMessage === currentInMessage && transition.guard !== "") {
              singleTransitionGuard = true;
            }
          });
          // Guard Code
          if (thisStateInMessageInfo[currentInMessage].length > 1) {
            // In Message Info
            let inMessage ="";
            let inMessageBasic = "";
            let inMessageComp = "";
            let inMessageBasicInstance = "";
            let inMessageTrace = "";
            if (subFuncMessages.find(element => element.id === currentInMessage)) {
              inMessage = subFuncMessages.find(element => element.id === currentInMessage);
              let thisSubFunc = subfuncSelector.subfunctionalities.find(element => element.id === subFuncMessages.find(element => element.id === currentInMessage).subfuncId) || { "name" : "" };
              inMessageTrace = thisSubFunc.name + "." + inMessage.basicInter.name + "." + inMessage.name;
            } else if (paramInterMessages.find(element => element.id === currentInMessage)) {
              inMessage = paramInterMessages.find(element => element.id === currentInMessage);
              let thisParamInter = realFuncSelector.parameterInterfaces.find(element => element.id === paramInterMessages.find(element => element.id === currentInMessage).paramInterId) || { "name" : "" };
              inMessageTrace = thisParamInter.name + "." + inMessage.basicInter.name + "." + inMessage.name;
            } else {
              inMessage = interSelector.messages.find(element => element.id === currentInMessage) || "";
  
              inMessageBasic = "";
              interSelector.basicInters.forEach((basic) => {
                basic.messages.forEach((message) => {
                  if (message === inMessage.id) {
                    inMessageBasic = basic;
                  }
                })
              })
  
              if (inMessageBasic.type === 'direct') {
                inMessageComp = interSelector.compInters.find(element => element.basicInterfaces.find(element => element.idOfBasic === inMessageBasic.id)) || "";
                inMessageBasicInstance = "";
                if (inMessageComp) {
                  inMessageBasicInstance = inMessageComp.basicInterfaces.find(element => element.idOfBasic === inMessageBasic.id) || "";
                }
  
                inMessageTrace = realFuncSelector.name + "." + inMessageComp.name + "." + inMessageBasicInstance.name + "." + inMessage.name;
              } else {
                inMessageTrace = inMessageBasic.name + "." + inMessage.name;
              }
              
            }
  
            let receiveArguments = "";
            if (currentInMessage) {
              let parameters = [];
              if (subFuncMessages.find(element => element.id === currentInMessage)) {
                parameters = subFuncMessages.find(element => element.id === currentInMessage).parameters;
              } else if (paramInterMessages.find(element => element.id === currentInMessage)) {
                parameters = paramInterMessages.find(element => element.id === currentInMessage).parameters;
              } else if (interSelector.messages.find(element => element.id === currentInMessage)) {
                parameters = interSelector.messages.find(element => element.id === currentInMessage).parameters;
              }
              parameters.forEach((param, idx, arr) => {
                if (idx === arr.length - 1) {
                  if (arr.length === 1) {
                    receiveArguments += (
                      "(" + param.name + ")"
                    );
                  } else {
                    receiveArguments += (
                      param.name + ")"
                    );
                  }
                } else if (idx === 0) {
                  receiveArguments += (
                    "(" + param.name + ", "
                  );
                } else {
                  receiveArguments += (
                    param.name + ", "
                  );
                }
              })
            }
  
            finalString +=  "      | " + ((inMessage.port) ? (inMessage.port + "@") : "") + inMessageTrace + receiveArguments + " => {\n"
            
            finalString += (
              "        (* The below 'if else' branches represent Guards in the UCDSL\n" + 
              "         * Guards are used to differentiate transitions that may have\n" +
              "         * identical 'from' states and 'in' messages *)\n"
            )
            // Code for each transition
            thisStateInMessageInfo[currentInMessage].forEach((transition, idx, arr) => {
              if (idx === 0) {
                finalString += (
                  "        if (" + (transition.guard) +") { \n"
                );
              } else {
                finalString += (
                  " elif (" + (transition.guard) + ") { \n"
                )
              }
  
              // Out Message Info
              let outMessage ="";
              let outMessageBasic = "";
              let outMessageComp = "";
              let outMessageBasicInstance = "";
              let outMessageTrace = "";
              if (subFuncMessages.find(element => element.id === transition.outMessage)) {
                outMessage = subFuncMessages.find(element => element.id === transition.outMessage);
                let thisSubFunc = subfuncSelector.subfunctionalities.find(element => element.id === subFuncMessages.find(element => element.id === transition.outMessage).subfuncId) || { "name" : "" };
                outMessageTrace = thisSubFunc.name + "." + outMessage.basicInter.name + "." + outMessage.name;
              } else if (paramInterMessages.find(element => element.id === transition.outMessage)) {
                outMessage = paramInterMessages.find(element => element.id === transition.outMessage);
                let thisParamInter = realFuncSelector.parameterInterfaces.find(element => element.id === paramInterMessages.find(element => element.id === transition.outMessage).paramInterId) || { "name" : "" };
                outMessageTrace = thisParamInter.name + "." + outMessage.basicInter.name + "." + outMessage.name;
              } else {
                outMessage = interSelector.messages.find(element => element.id === transition.outMessage) || "";
              
                outMessageBasic = "";
                interSelector.basicInters.forEach((basic) => {
                  basic.messages.forEach((message) => {
                    if (message === outMessage.id) {
                      outMessageBasic = basic;
                    }
                  })
                })
    
                if (outMessageBasic.type === 'direct') {
                  outMessageComp = interSelector.compInters.find(element => element.basicInterfaces.find(element => element.idOfBasic === outMessageBasic.id)) || "";
                  outMessageBasicInstance = "";
                  if (outMessageComp) {
                    outMessageBasicInstance = outMessageComp.basicInterfaces.find(element => element.idOfBasic === outMessageBasic.id) || "";
                  }
    
                  outMessageTrace = realFuncSelector.name + "." + outMessageComp.name + "." + outMessageBasicInstance.name + "." + outMessage.name;
                } else {
                  outMessageTrace = outMessageBasic.name + "." + outMessage.name;
                }
              }
              
              let toState = "";
              if (stateMachineSelector.states.find(element => element.id === transition.toState)) {
                toState = stateMachineSelector.states.find(element => element.id === transition.toState).name
              }
  
              let sendArguments = "";
              if (transition.outMessage) {
                transition.outMessageArguments.forEach((arg, idx, arr) => {
                  if (idx === arr.length - 1) {
                    if (arr.length === 1) {
                      sendArguments += (
                        "(" + arg.argValue + ")"
                      );
                    } else {
                      sendArguments += (
                        arg.argValue + ")"
                      );
                    }
                  } else if (idx === 0) {
                    sendArguments += (
                      "(" + arg.argValue + ", "
                    );
                  } else {
                    sendArguments += (
                      arg.argValue + ", "
                    );
                  }
                })
              }

              let nameComment = genTransitionNameComment(transition, "           ");
  
              finalString += ( 
                nameComment +
                "           send " + outMessageTrace + sendArguments + ((transition.targetPort) ? ("@" + transition.targetPort) : "") + "\n" +
                "           and transition " + toState           
              );
  
              if (toState) {
                if (transition.toStateArguments.length > 0) {
  
                  transition.toStateArguments.forEach((param, idx, arr) => {
                    if (idx === arr.length - 1) {
                      if (arr.length === 1) {
                        finalString += (
                          "(" + param.argValue + ")"
                        );
                      } else {
                        finalString += (
                          param.argValue + ")" 
                        );
                      }
                      
                    } else if (idx === 0) {
                      finalString += (
                        "(" + param.argValue + ", "
                      );
                    } else {
                      finalString += (
                        param.argValue + ", "
                      );
                    } 
                  })
                }
              }
              finalString += ".\n        }" 
              
              if (idx === arr.length - 1) {
                finalString += " else { fail. }\n"
              }
            });
            finalString += "      }\n\n"
  
          } else if (singleTransitionGuard) { // Guard code for single transitions
            let transition = thisStateTransitionArray.find(transition => transition.inMessage === currentInMessage)
            // In Message Info
            let inMessage ="";
            let inMessageBasic = "";
            let inMessageComp = "";
            let inMessageBasicInstance = "";
            let inMessageTrace = "";
            if (subFuncMessages.find(element => element.id === currentInMessage)) {
              inMessage = subFuncMessages.find(element => element.id === currentInMessage);
              inMessageComp = inMessage.compInter;
              inMessageBasicInstance = inMessage.compInter.basicInterfaces.find(element => element.idOfBasic === inMessage.basicInter.id);
              let thisSubFunc = subfuncSelector.subfunctionalities.find(element => element.id === subFuncMessages.find(element => element.id === currentInMessage).subfuncId) || { "name" : "" };
              if(inMessageBasicInstance){      
                inMessageTrace = thisSubFunc.name + "." + inMessageBasicInstance.name + "." + inMessage.name;
              }else{
                inMessageBasicInstance = inMessage.basicInter;
                inMessageTrace = thisSubFunc.name + "." + inMessageBasicInstance.name + "." + inMessage.name;
              }
              
            } else if (paramInterMessages.find(element => element.id === currentInMessage)) {
              inMessage = paramInterMessages.find(element => element.id === currentInMessage);
              inMessageComp = inMessage.compInter;
              inMessageBasicInstance = inMessage.compInter.basicInterfaces.find(element => element.idOfBasic === inMessage.basicInter.id);
              let thisParamInter = realFuncSelector.parameterInterfaces.find(element => element.id === paramInterMessages.find(element => element.id === currentInMessage).paramInterId) || { "name" : "" };
              inMessageTrace = thisParamInter.name + "." + inMessageBasicInstance.name + "." + inMessage.name;
            } else {
              inMessage = interSelector.messages.find(element => element.id === currentInMessage) || "";

              interSelector.basicInters.forEach((basic) => {
                basic.messages.forEach((message) => {
                  if (message === inMessage.id) {
                    inMessageBasic = basic;
                  }
                })
              });

              if (inMessageBasic.type === 'direct') {
                inMessageComp = interSelector.compInters.find(element => element.basicInterfaces.find(element => element.idOfBasic === inMessageBasic.id)) || "";
                inMessageBasicInstance = "";
                if (inMessageComp) {
                  inMessageBasicInstance = inMessageComp.basicInterfaces.find(element => element.idOfBasic === inMessageBasic.id) || "";
                }
  
                inMessageTrace = realFuncSelector.name + "." + inMessageComp.name + "." + inMessageBasicInstance.name + "." + inMessage.name;
              } else {
                inMessageTrace = inMessageBasic.name + "." + inMessage.name;
              }
            }
  
  
            let receiveArguments = "";
            if (currentInMessage) {
              let parameters = [];
              if (subFuncMessages.find(element => element.id === currentInMessage)) {
                parameters = subFuncMessages.find(element => element.id === currentInMessage).parameters;
              } else if (paramInterMessages.find(element => element.id === currentInMessage)) {
                parameters = paramInterMessages.find(element => element.id === currentInMessage).parameters;
              } else if (interSelector.messages.find(element => element.id === currentInMessage)) {
                parameters = interSelector.messages.find(element => element.id === currentInMessage).parameters;
              }
              parameters.forEach((param, idx, arr) => {
                if (idx === arr.length - 1) {
                  if (arr.length === 1) {
                    receiveArguments += (
                      "(" + param.name + ")"
                    );
                  } else {
                    receiveArguments += (
                      param.name + ")"
                    );
                  }
                } else if (idx === 0) {
                  receiveArguments += (
                    "(" + param.name + ", "
                  );
                } else {
                  receiveArguments += (
                    param.name + ", "
                  );
                }
              })
            }
            if (subFuncMessages.find(element => element.id === currentInMessage) || 
                (paramInterMessages.find(element => element.id === currentInMessage))) {
              finalString +=  "        | " + inMessageTrace + receiveArguments + " => {\n"
            } else {
              finalString +=  "        | " + ((inMessage.port) ? (inMessage.port + "@") : "") + inMessageTrace + receiveArguments + " => {\n"
            }
            finalString += "        (* The below 'if else' branches represent Guards in the UCDSL *)\n"
              
            
            // Code for the transition
            let nameComment = genTransitionNameComment(transition, "         ");
            finalString += nameComment;
            finalString += (
              "          if (" + (transition.guard) +") { \n"
            );

            // Out Message Info
            let outMessage ="";
            let outMessageBasic = "";
            let outMessageComp = "";
            let outMessageBasicInstance = "";
            let outMessageTrace = "";
            if (subFuncMessages.find(element => element.id === transition.outMessage)) {
              outMessage = subFuncMessages.find(element => element.id === transition.outMessage);
              outMessageComp = outMessage.compInter;
              outMessageBasicInstance = outMessage.compInter.basicInterfaces.find(element => element.idOfBasic === outMessage.basicInter.id);
              let thisSubFunc = subfuncSelector.subfunctionalities.find(element => element.id === subFuncMessages.find(element => element.id === transition.outMessage).subfuncId) || { "name" : "" };
              if(outMessageBasicInstance){      
                outMessageTrace = thisSubFunc.name + "." + outMessageBasicInstance.name + "." + outMessage.name;
              }else{
                outMessageBasicInstance = outMessage.basicInter;
                outMessageTrace = thisSubFunc.name + "." + outMessageBasicInstance.name + "." + outMessage.name;
              }
              outMessageTrace = thisSubFunc.name + "." + outMessageBasicInstance.name + "." + outMessage.name;
            } else if (paramInterMessages.find(element => element.id === transition.outMessage)) {
              outMessage = paramInterMessages.find(element => element.id === transition.outMessage);
              outMessageComp = outMessage.compInter;
              outMessageBasicInstance = outMessage.compInter.basicInterfaces.find(element => element.idOfBasic === outMessage.basicInter.id);
              let thisParamInter = realFuncSelector.parameterInterfaces.find(element => element.id === paramInterMessages.find(element => element.id === transition.outMessage).paramInterId) || { "name" : "" };
              outMessageTrace = thisParamInter.name + "." + outMessageBasicInstance.name + "." + outMessage.name;
            } else {
              outMessage = interSelector.messages.find(element => element.id === transition.outMessage) || "";
            
              outMessageBasic = "";
              interSelector.basicInters.forEach((basic) => {
                basic.messages.forEach((message) => {
                  if (message === outMessage.id) {
                    outMessageBasic = basic;
                  }
                })
              })
  
              if(outMessageBasic.type === 'direct') {
                outMessageComp = interSelector.compInters.find(element => element.basicInterfaces.find(element => element.idOfBasic === outMessageBasic.id)) || "";
                outMessageBasicInstance = "";
                if (outMessageComp) {
                  outMessageBasicInstance = outMessageComp.basicInterfaces.find(element => element.idOfBasic === outMessageBasic.id) || "";
                }
    
                outMessageTrace = realFuncSelector.name + "." + outMessageComp.name + "." + outMessageBasicInstance.name + "." + outMessage.name;
              }else{
                outMessageTrace = outMessageBasic.name + "." + outMessage.name;
              }
            }
            let toState = "";
            if (stateMachineSelector.states.find(element => element.id === transition.toState)) {
              toState = stateMachineSelector.states.find(element => element.id === transition.toState).name
            }

            let sendArguments = "";
            if (transition.outMessage) {
              transition.outMessageArguments.forEach((arg, idx, arr) => {
                if (idx === arr.length - 1) {
                  if (arr.length === 1) {
                    sendArguments += (
                      "(" + arg.argValue + ")"
                    );
                  } else {
                    sendArguments += (
                      arg.argValue + ")"
                    );
                  }
                } else if (idx === 0) {
                  sendArguments += (
                    "(" + arg.argValue + ", "
                  );
                } else {
                  sendArguments += (
                    arg.argValue + ", "
                  );
                }
              })
            }


            finalString += ( 
              "             send " + outMessageTrace + sendArguments + ((transition.targetPort) ? ("@" + transition.targetPort) : "") + "\n" +
              "             and transition " + toState           
            );

            if (toState) {
              if (transition.toStateArguments.length > 0) {

                transition.toStateArguments.forEach((param, idx, arr) => {
                  if (idx === arr.length - 1) {
                    if (arr.length === 1) {
                      finalString += (
                        "(" + param.argValue + ")"
                      );
                    } else {
                      finalString += (
                        param.argValue + ")"
                      );
                    }
                    
                  } else if (idx === 0) {
                    finalString += (
                      "(" + param.argValue + ", "
                    );
                  } else {
                    finalString += (
                      param.argValue + ", "
                    );
                  } 
                })
              }
            }
            finalString += ".\n" 
            finalString += (
              "          } else {\n"
            );
            finalString += (
              "             fail.\n          }\n"
            );
            finalString += "        }\n\n"
          } else {
            // Normal transition code
            let thisTransition = thisStateInMessageInfo[currentInMessage][0];
  
            // In Message Info
            let inMessage ="";
            let inMessageBasic = "";
            let inMessageComp = "";
            let inMessageBasicInstance = "";
            let inMessageTrace = "";
            if (subFuncMessages.find(element => element.id === thisTransition.inMessage)) {
              inMessage = subFuncMessages.find(element => element.id === thisTransition.inMessage);
              let thisSubFunc = subfuncSelector.subfunctionalities.find(element => element.id === subFuncMessages.find(element => element.id === thisTransition.inMessage).subfuncId) || { "name" : "" };
              inMessageTrace = thisSubFunc.name + "." + inMessage.basicInter.name + "." + inMessage.name;
            } else if (paramInterMessages.find(element => element.id === thisTransition.inMessage)) {
              inMessage = paramInterMessages.find(element => element.id === thisTransition.inMessage);
              let thisParamInter = realFuncSelector.parameterInterfaces.find(element => element.id === paramInterMessages.find(element => element.id === thisTransition.inMessage).paramInterId) || { "name" : "" };
              inMessageTrace = thisParamInter.name + "." + inMessage.basicInter.name + "." + inMessage.name;
            } else {
              inMessage = interSelector.messages.find(element => element.id === thisTransition.inMessage) || "";
            
              inMessageBasic = "";
              interSelector.basicInters.forEach((basic) => {
                basic.messages.forEach((message) => {
                  if (message === inMessage.id) {
                    inMessageBasic = basic;
                  }
                })
              })

              if (inMessageBasic.type === 'direct') {
                inMessageComp = interSelector.compInters.find(element => element.basicInterfaces.find(element => element.idOfBasic === inMessageBasic.id)) || "";
                inMessageBasicInstance = "";
                if (inMessageComp) {
                  inMessageBasicInstance = inMessageComp.basicInterfaces.find(element => element.idOfBasic === inMessageBasic.id) || "";
                }
    
                inMessageTrace = realFuncSelector.name + "." + inMessageComp.name + "." + inMessageBasicInstance.name + "." + inMessage.name;
              } else {
                inMessageTrace = inMessageBasic.name + "." + inMessage.name;
              }
            }
  
            // Out Message Info
            let outMessage ="";
            let outMessageBasic = "";
            let outMessageComp = "";
            let outMessageBasicInstance = "";
            let outMessageTrace = "";
            if (subFuncMessages.find(element => element.id === thisTransition.outMessage)) {
              outMessage = subFuncMessages.find(element => element.id === thisTransition.outMessage);
              let thisSubFunc = subfuncSelector.subfunctionalities.find(element => element.id === subFuncMessages.find(element => element.id === thisTransition.outMessage).subfuncId) || { "name" : "" };
              outMessageTrace = thisSubFunc.name + "." + outMessage.basicInter.name + "." + outMessage.name;
            } else if (paramInterMessages.find(element => element.id === thisTransition.outMessage)) {
              outMessage = paramInterMessages.find(element => element.id === thisTransition.outMessage);
              let thisParamInter = realFuncSelector.parameterInterfaces.find(element => element.id === paramInterMessages.find(element => element.id === thisTransition.outMessage).paramInterId) || { "name" : "" };
              outMessageTrace = thisParamInter.name + "." + outMessage.basicInter.name + "." + outMessage.name;
            } else {
              outMessage = interSelector.messages.find(element => element.id === thisTransition.outMessage) || "";
            
              outMessageBasic = "";
              interSelector.basicInters.forEach((basic) => {
                basic.messages.forEach((message) => {
                  if (message === outMessage.id) {
                    outMessageBasic = basic;
                  }
                })
              })
  
              if (outMessageBasic.type === 'direct') {
                outMessageComp = interSelector.compInters.find(element => element.basicInterfaces.find(element => element.idOfBasic === outMessageBasic.id)) || "";
                outMessageBasicInstance = "";
                if (outMessageComp) {
                  outMessageBasicInstance = outMessageComp.basicInterfaces.find(element => element.idOfBasic === outMessageBasic.id) || "";
                }
  
                outMessageTrace = realFuncSelector.name + "." + outMessageComp.name + "." + outMessageBasicInstance.name + "." + outMessage.name;
              } else {
                outMessageTrace = outMessageBasic.name + "." + outMessage.name;
              }
            }

            let toState = "";
            if (stateMachineSelector.states.find(element => element.id === thisTransition.toState)) {
              toState = stateMachineSelector.states.find(element => element.id === thisTransition.toState).name
            }
  
            let sendArguments = "";
            if (thisTransition.outMessage) {
              thisTransition.outMessageArguments.forEach((arg, idx, arr) => {
                if (idx === arr.length - 1) {
                  if (arr.length === 1) {
                    sendArguments += (
                      "(" + arg.argValue + ")"
                    );
                  } else {
                    sendArguments += (
                      arg.argValue + ")"
                    );
                  }
                } else if (idx === 0) {
                  sendArguments += (
                    "(" + arg.argValue + ", "
                  );
                } else {
                  sendArguments += (
                    arg.argValue + ", "
                  );
                }
              })
            }
  
            let receiveArguments = "";
            if (thisTransition.inMessage && interSelector.messages.find(element => element.id === thisTransition.inMessage)) {
              interSelector.messages.find(element => element.id === thisTransition.inMessage).parameters.forEach((param, idx, arr) => {
                if (idx === arr.length - 1) {
                  if (arr.length === 1) {
                    receiveArguments += (
                      "(" + param.name + ")"
                    );
                  } else {
                    receiveArguments += (
                      param.name + ")"
                    );
                  }
                } else if (idx === 0) {
                  receiveArguments += (
                    "(" + param.name + ", "
                  );
                } else {
                  receiveArguments += (
                    param.name + ", "
                  );
                }
              })
            }

            let nameComment = genTransitionNameComment(thisTransition, "          ");
  
            finalString += ( 
              "      | " + ((inMessage.port) ? (inMessage.port + "@") : "") + inMessageTrace + receiveArguments + " => {\n" +
              nameComment +
              "          send " + outMessageTrace + sendArguments + ((thisTransition.targetPort) ? ("@" + thisTransition.targetPort) : "") + "\n" +
              "          and transition " + toState           
            );
  
            if (toState) {
              if (thisTransition.toStateArguments.length > 0) {
  
                thisTransition.toStateArguments.forEach((param, idx, arr) => {
                  if (idx === arr.length - 1) {
                    if (arr.length === 1) {
                      finalString += (
                        "(" + param.argValue + ").\n" +
                        "      }\n" 
                      );
                    } else {
                      finalString += (
                        param.argValue + ").\n" +
                        "      }\n\n" 
                      );
                    }
                    
                  } else if (idx === 0) {
                    finalString += (
                      "(" + param.argValue + ", "
                    );
                  } else {
                    finalString += (
                      param.argValue + ", "
                    );
                  } 
                })
              } else {
                finalString += ".\n      }\n\n"
              }
            } 
          }
        });
  
        finalString += (
          "\n      | * => { fail. }\n" +
          "    end\n" +
          "  }\n\n"
          );

      });
    }

    finalString += "}\n\n";

    return finalString;
  }

  // generate the code for the Real functionality
  const realFuncCodeConstructor = () => {
    let finalString = "";
    
    let compDir = (interSelector.compInters[interSelector.compInters.findIndex(inter => inter.id === realFuncSelector.compositeDirectInterface)]) || "";
    let compAdv = (interSelector.compInters[interSelector.compInters.findIndex(inter => inter.id === realFuncSelector.compositeAdversarialInterface)]) || "";
    
    let paramInterCode = "";
    if (realFuncSelector.parameterInterfaces && realFuncSelector.parameterInterfaces.length > 0) {
      paramInterCode += "("
      realFuncSelector.parameterInterfaces.forEach((parameter, idx) => {
        paramInterCode += parameter.name + " : " + parameter.modelName + "." + parameter.compInterName;
        if (idx < realFuncSelector.parameterInterfaces.length - 1) {
          paramInterCode += ", "
        }
      });
      paramInterCode += ")";
    }
    

    finalString += (
        "(* Real Functionality *)\n" +
        "functionality " + realFuncSelector.name + paramInterCode + " implements " + compDir.name + " " + (compAdv.name ? (compAdv.name + " {") : "{") + "\n\n"
    );


    if (subfuncSelector.subfunctionalities.length > 0) {
      // Subfunctionality code generation
      finalString += (
        "  (* Subfunctionalites *)\n"
      );
      
      subfuncSelector.subfunctionalities.forEach(subfunc => {
        let name = subfunc.name ? subfunc.name : "";
        let idealFuncName = subfunc.idealFunctionalityName ? subfunc.idealFunctionalityName : "";
        let idealFuncModelName = subfunc.idealFuncModel ? subfunc.idealFuncModel : "";
        finalString += (
          "  subfun " + name + " = " + idealFuncModelName + "." + idealFuncName + "\n"
        );
      });
    }
    

    

    realFuncSelector.parties.forEach((element) => {
      let thisParty = partySelector.parties[partySelector.parties.findIndex(party => party.id === element)];
      let thisPartyDirectInter = "";
      let thisPartyAdvInter = "";

      if (compDir !== "") {
        thisPartyDirectInter = (compDir.basicInterfaces[compDir.basicInterfaces.findIndex(t => t.idOfInstance === thisParty.basicDirectInterface)]) || "";
      }
      if (compAdv !== "") {
        thisPartyAdvInter = (compAdv.basicInterfaces[compAdv.basicInterfaces.findIndex(t => t.idOfInstance === thisParty.basicAdversarialInterface)]) || "";
      }
      
      finalString += "\n  (* Party *)\n"
      if('comment' in thisParty){
        if(thisParty.comment.length > 75){
          finalString += "  (* " +commentBreaker(thisParty.comment, 75, 2) + "\n   *)\n"
        }
        else if(thisParty.comment.length > 0){
          finalString += "  (* " +thisParty.comment + " *)\n"
        }
      }
      finalString += "  party " + thisParty.name + " serves" + (thisPartyDirectInter.name ? (" " + compDir.name + "." + thisPartyDirectInter.name) : "") + ((thisPartyAdvInter.name && thisPartyDirectInter.name) ? (" " + compAdv.name + "." + thisPartyAdvInter.name) : "") + ((thisPartyAdvInter.name && !thisPartyDirectInter.name) ? (" " + compAdv.name + "." + thisPartyAdvInter.name) : "") + " {\n"
    

      // initial state code
      let thisStateMachine = (stateMachineSelector.stateMachines[stateMachineSelector.stateMachines.findIndex(element => element.id === thisParty.stateMachine)]) || "";
      let initState = (stateMachineSelector.states[stateMachineSelector.states.findIndex(element => element.id === thisStateMachine.initState)]) || "";
      let thisStateMachineTransitionArray = stateMachineSelector.transitions.filter(element => thisStateMachine.transitions.includes(element.id));
      let thisInitStateTransitionArray = thisStateMachineTransitionArray.filter(element => element.fromState === initState.id);

      if('comment' in initState){
        if(initState.comment.length > 70){
          finalString += "    (* " +commentBreaker(initState.comment, 70, 3) + "\n     *)\n"
        }
        else if(initState.comment.length >0){
          finalString += "    (* " +initState.comment + " *)\n"
        }
      }
      finalString += (
        "    initial state " + initState.name + " {\n" +
        "      match message with \n"
      );

      let thisInitStateInMessageArray = [];
      let thisInitStateInMessageInfo = {};

      if (thisStateMachine) {
        thisInitStateTransitionArray.forEach(transition => {
          if (thisInitStateInMessageInfo[transition.inMessage]) {
            thisInitStateInMessageInfo[transition.inMessage].push(transition);
          } else {
            thisInitStateInMessageArray.push(transition.inMessage);
            thisInitStateInMessageInfo[transition.inMessage] = [transition];
          }
        });
  
        thisInitStateInMessageArray.forEach(currentInMessage => {
          // Determine if single transition guard code is needed
          // For this message, determine if any transitions include guard code
          let singleTransitionGuard = false;
          thisInitStateTransitionArray.forEach(transition => {
            if (transition.inMessage === currentInMessage && transition.guard !== "") {
              singleTransitionGuard = true;
            }
          });
          // Guard Code
          if (thisInitStateInMessageInfo[currentInMessage].length > 1) {
            // In Message Info
            let inMessage ="";
            let inMessageBasic = "";
            let inMessageComp = "";
            let inMessageBasicInstance = "";
            let inMessageTrace = "";
            if (subFuncMessages.find(element => element.id === currentInMessage)) {
              inMessage = subFuncMessages.find(element => element.id === currentInMessage);
              inMessageComp = inMessage.compInter;
              inMessageBasicInstance = inMessage.compInter.basicInterfaces.find(element => element.idOfBasic === inMessage.basicInter.id);
              let thisSubFunc = subfuncSelector.subfunctionalities.find(element => element.id === subFuncMessages.find(element => element.id === currentInMessage).subfuncId) || { "name" : "" };
              inMessageTrace = thisSubFunc.name + "." + inMessageBasicInstance.name + "." + inMessage.name;
            } else if (paramInterMessages.find(element => element.id === currentInMessage)) {
              inMessage = paramInterMessages.find(element => element.id === currentInMessage);
              inMessageComp = inMessage.compInter;
              inMessageBasicInstance = inMessage.compInter.basicInterfaces.find(element => element.idOfBasic === inMessage.basicInter.id);
              let thisParamInter = realFuncSelector.parameterInterfaces.find(element => element.id === paramInterMessages.find(element => element.id === currentInMessage).paramInterId) || { "name" : "" };
              inMessageTrace = thisParamInter.name + "." + inMessageBasicInstance.name + "." + inMessage.name;
            } else {
              inMessage = interSelector.messages.find(element => element.id === currentInMessage) || "";

              interSelector.basicInters.forEach((basic) => {
                basic.messages.forEach((message) => {
                  if (message === inMessage.id) {
                    inMessageBasic = basic;
                  }
                })
              });

              inMessageComp = interSelector.compInters.find(element => element.basicInterfaces.find(element => element.idOfBasic === inMessageBasic.id)) || "";
              if (inMessageComp) {
                inMessageBasicInstance = inMessageComp.basicInterfaces.find(element => element.idOfBasic === inMessageBasic.id) || "";  
              }  
              inMessageTrace = inMessageComp.name + "." + inMessageBasicInstance.name + "." + inMessage.name;
            }
  
  
            let receiveArguments = "";
            if (currentInMessage) {
              let parameters = [];
              if (subFuncMessages.find(element => element.id === currentInMessage)) {
                parameters = subFuncMessages.find(element => element.id === currentInMessage).parameters;
              } else if (paramInterMessages.find(element => element.id === currentInMessage)) {
                parameters = paramInterMessages.find(element => element.id === currentInMessage).parameters;
              } else if (interSelector.messages.find(element => element.id === currentInMessage)) {
                parameters = interSelector.messages.find(element => element.id === currentInMessage).parameters;
              }
              parameters.forEach((param, idx, arr) => {
                if (idx === arr.length - 1) {
                  if (arr.length === 1) {
                    receiveArguments += (
                      "(" + param.name + ")"
                    );
                  } else {
                    receiveArguments += (
                      param.name + ")"
                    );
                  }
                } else if (idx === 0) {
                  receiveArguments += (
                    "(" + param.name + ", "
                  );
                } else {
                  receiveArguments += (
                    param.name + ", "
                  );
                }
              })
            }
            if (subFuncMessages.find(element => element.id === currentInMessage) || 
                (paramInterMessages.find(element => element.id === currentInMessage))) {
              finalString +=  "        | " + inMessageTrace + receiveArguments + " => {\n"
            } else {
              finalString +=  "        | " + ((inMessage.port) ? (inMessage.port + "@") : (inMessageBasic.type === "adversarial") ? "" : "undefined@") + inMessageTrace + receiveArguments + " => {\n"
            }
            finalString += (
              "        (* The below 'if else' branches represent Guards in the UCDSL\n" + 
              "         * Guards are used to differentiate transitions that may have\n" +
              "         * identical 'from' states and 'in' messages *)\n"
            )
            // Code for each transition
            thisInitStateInMessageInfo[currentInMessage].forEach((transition, idx, arr) => {
              if (idx === 0) {
                finalString += (
                  "          if (" + (transition.guard) +") { \n"
                );
              } else {
                finalString += (
                  " elif (" + (transition.guard) + ") { \n"
                )
              }
  
              // Out Message Info
              let outMessage ="";
              let outMessageBasic = "";
              let outMessageComp = "";
              let outMessageBasicInstance = "";
              let outMessageTrace = "";
              let outMessageIsSubOrPara = false;
              if (subFuncMessages.find(element => element.id === transition.outMessage)) {
                outMessage = subFuncMessages.find(element => element.id === transition.outMessage);
                outMessageComp = outMessage.compInter;
                outMessageBasicInstance = outMessage.compInter.basicInterfaces.find(element => element.idOfBasic === outMessage.basicInter.id);
                let thisSubFunc = subfuncSelector.subfunctionalities.find(element => element.id === subFuncMessages.find(element => element.id === transition.outMessage).subfuncId) || { "name" : "" };
                outMessageTrace = thisSubFunc.name + "." + outMessageBasicInstance.name + "." + outMessage.name;
                outMessageIsSubOrPara = true;
              } else if (paramInterMessages.find(element => element.id === transition.outMessage)) {
                outMessage = paramInterMessages.find(element => element.id === transition.outMessage);
                outMessageComp = outMessage.compInter;
                outMessageBasicInstance = outMessage.compInter.basicInterfaces.find(element => element.idOfBasic === outMessage.basicInter.id);
                let thisParamInter = realFuncSelector.parameterInterfaces.find(element => element.id === paramInterMessages.find(element => element.id === transition.outMessage).paramInterId) || { "name" : "" };
                outMessageTrace = thisParamInter.name + "." + outMessageBasicInstance.name + "." + outMessage.name;
                outMessageIsSubOrPara = true;
              } else {
                outMessage = interSelector.messages.find(element => element.id === transition.outMessage) || "";
              
                outMessageBasic = "";
                interSelector.basicInters.forEach((basic) => {
                  basic.messages.forEach((message) => {
                    if (message === outMessage.id) {
                      outMessageBasic = basic;
                    }
                  })
                })
    
                outMessageComp = interSelector.compInters.find(element => element.basicInterfaces.find(element => element.idOfBasic === outMessageBasic.id)) || "";
                outMessageBasicInstance = "";
                if (outMessageComp) {
                  outMessageBasicInstance = outMessageComp.basicInterfaces.find(element => element.idOfBasic === outMessageBasic.id) || "";
                }
    
                outMessageTrace = outMessageComp.name + "." + outMessageBasicInstance.name + "." + outMessage.name;
              }
  
              let toState = "";
              if (stateMachineSelector.states.find(element => element.id === transition.toState)) {
                toState = stateMachineSelector.states.find(element => element.id === transition.toState).name
              }
  
              let sendArguments = "";
              if (transition.outMessage) {
                transition.outMessageArguments.forEach((arg, idx, arr) => {
                  if (idx === arr.length - 1) {
                    if (arr.length === 1) {
                      sendArguments += (
                        "(" + arg.argValue + ")"
                      );
                    } else {
                      sendArguments += (
                        arg.argValue + ")"
                      );
                    }
                  } else if (idx === 0) {
                    sendArguments += (
                      "(" + arg.argValue + ", "
                    );
                  } else {
                    sendArguments += (
                      arg.argValue + ", "
                    );
                  }
                })
              }

              let nameComment = genTransitionNameComment(transition, "             ");
              
              finalString += ( 
                nameComment +
                "             send " + outMessageTrace + sendArguments + ((transition.targetPort) ? ("@" + transition.targetPort) : (outMessageIsSubOrPara || outMessageBasic.type === "adversarial") ? "" : "@undefined") + "\n" +
                "             and transition " + toState           
              );
  
              if (toState) {
                if (transition.toStateArguments.length > 0) {
  
                  transition.toStateArguments.forEach((param, idx, arr) => {
                    if (idx === arr.length - 1) {
                      if (arr.length === 1) {
                        finalString += (
                          "(" + param.argValue + ")"
                        );
                      } else {
                        finalString += (
                          param.argValue + ")"
                        );
                      }
                      
                    } else if (idx === 0) {
                      finalString += (
                        "(" + param.argValue + ", "
                      );
                    } else {
                      finalString += (
                        param.argValue + ", "
                      );
                    } 
                  })
                }
              }
              finalString += ".\n          }" 
              
              if (idx === arr.length - 1) {
                finalString += " else { fail. }\n"
              }
            });
            finalString += "        }\n\n"
  
          } else if (singleTransitionGuard) { // Guard code for single transitions
            let transition = thisInitStateTransitionArray.find(transition => transition.inMessage === currentInMessage)
            // In Message Info
            let inMessage ="";
            let inMessageBasic = "";
            let inMessageComp = "";
            let inMessageBasicInstance = "";
            let inMessageTrace = "";
            if (subFuncMessages.find(element => element.id === currentInMessage)) {
              inMessage = subFuncMessages.find(element => element.id === currentInMessage);
              inMessageComp = inMessage.compInter;
              inMessageBasicInstance = inMessage.compInter.basicInterfaces.find(element => element.idOfBasic === inMessage.basicInter.id);
              let thisSubFunc = subfuncSelector.subfunctionalities.find(element => element.id === subFuncMessages.find(element => element.id === currentInMessage).subfuncId) || { "name" : "" };
              inMessageTrace = thisSubFunc.name + "." + inMessageBasicInstance.name + "." + inMessage.name;
            } else if (paramInterMessages.find(element => element.id === currentInMessage)) {
              inMessage = paramInterMessages.find(element => element.id === currentInMessage);
              inMessageComp = inMessage.compInter;
              inMessageBasicInstance = inMessage.compInter.basicInterfaces.find(element => element.idOfBasic === inMessage.basicInter.id);
              let thisParamInter = realFuncSelector.parameterInterfaces.find(element => element.id === paramInterMessages.find(element => element.id === currentInMessage).paramInterId) || { "name" : "" };
              inMessageTrace = thisParamInter.name + "." + inMessageBasicInstance.name + "." + inMessage.name;
            } else {
              inMessage = interSelector.messages.find(element => element.id === currentInMessage) || "";

              interSelector.basicInters.forEach((basic) => {
                basic.messages.forEach((message) => {
                  if (message === inMessage.id) {
                    inMessageBasic = basic;
                  }
                })
              });

              inMessageComp = interSelector.compInters.find(element => element.basicInterfaces.find(element => element.idOfBasic === inMessageBasic.id)) || "";
              if (inMessageComp) {
                inMessageBasicInstance = inMessageComp.basicInterfaces.find(element => element.idOfBasic === inMessageBasic.id) || "";  
              }  
              inMessageTrace = inMessageComp.name + "." + inMessageBasicInstance.name + "." + inMessage.name;
            }
  
  
            let receiveArguments = "";
            if (currentInMessage) {
              let parameters = [];
              if (subFuncMessages.find(element => element.id === currentInMessage)) {
                parameters = subFuncMessages.find(element => element.id === currentInMessage).parameters;
              } else if (paramInterMessages.find(element => element.id === currentInMessage)) {
                parameters = paramInterMessages.find(element => element.id === currentInMessage).parameters;
              } else if (interSelector.messages.find(element => element.id === currentInMessage)) {
                parameters = interSelector.messages.find(element => element.id === currentInMessage).parameters;
              }
              parameters.forEach((param, idx, arr) => {
                if (idx === arr.length - 1) {
                  if (arr.length === 1) {
                    receiveArguments += (
                      "(" + param.name + ")"
                    );
                  } else {
                    receiveArguments += (
                      param.name + ")"
                    );
                  }
                } else if (idx === 0) {
                  receiveArguments += (
                    "(" + param.name + ", "
                  );
                } else {
                  receiveArguments += (
                    param.name + ", "
                  );
                }
              })
            }
            if (subFuncMessages.find(element => element.id === currentInMessage) || 
                (paramInterMessages.find(element => element.id === currentInMessage))) {
              finalString +=  "        | " + inMessageTrace + receiveArguments + " => {\n"
            } else {
              finalString +=  "        | " + ((inMessage.port) ? (inMessage.port + "@") : (inMessageBasic.type === "adversarial") ? "" : "undefined@") + inMessageTrace + receiveArguments + " => {\n"
            }
            finalString += "        (* The below 'if else' branches represent Guards in the UCDSL *)\n"
              
            
            // Code for the transition
            let nameComment = genTransitionNameComment(transition, "         ");
            finalString += nameComment;
            finalString += (
              "          if (" + (transition.guard) +") { \n"
            );

            // Out Message Info
            let outMessage ="";
            let outMessageBasic = "";
            let outMessageComp = "";
            let outMessageBasicInstance = "";
            let outMessageTrace = "";
            let outMessageIsSubOrPara = false
            if (subFuncMessages.find(element => element.id === transition.outMessage)) {
              outMessage = subFuncMessages.find(element => element.id === transition.outMessage);
              outMessageComp = outMessage.compInter;
              outMessageBasicInstance = outMessage.compInter.basicInterfaces.find(element => element.idOfBasic === outMessage.basicInter.id);
              let thisSubFunc = subfuncSelector.subfunctionalities.find(element => element.id === subFuncMessages.find(element => element.id === transition.outMessage).subfuncId) || { "name" : "" };
              outMessageTrace = thisSubFunc.name + "." + outMessageBasicInstance.name + "." + outMessage.name;
              outMessageIsSubOrPara = true;
            } else if (paramInterMessages.find(element => element.id === transition.outMessage)) {
              outMessage = paramInterMessages.find(element => element.id === transition.outMessage);
              outMessageComp = outMessage.compInter;
              outMessageBasicInstance = outMessage.compInter.basicInterfaces.find(element => element.idOfBasic === outMessage.basicInter.id);
              let thisParamInter = realFuncSelector.parameterInterfaces.find(element => element.id === paramInterMessages.find(element => element.id === transition.outMessage).paramInterId) || { "name" : "" };
              outMessageTrace = thisParamInter.name + "." + outMessageBasicInstance.name + "." + outMessage.name;
              outMessageIsSubOrPara = true;
            } else {
              outMessage = interSelector.messages.find(element => element.id === transition.outMessage) || "";
            
              outMessageBasic = "";
              interSelector.basicInters.forEach((basic) => {
                basic.messages.forEach((message) => {
                  if (message === outMessage.id) {
                    outMessageBasic = basic;
                  }
                })
              })
  
              outMessageComp = interSelector.compInters.find(element => element.basicInterfaces.find(element => element.idOfBasic === outMessageBasic.id)) || "";
              outMessageBasicInstance = "";
              if (outMessageComp) {
                outMessageBasicInstance = outMessageComp.basicInterfaces.find(element => element.idOfBasic === outMessageBasic.id) || "";
              }
  
              outMessageTrace = outMessageComp.name + "." + outMessageBasicInstance.name + "." + outMessage.name;
            }

            let toState = "";
            if (stateMachineSelector.states.find(element => element.id === transition.toState)) {
              toState = stateMachineSelector.states.find(element => element.id === transition.toState).name
            }

            let sendArguments = "";
            if (transition.outMessage) {
              transition.outMessageArguments.forEach((arg, idx, arr) => {
                if (idx === arr.length - 1) {
                  if (arr.length === 1) {
                    sendArguments += (
                      "(" + arg.argValue + ")"
                    );
                  } else {
                    sendArguments += (
                      arg.argValue + ")"
                    );
                  }
                } else if (idx === 0) {
                  sendArguments += (
                    "(" + arg.argValue + ", "
                  );
                } else {
                  sendArguments += (
                    arg.argValue + ", "
                  );
                }
              })
            }


            finalString += ( 
              "             send " + outMessageTrace + sendArguments + ((transition.targetPort) ? ("@" + transition.targetPort) : (outMessageIsSubOrPara || outMessageBasic.type === "adversarial") ? "" : "@undefined") + "\n" +
              "             and transition " + toState           
            );

            if (toState) {
              if (transition.toStateArguments.length > 0) {

                transition.toStateArguments.forEach((param, idx, arr) => {
                  if (idx === arr.length - 1) {
                    if (arr.length === 1) {
                      finalString += (
                        "(" + param.argValue + ")"
                      );
                    } else {
                      finalString += (
                        param.argValue + ")"
                      );
                    }
                    
                  } else if (idx === 0) {
                    finalString += (
                      "(" + param.argValue + ", "
                    );
                  } else {
                    finalString += (
                      param.argValue + ", "
                    );
                  } 
                })
              }
            }
            finalString += ".\n" 
            finalString += (
              "          } else {\n"
            );
            finalString += (
              "             fail.\n          }\n"
            );
            finalString += "        }\n\n"
          } else {
            // Normal transition code
            let thisTransition = thisInitStateInMessageInfo[currentInMessage][0];
  
            // In Message Info
            let inMessage ="";
            let inMessageBasic = "";
            let inMessageComp = "";
            let inMessageBasicInstance = "";
            let inMessageTrace = "";
            if (subFuncMessages.find(element => element.id === currentInMessage)) {
              inMessage = subFuncMessages.find(element => element.id === currentInMessage);
              inMessageComp = inMessage.compInter;
              inMessageBasicInstance = inMessage.compInter.basicInterfaces.find(element => element.idOfBasic === inMessage.basicInter.id);
              let thisSubFunc = subfuncSelector.subfunctionalities.find(element => element.id === subFuncMessages.find(element => element.id === currentInMessage).subfuncId) || { "name" : "" };
              inMessageTrace = thisSubFunc.name + "." + inMessageBasicInstance.name + "." + inMessage.name;
            } else if (paramInterMessages.find(element => element.id === currentInMessage)) {
              inMessage = paramInterMessages.find(element => element.id === currentInMessage);
              inMessageComp = inMessage.compInter;
              inMessageBasicInstance = inMessage.compInter.basicInterfaces.find(element => element.idOfBasic === inMessage.basicInter.id);
              let thisParamInter = realFuncSelector.parameterInterfaces.find(element => element.id === paramInterMessages.find(element => element.id === currentInMessage).paramInterId) || { "name" : "" };
              inMessageTrace = thisParamInter.name + "." + inMessageBasicInstance.name + "." + inMessage.name;
            } else {
              inMessage = interSelector.messages.find(element => element.id === currentInMessage) || "";

              interSelector.basicInters.forEach((basic) => {
                basic.messages.forEach((message) => {
                  if (message === inMessage.id) {
                    inMessageBasic = basic;
                  }
                })
              });

              inMessageComp = interSelector.compInters.find(element => element.basicInterfaces.find(element => element.idOfBasic === inMessageBasic.id)) || "";
              if (inMessageComp) {
                inMessageBasicInstance = inMessageComp.basicInterfaces.find(element => element.idOfBasic === inMessageBasic.id) || "";  
              }  
              inMessageTrace = inMessageComp.name + "." + inMessageBasicInstance.name + "." + inMessage.name;
            }
  
            // Out Message Info
            let outMessage = "";
            let outMessageBasic = "";
            let outMessageComp = "";
            let outMessageBasicInstance = "";
            let outMessageTrace = "";
            let outMessageIsSubOrPara = false;
            if (subFuncMessages.find(element => element.id === thisTransition.outMessage)) {
              outMessage = subFuncMessages.find(element => element.id === thisTransition.outMessage);
              outMessageComp = outMessage.compInter;
              outMessageBasicInstance = outMessage.compInter.basicInterfaces.find(element => element.idOfBasic === outMessage.basicInter.id);
              let thisSubFunc = subfuncSelector.subfunctionalities.find(element => element.id === subFuncMessages.find(element => element.id === thisTransition.outMessage).subfuncId) || { "name" : "" };
              outMessageTrace = thisSubFunc.name + "." + outMessageBasicInstance.name + "." + outMessage.name;
              outMessageIsSubOrPara = true;
            } else if (paramInterMessages.find(element => element.id === thisTransition.outMessage)) {
              outMessage = paramInterMessages.find(element => element.id === thisTransition.outMessage);
              outMessageComp = outMessage.compInter;
              outMessageBasicInstance = outMessage.compInter.basicInterfaces.find(element => element.idOfBasic === outMessage.basicInter.id);
              let thisParamInter = realFuncSelector.parameterInterfaces.find(element => element.id === paramInterMessages.find(element => element.id === thisTransition.outMessage).paramInterId) || { "name" : "" };
              outMessageTrace = thisParamInter.name + "." + outMessageBasicInstance.name + "." + outMessage.name;
              outMessageIsSubOrPara = true;
            } else {
              outMessage = interSelector.messages.find(element => element.id === thisTransition.outMessage) || "";
            
              outMessageBasic = "";
              interSelector.basicInters.forEach((basic) => {
                basic.messages.forEach((message) => {
                  if (message === outMessage.id) {
                    outMessageBasic = basic;
                  }
                })
              })
  
              outMessageComp = interSelector.compInters.find(element => element.basicInterfaces.find(element => element.idOfBasic === outMessageBasic.id)) || "";
              outMessageBasicInstance = "";
              if (outMessageComp) {
                outMessageBasicInstance = outMessageComp.basicInterfaces.find(element => element.idOfBasic === outMessageBasic.id) || "";
              }
  
              outMessageTrace = outMessageComp.name + "." + outMessageBasicInstance.name + "." + outMessage.name;
            }
  
            let toState = "";
            if (stateMachineSelector.states.find(element => element.id === thisTransition.toState)) {
              toState = stateMachineSelector.states.find(element => element.id === thisTransition.toState).name
            }
  
            let sendArguments = "";
            if (thisTransition.outMessage) {
              thisTransition.outMessageArguments.forEach((arg, idx, arr) => {
                if (idx === arr.length - 1) {
                  if (arr.length === 1) {
                    sendArguments += (
                      "(" + arg.argValue + ")"
                    );
                  } else {
                    sendArguments += (
                      arg.argValue + ")"
                    );
                  }
                } else if (idx === 0) {
                  sendArguments += (
                    "(" + arg.argValue + ", "
                  );
                } else {
                  sendArguments += (
                    arg.argValue + ", "
                  );
                }
              })
            }
  
            let receiveArguments = "";
            if (thisTransition.inMessage) {
              let parameters = [];
              if (subFuncMessages.find(element => element.id === thisTransition.inMessage)) {
                parameters = subFuncMessages.find(element => element.id === thisTransition.inMessage).parameters;
              } else if (paramInterMessages.find(element => element.id === thisTransition.inMessage)) {
                parameters = paramInterMessages.find(element => element.id === thisTransition.inMessage).parameters;
              } else if (interSelector.messages.find(element => element.id === thisTransition.inMessage)) {
                parameters = interSelector.messages.find(element => element.id === thisTransition.inMessage).parameters;
              }
              parameters.forEach((param, idx, arr) => {
                if (idx === arr.length - 1) {
                  if (arr.length === 1) {
                    receiveArguments += (
                      "(" + param.name + ")"
                    );
                  } else {
                    receiveArguments += (
                      param.name + ")"
                    );
                  }
                } else if (idx === 0) {
                  receiveArguments += (
                    "(" + param.name + ", "
                  );
                } else {
                  receiveArguments += (
                    param.name + ", "
                  );
                }
              })
            }

            let nameComment = genTransitionNameComment(thisTransition, "            ");

            if (subFuncMessages.find(element => element.id === currentInMessage) || 
                (paramInterMessages.find(element => element.id === currentInMessage))) {
              finalString += (
                "        | " + inMessageTrace + receiveArguments + " => {\n" +
                nameComment +
                "            send " + outMessageTrace + sendArguments + ((thisTransition.targetPort) ? ("@" + thisTransition.targetPort) : (outMessageIsSubOrPara || outMessageBasic.type === "adversarial") ? "" : "@undefined") + "\n" +
                "            and transition " + toState
              );
            } else {
              finalString += (
                "        | " + ((inMessage.port) ? (inMessage.port + "@") : (inMessageBasic.type === "adversarial") ? "" : "undefined@") + inMessageTrace + receiveArguments + " => {\n" +
                nameComment +
                "            send " + outMessageTrace + sendArguments + ((thisTransition.targetPort) ? ("@" + thisTransition.targetPort) : (outMessageIsSubOrPara || outMessageBasic.type === "adversarial") ? "" : "@undefined") + "\n" +
                "            and transition " + toState
              );
            }
  
            if (toState) {
              if (thisTransition.toStateArguments.length > 0) {
  
                thisTransition.toStateArguments.forEach((param, idx, arr) => {
                  if (idx === arr.length - 1) {
                    if (arr.length === 1) {
                      finalString += (
                        "(" + param.argValue + ").\n" +
                        "        }\n" 
                      );
                    } else {
                      finalString += (
                        param.argValue + ").\n" +
                        "        }\n\n" 
                      );
                    }
                    
                  } else if (idx === 0) {
                    finalString += (
                      "(" + param.argValue + ", "
                    );
                  } else {
                    finalString += (
                      param.argValue + ", "
                    );
                  } 
                })
              } else {
                finalString += ".\n        }\n\n"
              }
            } 
          }
        });
  
        finalString += (
          "\n        | * => { fail. }\n" +
          "      end\n" +
          "    }\n\n"
          );
      }

      // add other state's code
      if (thisStateMachine) {
        thisStateMachine.states.filter(element => element !== thisStateMachine.initState).forEach(state => { // for each state that is not the initState
          let thisState = stateMachineSelector.states.find(element => element.id === state);
          let thisStateTransitionArray = thisStateMachineTransitionArray.filter(element => element.fromState === thisState.id);
          let thisStateInMessageArray = [];
          let thisStateInMessageInfo = {};
  
          if('comment' in thisState){
            if(thisState.comment.length > 70){
              finalString += "    (* " +commentBreaker(thisState.comment, 70, 3) + "\n     *)\n"
            }
            else if(thisState.comment.length >0){
              finalString += "    (* " +thisState.comment + " *)\n"
            }
          }
          finalString += (
            "    state " + thisState.name 
          );
            
          thisState.parameters.forEach((param, idx, arr) => {
            if (idx === arr.length - 1) {
              if (arr.length === 1) {
                finalString += (
                  "(" + param.name + " : " + param.type + ")"
                );
              } else {
                finalString += (
                  param.name + " : " + param.type + ")"
                );
              }  
            } else if (idx === 0) {
              finalString += (
                "(" + param.name + " : " + param.type + ", "
              );
            } else {
              finalString += (
                param.name + " : " + param.type + ", "
              );
            }
          });
  
          finalString += (
            " {\n" +
            "      match message with\n"
          );
  
          thisStateTransitionArray.forEach(transition => {
            if (thisStateInMessageInfo[transition.inMessage]) {
              thisStateInMessageInfo[transition.inMessage].push(transition);
            } else {
              thisStateInMessageArray.push(transition.inMessage);
              thisStateInMessageInfo[transition.inMessage] = [transition];
            }
          });
          
          thisStateInMessageArray.forEach(currentInMessage => {
            // Determine if single transition guard code is needed
            // For this message, determine if any transitions include guard code
            let singleTransitionGuard = false;
            thisStateTransitionArray.forEach(transition => {
              if (transition.inMessage === currentInMessage && transition.guard !== "") {
                singleTransitionGuard = true;
              }
            });
            // Guard Code
            if (thisStateInMessageInfo[currentInMessage].length > 1) {
              // In Message Info
              let inMessage = "";
              let inMessageBasic = "";
              let inMessageComp = "";
              let inMessageBasicInstance = "";
              let inMessageTrace = "";
              if (subFuncMessages.find(element => element.id === currentInMessage)) {
                inMessage = subFuncMessages.find(element => element.id === currentInMessage);
                inMessageComp = inMessage.compInter;
                inMessageBasicInstance = inMessage.compInter.basicInterfaces.find(element => element.idOfBasic === inMessage.basicInter.id);
                let thisSubFunc = subfuncSelector.subfunctionalities.find(element => element.id === subFuncMessages.find(element => element.id === currentInMessage).subfuncId) || { "name" : "" };
                inMessageTrace = thisSubFunc.name + "." + inMessageBasicInstance.name + "." + inMessage.name;
              } else if (paramInterMessages.find(element => element.id === currentInMessage)) {
                inMessage = paramInterMessages.find(element => element.id === currentInMessage);
                inMessageComp = inMessage.compInter;
                inMessageBasicInstance = inMessage.compInter.basicInterfaces.find(element => element.idOfBasic === inMessage.basicInter.id);
                let thisParamInter = realFuncSelector.parameterInterfaces.find(element => element.id === paramInterMessages.find(element => element.id === currentInMessage).paramInterId) || { "name" : "" };
                inMessageTrace = thisParamInter.name + "." + inMessageBasicInstance.name + "." + inMessage.name;
              } else {
                inMessage = interSelector.messages.find(element => element.id === currentInMessage) || "";

                interSelector.basicInters.forEach((basic) => {
                  basic.messages.forEach((message) => {
                    if (message === inMessage.id) {
                      inMessageBasic = basic;
                    }
                  })
                });

                inMessageComp = interSelector.compInters.find(element => element.basicInterfaces.find(element => element.idOfBasic === inMessageBasic.id)) || "";
                if (inMessageComp) {
                  inMessageBasicInstance = inMessageComp.basicInterfaces.find(element => element.idOfBasic === inMessageBasic.id) || "";  
                }  
                inMessageTrace = inMessageComp.name + "." + inMessageBasicInstance.name + "." + inMessage.name;
              }
      
                let receiveArguments = "";
                if (currentInMessage) {
                  let parameters = [];
                  if (subFuncMessages.find(element => element.id === currentInMessage)) {
                    parameters = subFuncMessages.find(element => element.id === currentInMessage).parameters;
                  } else if (paramInterMessages.find(element => element.id === currentInMessage)) {
                    parameters = paramInterMessages.find(element => element.id === currentInMessage).parameters;
                  } else if (interSelector.messages.find(element => element.id === currentInMessage)) {
                    parameters = interSelector.messages.find(element => element.id === currentInMessage).parameters;
                  }
                  parameters.forEach((param, idx, arr) => {
                    if (idx === arr.length - 1) {
                      if (arr.length === 1) {
                        receiveArguments += (
                          "(" + param.name + ")"
                        );
                      } else {
                        receiveArguments += (
                          param.name + ")"
                        );
                      }
                    } else if (idx === 0) {
                      receiveArguments += (
                        "(" + param.name + ", "
                      );
                    } else {
                      receiveArguments += (
                        param.name + ", "
                      );
                    }
                  })
                }
                if (subFuncMessages.find(element => element.id === currentInMessage) || 
                    (paramInterMessages.find(element => element.id === currentInMessage))) {
                  finalString +=  "        | " + inMessageTrace + receiveArguments + " => {\n"
                } else {
                  finalString +=  "        | " + ((inMessage.port) ? (inMessage.port + "@") : (inMessageBasic.type === "adversarial") ? "" : "undefined@") + inMessageTrace + receiveArguments + " => {\n"
                }
                finalString += (
                  "        (* The below 'if else' branches represent Guards in the UCDSL\n" + 
                  "         * Guards are used to differentiate transitions that may have\n" +
                  "         * identical 'from' states and 'in' messages *)\n"
                )
                // Code for each transition
                thisStateInMessageInfo[currentInMessage].forEach((transition, idx, arr) => {
                  if (idx === 0) {
                    finalString += (
                      "          if (" + (transition.guard) +") { \n"
                    );
                  } else {
                    finalString += (
                      " elif (" + (transition.guard) + ") { \n"
                    )
                  }
      
                  // Out Message Info
                  let outMessage ="";
                  let outMessageBasic = "";
                  let outMessageComp = "";
                  let outMessageBasicInstance = "";
                  let outMessageTrace = "";
                  let outMessageIsSubOrPara = false;
                  if (subFuncMessages.find(element => element.id === transition.outMessage)) {
                    outMessage = subFuncMessages.find(element => element.id === transition.outMessage);
                    outMessageComp = outMessage.compInter;
                    outMessageBasicInstance = outMessage.compInter.basicInterfaces.find(element => element.idOfBasic === outMessage.basicInter.id);
                    let thisSubFunc = subfuncSelector.subfunctionalities.find(element => element.id === subFuncMessages.find(element => element.id === transition.outMessage).subfuncId) || { "name" : "" };
                    outMessageTrace = thisSubFunc.name + "." + outMessageBasicInstance.name + "." + outMessage.name;
                    outMessageIsSubOrPara = true;
                  } else if (paramInterMessages.find(element => element.id === transition.outMessage)) {
                    outMessage = paramInterMessages.find(element => element.id === transition.outMessage);
                    outMessageComp = outMessage.compInter;
                    outMessageBasicInstance = outMessage.compInter.basicInterfaces.find(element => element.idOfBasic === outMessage.basicInter.id);
                    let thisParamInter = realFuncSelector.parameterInterfaces.find(element => element.id === paramInterMessages.find(element => element.id === transition.outMessage).paramInterId) || { "name" : "" };
                    outMessageTrace = thisParamInter.name + "." + outMessageBasicInstance.name + "." + outMessage.name;
                    outMessageIsSubOrPara = true;
                  } else {
                    outMessage = interSelector.messages.find(element => element.id === transition.outMessage) || "";
                  
                    outMessageBasic = "";
                    interSelector.basicInters.forEach((basic) => {
                      basic.messages.forEach((message) => {
                        if (message === outMessage.id) {
                          outMessageBasic = basic;
                        }
                      })
                    })
        
                    outMessageComp = interSelector.compInters.find(element => element.basicInterfaces.find(element => element.idOfBasic === outMessageBasic.id)) || "";
                    outMessageBasicInstance = "";
                    if (outMessageComp) {
                      outMessageBasicInstance = outMessageComp.basicInterfaces.find(element => element.idOfBasic === outMessageBasic.id) || "";
                    }
        
                    outMessageTrace = outMessageComp.name + "." + outMessageBasicInstance.name + "." + outMessage.name;
                  }
      
                  let toState = "";
                  if (stateMachineSelector.states.find(element => element.id === transition.toState)) {
                    toState = stateMachineSelector.states.find(element => element.id === transition.toState).name
                  }
      
                  let sendArguments = "";
                  if (transition.outMessage) {
                    transition.outMessageArguments.forEach((arg, idx, arr) => {
                      if (idx === arr.length - 1) {
                        if (arr.length === 1) {
                          sendArguments += (
                            "(" + arg.argValue + ")"
                          );
                        } else {
                          sendArguments += (
                            arg.argValue + ")"
                          );
                        }
                      } else if (idx === 0) {
                        sendArguments += (
                          "(" + arg.argValue + ", "
                        );
                      } else {
                        sendArguments += (
                          arg.argValue + ", "
                        );
                      }
                    })
                  }

                  let nameComment = genTransitionNameComment(transition, "             ");
      
                  finalString += ( 
                    nameComment +
                    "             send " + outMessageTrace + sendArguments + ((transition.targetPort) ? ("@" + transition.targetPort) : (outMessageIsSubOrPara || outMessageBasic.type === "adversarial") ? "" : "@undefined") + "\n" +
                    "             and transition " + toState           
                  );
      
                  if (toState) {
                    if (transition.toStateArguments.length > 0) {
      
                      transition.toStateArguments.forEach((param, idx, arr) => {
                        if (idx === arr.length - 1) {
                          if (arr.length === 1) {
                            finalString += (
                              "(" + param.argValue + ")"
                            );
                          } else {
                            finalString += (
                              param.argValue + ")" 
                            );
                          }
                          
                        } else if (idx === 0) {
                          finalString += (
                            "(" + param.argValue + ", "
                          );
                        } else {
                          finalString += (
                            param.argValue + ", "
                          );
                        } 
                      })
                    }
                  }
                  finalString += ".\n          }" 
                  
                  if (idx === arr.length - 1) {
                    finalString += " else { fail. }\n"
                  }
                });
                finalString += "        }\n\n"
                
              } else if (singleTransitionGuard) { // Guard code for single transitions
                let transition = thisStateTransitionArray.find(transition => transition.inMessage === currentInMessage)
                // In Message Info
                let inMessage ="";
                let inMessageBasic = "";
                let inMessageComp = "";
                let inMessageBasicInstance = "";
                let inMessageTrace = "";
                if (subFuncMessages.find(element => element.id === currentInMessage)) {
                  inMessage = subFuncMessages.find(element => element.id === currentInMessage);
                  inMessageComp = inMessage.compInter;
                  inMessageBasicInstance = inMessage.compInter.basicInterfaces.find(element => element.idOfBasic === inMessage.basicInter.id);
                  let thisSubFunc = subfuncSelector.subfunctionalities.find(element => element.id === subFuncMessages.find(element => element.id === currentInMessage).subfuncId) || { "name" : "" };
                  inMessageTrace = thisSubFunc.name + "." + inMessageBasicInstance.name + "." + inMessage.name;
                } else if (paramInterMessages.find(element => element.id === currentInMessage)) {
                  inMessage = paramInterMessages.find(element => element.id === currentInMessage);
                  inMessageComp = inMessage.compInter;
                  inMessageBasicInstance = inMessage.compInter.basicInterfaces.find(element => element.idOfBasic === inMessage.basicInter.id);
                  let thisParamInter = realFuncSelector.parameterInterfaces.find(element => element.id === paramInterMessages.find(element => element.id === currentInMessage).paramInterId) || { "name" : "" };
                  inMessageTrace = thisParamInter.name + "." + inMessageBasicInstance.name + "." + inMessage.name;
                } else {
                  inMessage = interSelector.messages.find(element => element.id === currentInMessage) || "";

                  interSelector.basicInters.forEach((basic) => {
                    basic.messages.forEach((message) => {
                      if (message === inMessage.id) {
                        inMessageBasic = basic;
                      }
                    })
                  });

                  inMessageComp = interSelector.compInters.find(element => element.basicInterfaces.find(element => element.idOfBasic === inMessageBasic.id)) || "";
                  if (inMessageComp) {
                    inMessageBasicInstance = inMessageComp.basicInterfaces.find(element => element.idOfBasic === inMessageBasic.id) || "";  
                  }  
                  inMessageTrace = inMessageComp.name + "." + inMessageBasicInstance.name + "." + inMessage.name;
                }
      
      
                let receiveArguments = "";
                if (currentInMessage) {
                  let parameters = [];
                  if (subFuncMessages.find(element => element.id === currentInMessage)) {
                    parameters = subFuncMessages.find(element => element.id === currentInMessage).parameters;
                  } else if (paramInterMessages.find(element => element.id === currentInMessage)) {
                    parameters = paramInterMessages.find(element => element.id === currentInMessage).parameters;
                  } else if (interSelector.messages.find(element => element.id === currentInMessage)) {
                    parameters = interSelector.messages.find(element => element.id === currentInMessage).parameters;
                  }
                  parameters.forEach((param, idx, arr) => {
                    if (idx === arr.length - 1) {
                      if (arr.length === 1) {
                        receiveArguments += (
                          "(" + param.name + ")"
                        );
                      } else {
                        receiveArguments += (
                          param.name + ")"
                        );
                      }
                    } else if (idx === 0) {
                      receiveArguments += (
                        "(" + param.name + ", "
                      );
                    } else {
                      receiveArguments += (
                        param.name + ", "
                      );
                    }
                  })
                }
                if (subFuncMessages.find(element => element.id === currentInMessage) || 
                    (paramInterMessages.find(element => element.id === currentInMessage))) {
                  finalString +=  "        | " + inMessageTrace + receiveArguments + " => {\n"
                } else {
                  finalString +=  "        | " + ((inMessage.port) ? (inMessage.port + "@") : (inMessageBasic.type === "adversarial") ? "" : "undefined@") + inMessageTrace + receiveArguments + " => {\n"
                }
                finalString += "        (* The below 'if else' branches represent Guards in the UCDSL *)\n"
                  
                
                // Code for the transition
                let nameComment = genTransitionNameComment(transition, "         ");
                finalString += nameComment;
                finalString += (
                  "          if (" + (transition.guard) +") { \n"
                );

                // Out Message Info
                let outMessage ="";
                let outMessageBasic = "";
                let outMessageComp = "";
                let outMessageBasicInstance = "";
                let outMessageTrace = "";
                let outMessageIsSubOrPara = false;
                if (subFuncMessages.find(element => element.id === transition.outMessage)) {
                  outMessage = subFuncMessages.find(element => element.id === transition.outMessage);
                  outMessageComp = outMessage.compInter;
                  outMessageBasicInstance = outMessage.compInter.basicInterfaces.find(element => element.idOfBasic === outMessage.basicInter.id);
                  let thisSubFunc = subfuncSelector.subfunctionalities.find(element => element.id === subFuncMessages.find(element => element.id === transition.outMessage).subfuncId) || { "name" : "" };
                  outMessageTrace = thisSubFunc.name + "." + outMessageBasicInstance.name + "." + outMessage.name;
                  outMessageIsSubOrPara = true;
                } else if (paramInterMessages.find(element => element.id === transition.outMessage)) {
                  outMessage = paramInterMessages.find(element => element.id === transition.outMessage);
                  outMessageComp = outMessage.compInter;
                  outMessageBasicInstance = outMessage.compInter.basicInterfaces.find(element => element.idOfBasic === outMessage.basicInter.id);
                  let thisParamInter = realFuncSelector.parameterInterfaces.find(element => element.id === paramInterMessages.find(element => element.id === transition.outMessage).paramInterId) || { "name" : "" };
                  outMessageTrace = thisParamInter.name + "." + outMessageBasicInstance.name + "." + outMessage.name;
                  outMessageIsSubOrPara = true;
                } else {
                  outMessage = interSelector.messages.find(element => element.id === transition.outMessage) || "";
                
                  outMessageBasic = "";
                  interSelector.basicInters.forEach((basic) => {
                    basic.messages.forEach((message) => {
                      if (message === outMessage.id) {
                        outMessageBasic = basic;
                      }
                    })
                  })
      
                  outMessageComp = interSelector.compInters.find(element => element.basicInterfaces.find(element => element.idOfBasic === outMessageBasic.id)) || "";
                  outMessageBasicInstance = "";
                  if (outMessageComp) {
                    outMessageBasicInstance = outMessageComp.basicInterfaces.find(element => element.idOfBasic === outMessageBasic.id) || "";
                  }
      
                  outMessageTrace = outMessageComp.name + "." + outMessageBasicInstance.name + "." + outMessage.name;
                }

                let toState = "";
                if (stateMachineSelector.states.find(element => element.id === transition.toState)) {
                  toState = stateMachineSelector.states.find(element => element.id === transition.toState).name
                }

                let sendArguments = "";
                if (transition.outMessage) {
                  transition.outMessageArguments.forEach((arg, idx, arr) => {
                    if (idx === arr.length - 1) {
                      if (arr.length === 1) {
                        sendArguments += (
                          "(" + arg.argValue + ")"
                        );
                      } else {
                        sendArguments += (
                          arg.argValue + ")"
                        );
                      }
                    } else if (idx === 0) {
                      sendArguments += (
                        "(" + arg.argValue + ", "
                      );
                    } else {
                      sendArguments += (
                        arg.argValue + ", "
                      );
                    }
                  })
                }


                finalString += ( 
                  "             send " + outMessageTrace + sendArguments + ((transition.targetPort) ? ("@" + transition.targetPort) : (outMessageIsSubOrPara || outMessageBasic.type === "adversarial") ? "" : "@undefined") + "\n" +
                  "             and transition " + toState           
                );

                if (toState) {
                  if (transition.toStateArguments.length > 0) {

                    transition.toStateArguments.forEach((param, idx, arr) => {
                      if (idx === arr.length - 1) {
                        if (arr.length === 1) {
                          finalString += (
                            "(" + param.argValue + ")"
                          );
                        } else {
                          finalString += (
                            param.argValue + ")"
                          );
                        }
                        
                      } else if (idx === 0) {
                        finalString += (
                          "(" + param.argValue + ", "
                        );
                      } else {
                        finalString += (
                          param.argValue + ", "
                        );
                      } 
                    })
                  }
                }
                finalString += ".\n" 
                finalString += (
                  "          } else {\n"
                );
                finalString += (
                  "             fail.\n          }\n"
                );
                finalString += "        }\n\n"
            } else {
              // Normal transition code
              let thisTransition = thisStateInMessageInfo[currentInMessage][0];
    
              // In Message Info
              let inMessage ="";
              let inMessageBasic = "";
              let inMessageComp = "";
              let inMessageBasicInstance = "";
              let inMessageTrace = "";
              if (subFuncMessages.find(element => element.id === currentInMessage)) {
                inMessage = subFuncMessages.find(element => element.id === currentInMessage);
                inMessageComp = inMessage.compInter;
                inMessageBasicInstance = inMessage.compInter.basicInterfaces.find(element => element.idOfBasic === inMessage.basicInter.id);
                let thisSubFunc = subfuncSelector.subfunctionalities.find(element => element.id === subFuncMessages.find(element => element.id === currentInMessage).subfuncId) || { "name" : "" }; 
                inMessageTrace = thisSubFunc.name + "." + inMessageBasicInstance.name + "." + inMessage.name;
              } else if (paramInterMessages.find(element => element.id === currentInMessage)) {
                inMessage = paramInterMessages.find(element => element.id === currentInMessage);
                inMessageComp = inMessage.compInter;
                inMessageBasicInstance = inMessage.compInter.basicInterfaces.find(element => element.idOfBasic === inMessage.basicInter.id);
                let thisParamInter = realFuncSelector.parameterInterfaces.find(element => element.id === paramInterMessages.find(element => element.id === currentInMessage).paramInterId) || { "name" : "" };
                inMessageTrace = thisParamInter.name + "." + inMessageBasicInstance.name + "." + inMessage.name;
              } else {
                inMessage = interSelector.messages.find(element => element.id === currentInMessage) || "";

                interSelector.basicInters.forEach((basic) => {
                  basic.messages.forEach((message) => {
                    if (message === inMessage.id) {
                      inMessageBasic = basic;
                    }
                  })
                });

                inMessageComp = interSelector.compInters.find(element => element.basicInterfaces.find(element => element.idOfBasic === inMessageBasic.id)) || "";
                if (inMessageComp) {
                  inMessageBasicInstance = inMessageComp.basicInterfaces.find(element => element.idOfBasic === inMessageBasic.id) || "";  
                }  
                inMessageTrace = inMessageComp.name + "." + inMessageBasicInstance.name + "." + inMessage.name;
              }
    
              // Out Message Info
              let outMessage ="";
              let outMessageBasic = "";
              let outMessageComp = "";
              let outMessageBasicInstance = "";
              let outMessageTrace = "";
              let outMessageIsSubOrPara = false;
              if (subFuncMessages.find(element => element.id === thisTransition.outMessage)) {
                outMessage = subFuncMessages.find(element => element.id === thisTransition.outMessage);
                outMessageComp = outMessage.compInter;
                outMessageBasicInstance = outMessage.compInter.basicInterfaces.find(element => element.idOfBasic === outMessage.basicInter.id);
                let thisSubFunc = subfuncSelector.subfunctionalities.find(element => element.id === subFuncMessages.find(element => element.id === thisTransition.outMessage).subfuncId) || { "name" : "" };
                outMessageTrace = thisSubFunc.name + "." + outMessageBasicInstance.name + "." + outMessage.name;
                outMessageIsSubOrPara = true;
              } else if (paramInterMessages.find(element => element.id === thisTransition.outMessage)) {
                outMessage = paramInterMessages.find(element => element.id === thisTransition.outMessage);
                outMessageComp = outMessage.compInter;
                outMessageBasicInstance = outMessage.compInter.basicInterfaces.find(element => element.idOfBasic === outMessage.basicInter.id);
                let thisParamInter = realFuncSelector.parameterInterfaces.find(element => element.id === paramInterMessages.find(element => element.id === thisTransition.outMessage).paramInterId) || { "name" : "" };
                outMessageTrace = thisParamInter.name + "." + outMessageBasicInstance.name + "." + outMessage.name;
                outMessageIsSubOrPara = true;
              } else {
                outMessage = interSelector.messages.find(element => element.id === thisTransition.outMessage) || "";
              
                outMessageBasic = "";
                interSelector.basicInters.forEach((basic) => {
                  basic.messages.forEach((message) => {
                    if (message === outMessage.id) {
                      outMessageBasic = basic;
                    }
                  })
                })
    
                outMessageComp = interSelector.compInters.find(element => element.basicInterfaces.find(element => element.idOfBasic === outMessageBasic.id)) || "";
                outMessageBasicInstance = "";
                if (outMessageComp) {
                  outMessageBasicInstance = outMessageComp.basicInterfaces.find(element => element.idOfBasic === outMessageBasic.id) || "";
                }
    
                outMessageTrace = outMessageComp.name + "." + outMessageBasicInstance.name + "." + outMessage.name;
              }
    
              let toState = "";
              if (stateMachineSelector.states.find(element => element.id === thisTransition.toState)) {
                toState = stateMachineSelector.states.find(element => element.id === thisTransition.toState).name
              }
    
              let sendArguments = "";
              if (thisTransition.outMessage) {
                thisTransition.outMessageArguments.forEach((arg, idx, arr) => {
                  if (idx === arr.length - 1) {
                    if (arr.length === 1) {
                      sendArguments += (
                        "(" + arg.argValue + ")"
                      );
                    } else {
                      sendArguments += (
                        arg.argValue + ")"
                      );
                    }
                  } else if (idx === 0) {
                    sendArguments += (
                      "(" + arg.argValue + ", "
                    );
                  } else {
                    sendArguments += (
                      arg.argValue + ", "
                    );
                  }
                })
              }
    
              let receiveArguments = "";
              if (thisTransition.inMessage) {
                let parameters = [];
                if (subFuncMessages.find(element => element.id === thisTransition.inMessage)) {
                  parameters = subFuncMessages.find(element => element.id === thisTransition.inMessage).parameters;
                } else if (paramInterMessages.find(element => element.id === thisTransition.inMessage)) {
                  parameters = paramInterMessages.find(element => element.id === thisTransition.inMessage).parameters;
                } else if (interSelector.messages.find(element => element.id === thisTransition.inMessage)) {
                  parameters = interSelector.messages.find(element => element.id === thisTransition.inMessage).parameters;
                }
                parameters.forEach((param, idx, arr) => {
                  if (idx === arr.length - 1) {
                    if (arr.length === 1) {
                      receiveArguments += (
                        "(" + param.name + ")"
                      );
                    } else {
                      receiveArguments += (
                        param.name + ")"
                      );
                    }
                  } else if (idx === 0) {
                    receiveArguments += (
                      "(" + param.name + ", "
                    );
                  } else {
                    receiveArguments += (
                      param.name + ", "
                    );
                  }
                })
              }

              let nameComment = genTransitionNameComment(thisTransition, "            ");

              if (subFuncMessages.find(element => element.id === currentInMessage) || 
                  (paramInterMessages.find(element => element.id === currentInMessage))) {
                finalString += (
                  "        | " + inMessageTrace + receiveArguments + " => {\n" +
                  nameComment +
                  "            send " + outMessageTrace + sendArguments + ((thisTransition.targetPort) ? ("@" + thisTransition.targetPort) : (outMessageIsSubOrPara || outMessageBasic.type === "adversarial") ? "" : "@undefined") + "\n" +
                  "            and transition " + toState
                );
              } else {
                finalString += (
                  "        | " + ((inMessage.port) ? (inMessage.port + "@") : (inMessageBasic.type === "adversarial") ? "" : "undefined@") + inMessageTrace + receiveArguments + " => {\n" +
                  nameComment +
                  "            send " + outMessageTrace + sendArguments + ((thisTransition.targetPort) ? ("@" + thisTransition.targetPort) : (outMessageIsSubOrPara || outMessageBasic.type === "adversarial") ? "" : "@undefined") + "\n" +
                  "            and transition " + toState
                );
              }
    
              if (toState) {
                if (thisTransition.toStateArguments.length > 0) {
    
                  thisTransition.toStateArguments.forEach((param, idx, arr) => {
                    if (idx === arr.length - 1) {
                      if (arr.length === 1) {
                        finalString += (
                          "(" + param.argValue + ").\n" +
                          "        }\n" 
                        );
                      } else {
                        finalString += (
                          param.argValue + ").\n" +
                          "        }\n\n" 
                        );
                      }
                      
                    } else if (idx === 0) {
                      finalString += (
                        "(" + param.argValue + ", "
                      );
                    } else {
                      finalString += (
                        param.argValue + ", "
                      );
                    } 
                  })
                } else {
                  finalString += ".\n        }\n\n"
                }
              } 
            }
          });
    
          finalString += (
            "\n        | * => { fail. }\n" +
            "      end\n" +
            "    }\n\n"
            );
  
  
  
        });
      }
      
      finalString +=  "  }\n\n"
    });

    finalString += "}\n\n";

    return finalString;
  }

  const requiresCodeConstructor = () => {
    let finalString = "";
    if (subfuncSelector.subfunctionalities.length > 0) {
      finalString += ("(* You have made use of other models in this model. You must include the following:\n" +
        " * uc_requires "
        );

      subfuncSelector.subfunctionalities.forEach((subfunc, idx, arr) => {
          let fileName = subfunc.idealFuncModel ? subfunc.idealFuncModel : "FILENAME"
          if (idx === arr.length - 1) {
            if (realFuncSelector.parameterInterfaces) { 
              realFuncSelector.parameterInterfaces.forEach((paramInter) => {
                let paramInterName = paramInter.modelName ? paramInter.modelName : "FILENAME"
                finalString += paramInterName + " "
              });
            }
            finalString += fileName
          } else {
            finalString += fileName + " "
          }
      });
      
      finalString += ".\n *)\n\n";
    } else if (realFuncSelector.parameterInterfaces && realFuncSelector.parameterInterfaces.length > 0) {
      finalString += ("(* You have made use of other models in this model. You must include the following:\n" +
        " * uc_requires "
        );
      
        realFuncSelector.parameterInterfaces.forEach((paramInter, idx, arr) => {
          let fileName = paramInter.modelName ? paramInter.modelName : "FILENAME"
          if (idx === arr.length - 1) {
            finalString += fileName
          } else {
            finalString += fileName + " "
          }
        });
      
      finalString += ".\n *)\n\n";
    }    
    
    return finalString;
  }

  // this function will concatenate all of the prior code that has been made
  // the value of this function will be returned as the value to be displayed in the editor
  const finalCodeConstructor = () => {
    let finalCode = "";
    let realFuncActive = false;
    finalCode = requiresCodeConstructor();
    finalCode += interCodeConstructor();
    if (partySelector.parties.length || subfuncSelector.subfunctionalities.length) {
      realFuncActive = true;
      finalCode += realFuncCodeConstructor();
    }
    finalCode += idealFuncCodeConstructor();
    if (simSelector.basicAdversarialInterface && realFuncActive) {
      finalCode += simulatorCodeConstructor();
    }
    return finalCode;
  }

    return (
      <div>
        <Button className="copyCode" onClick={() => copyCode(finalCodeConstructor())} 
                title="Copy code to clipboard" variant={isLight ? "dark": "light"}>
          <FontAwesomeIcon className="copyIcon" data-testid="copyIcon" icon={faCopy} />
        </Button>
        <Button className="exportCode" onClick={() => exportCode(finalCodeConstructor())} 
                title="Export code to file" variant={isLight ? "dark": "light"}>
          <FontAwesomeIcon className="exportIcon" data-testid="exportIcon" icon={faFileArrowDown} />
        </Button>
        <Button className="changeTheme" onClick={() => changeIsLight(!isLight)} 
                title={isLight ? "Change to Light": "Change to Dark"} variant={isLight ? "dark": "light"}>
          <FontAwesomeIcon className="changeThemeIcon" data-testid="changeThemeIcon" icon={faPaintBrush} />
        </Button>
        <AceEditor style={{height: '750px', width: '700px'}}
            placeholder="Code is autogenerated as the model is built"
            ref={ editorRef }
            mode="jsx"
            theme={isLight ? "pastel_on_dark" : "chrome"}
            name="ucDSLEditor"
            fontSize={14}
            focus="true"
            showPrintMargin={true}
            showGutter={true}
            highlightActiveLine={true}
            value={finalCodeConstructor()}
            setOptions={{
            enableBasicAutocompletion: true,
            enableLiveAutocompletion: true,
            enableSnippets: false,
            showLineNumbers: true,
            tabSize: 2,
            readOnly: true,
            }}
        />
      </div>
    );
}

export default CodeGenerator
