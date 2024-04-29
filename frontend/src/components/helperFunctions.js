import { Store } from "react-notifications-component";

export function DisplayNameSetup(name, readLength){   
    if(name.length > readLength){
        return `${name.substring(0,readLength)}...`
    }else{
        return name;
    }
}

export function upperCaseValidation(checkString, printNoti=true, messageConcat=" NAME DID NOT SAVE"){
    const upperRegex = /^(?!UC_)(?!.*__)(?!.*[^A-Za-z'_0-9])(?!.*_$)[A-Z][A-Za-z'_0-9]*/
    // ^(?!UC_) Does not start with UC_
    // (?!.*__) does not have a double __
    // (?!.*[^A-Za-z'_0-9]) does not allow non-alphanumeric characters except ' and _
    // (?!.*_$) does not end with a _
    // [A-Z] First character is a Capital and must be there
    // [A-Za-z'_0-9]* Usable characters in the string can have 0 to many
    if(checkString === "" || checkString === null){
        return true
    }
    let notiTitle = checkString.concat(" Name Check Failure")
    let notiMessage = "Message: "
    let notiType = 'danger'
    let theCheck = upperRegex.test(checkString)
    if(theCheck){
        return theCheck
        
    }  else {
        if(printNoti){
            notiMessage = upperCaseInvalidMessage(checkString)
            notiMessage = notiMessage.concat(messageConcat)
            
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
       return theCheck
    }
    

}

export function lowerCaseValidation(checkString, printNoti=true){
    const lowerRegex = /^(?!uc_)(?!.*__)(?!.*[^A-Za-z'_0-9])(?!.*_$)[a-z][A-Za-z'_0-9]*/
    // ^(?!uc_) Does not start with uc_
    // (?!.*__) does not have a double __
    // (?!.*[^A-Za-z'_0-9]) does not allow non-alphanumeric characters except ' and _
    // (?!.*_$) does not end with a _
    // [a-z] First character is a lowercase letter
    // [A-Za-z'_0-9]* Usable characters in the string can have 0 to many
    if(checkString === "" || checkString === null){
        return true
    }
    let notiTitle = checkString.concat(" Name Check Failure")
    let notiMessage = "Message: "
    let notiType = 'danger'
    let theCheck = lowerRegex.test(checkString)
    if(theCheck){
        return theCheck
        
    }  else {
        if(printNoti){
            notiMessage = lowerCaseInvalidMessage(checkString)
            notiMessage = notiMessage + " Name did not Save"
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
        
       return theCheck
    }
}
export function upperCaseInvalidMessage(checkString){
    let notiMessage = "Message: "
    const regexCheckUCLead = /^(?!UC_)/
        if(!regexCheckUCLead.test(checkString)){
            notiMessage = notiMessage.concat(" Cannot start the name of this entity with UC_\n")
        }
        const regexCheckUpperLead = /^[A-Z]/
        if(!regexCheckUpperLead.test(checkString)){
            notiMessage = notiMessage.concat(
                " Name of this entity must start with an uppercase letter\n")
        }
        const regexDoubleUnderScore = /__/
        if(regexDoubleUnderScore.test(checkString)){
            notiMessage = notiMessage.concat(" Name cannot contain 2 consecutive underscores '__'\n")
        }
        const regexContains = /[^A-Za-z'_0-9]/
        if(regexContains.test(checkString)){
            notiMessage = notiMessage.concat(
                " Name cannot contain non-alpha numeric characters except for ' and _\n")
        }
        const regexUnderScoreEnd = /_$/
        if(regexUnderScoreEnd.test(checkString)){
            notiMessage = notiMessage.concat(
                " Name cannot end in an _\n")
        }
        return notiMessage
}
export function lowerCaseInvalidMessage(checkString){
    let notiMessage = "Message: "
    const regexCheckUCLead = /^(?!uc_)/
    if(!regexCheckUCLead.test(checkString)){
        notiMessage = notiMessage.concat(" Cannot start the name of this entity with uc_\n")
    }
    const regexCheckLowerLead = /^[a-z]/
    if(!regexCheckLowerLead.test(checkString)){
        notiMessage = notiMessage.concat(
            " Name of this entity must start with an lowercase letter\n")
    }
    const regexDoubleUnderScore = /__/
    if(regexDoubleUnderScore.test(checkString)){
        notiMessage = notiMessage.concat(" Name cannot contain 2 consecutive underscores '__'\n")
    }
    const regexContains = /[^A-Za-z'_0-9]/
    if(regexContains.test(checkString)){
        notiMessage = notiMessage.concat(
            " Name cannot contain non-alpha numeric characters except for ' and _\n")
    }
    const regexUnderScoreEnd = /_$/
    if(regexUnderScoreEnd.test(checkString)){
        notiMessage = notiMessage.concat(" Name cannot end in an _\n")
    }
    return notiMessage
}
