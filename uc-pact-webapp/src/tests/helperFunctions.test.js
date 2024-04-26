import { DisplayNameSetup, lowerCaseInvalidMessage, lowerCaseValidation, upperCaseInvalidMessage, upperCaseValidation } from "../components/helperFunctions";
import { ReactNotifications, Store } from 'react-notifications-component';
import 'react-notifications-component/dist/theme.css'
import { render } from '@testing-library/react';
import { act } from "react-dom/test-utils";

it('Tests the DisplayNameSetup for interfaces', () => {
        
    let tempName28Chars = "1234567890123456789012345678"
    let tempName20Chars = "12345678901234567890"
    let tempName40Chars = "1234567890123456789012345678901234567890"
    let maxCharLength = 28

    let testName1 = DisplayNameSetup(tempName28Chars, maxCharLength);
    let testName2 = DisplayNameSetup(tempName20Chars, maxCharLength);
    let testName3 = DisplayNameSetup(tempName40Chars, maxCharLength);
    let testName4 = tempName28Chars.concat("...")

    expect(testName1 ).toBe(tempName28Chars)
    expect(testName2 ).toBe(tempName20Chars)
    expect(testName3).toBe(testName4)
});
it("Test to ensure that the uppercase validation is working properly",() => {
    render(<ReactNotifications/>) // Needed for the function to add the notification to work properly
    let successText = "This_is_Valid"
    let blankString = ""
    let failText = ["UC_INVALID", "INVALID__2", "Invalid 3", "invalid_4",
                    "Invalid_5_", "Invalid()", "Invalid**wabc!!", "-nvalid_6",
                    "Inva!lid_7", "Invalid_8$", "9nvalid_9"];

    expect(upperCaseValidation(successText)).toBe(true);
    expect(upperCaseValidation(blankString)).toBe(true);
    // Failure Cases
    // May want to add checks that the notification message is returned properly
    act(() => {
      for (const element of failText) {
        expect(upperCaseValidation(element)).toBe(false);
      }
    })
});

it("Test to ensure that the lowercase validation is working properly",() => {
    render(<ReactNotifications/>) // Needed for the function to add the notification to work properly
    let successText = "this_is_Valid"
    let blankString = ""
    let failText = ["uc_INVALID", "iNVALID__2", "invalid 3", "Invalid_4",
                    "invalid_5_", "invalid()", "invalid**wabc!!", "-nvalid_6",
                    "inva!lid_7", "invalid_8$", "9nvalid_9"];


    expect(lowerCaseValidation(successText)).toBe(true);
    expect(lowerCaseValidation(blankString)).toBe(true);
    // Failure Cases
    // May want to add checks that the notification message is returned properly
    act( () => {
      for (const element of failText) {
        expect(lowerCaseValidation(element)).toBe(false);
      }
    })
});

it("Test to ensure that the lowercase validation message is working correctly",() => {
  
  let failText = ["uc_INVALID", "INVALID_2", "invalid__3", "inva!lid_4",
                  "invalid_5_", "Inval!d__"];
  
  let messageText = ["Message:  Cannot start the name of this entity with uc_\n",
                  "Message:  Name of this entity must start with an lowercase letter\n",
                  "Message:  Name cannot contain 2 consecutive underscores '__'\n",
                  "Message:  Name cannot contain non-alpha numeric characters except for ' and _\n",
                  "Message:  Name cannot end in an _\n",
                  "Message:  Name of this entity must start with an lowercase letter\n Name cannot contain 2 consecutive underscores '__'\n Name cannot contain non-alpha numeric characters except for ' and _\n Name cannot end in an _\n"];
  act( () => {
    for(let i = 0; i < messageText.length; i++){
      expect(lowerCaseInvalidMessage(failText[i])).toBe(messageText[i])
    }
  })
});

it("Test to ensure that the uppercase validation message is working correctly",() => {
  
  let failText = ["UC_INVALID", "iNVALID_2", "Invalid__3", "Inva!lid_4",
                  "Invalid_5_", "inval!d__"];
  
  let messageText = ["Message:  Cannot start the name of this entity with UC_\n",
                  "Message:  Name of this entity must start with an uppercase letter\n",
                  "Message:  Name cannot contain 2 consecutive underscores '__'\n",
                  "Message:  Name cannot contain non-alpha numeric characters except for ' and _\n",
                  "Message:  Name cannot end in an _\n",
                  "Message:  Name of this entity must start with an uppercase letter\n Name cannot contain 2 consecutive underscores '__'\n Name cannot contain non-alpha numeric characters except for ' and _\n Name cannot end in an _\n"];
  act( () => {
    for(let i = 0; i < messageText.length; i++){
      expect(upperCaseInvalidMessage(failText[i])).toBe(messageText[i])
    }
  })
});
