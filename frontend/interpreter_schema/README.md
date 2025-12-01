# Interpreter Schema

```js

{
    filename: <string>,
    realWorld: {
        events: [{event}, {event}, ...]
    },
    idealWorld: {
        events: [{event}, {event}, ...]
    }
}
```

## Event

```js
{
    type: <"message" | "error" | "fail">,
    errorMessage: <string> | <null>,
    ucfilePosition: [
        {
            filename: <string>,
            start: <int>,
            end: <int>
        }*
    ],
    name: <string> | <null>,
    parameters: [<string>*],
    stateNumber: <int>,
    toEntity: <"Adv" | "Env" | "World">,
    fromEntity: <"Adv" | "Env" | "World">,
    id: <uuid>,
    toPort: <string> | <null>,
    fromPort: <string> | <null>,
    startLine: <int>,
    outputTo: <string> | <null>,
    sentFrom: <string> | <null>
}
```

## Example Messages with Breakdown

>#37>
>
>sending from []: RWVariable.RWVReal
>
>message:
>((func, 1))@
>RWVariable.RWVariable.D.handlerResp
>(EFI_SUCCESS, [maxUINT8; maxUINT8; zeroUINT8; zeroUINT8; maxUINT8])
>@pt1
>
>;

```js
{
    type: "message",
    errorMessage: null,
    ucfilePosition: [],
    name: "RWVariable.RWVariable.D.handlerResp",
    parameters: [
        "EFI_SUCCESS",
        "[maxUINT8; maxUINT8; zeroUINT8; zeroUINT8; maxUINT8]"
    ],
    stateNumber: 37,
    toEntity: "Env",
    fromEntity: "World",
    id: "35826337-068f-4198-85ff-ccd8b9648186",
    toPort: "pt1",
    fromPort: "(func, 1)",
    startLine: 726,
    outputTo: null,
    sentFrom: "[]: RWVariable.RWVReal"
}
```

>#39>
>
>sending from environment
>
>message:
>pt1@
>RWVariable.RWVariable.D.handler
>(RWV_READ_DEF_ATTR, varGuid, attributes, variableNameSize, intToUINT64 0,
>[maxUINT16], varData)
>@((func, 1))
>;

```js
{
    type: "message",
    errorMessage: null,
    ucfilePosition: [],
    name: "RWVariable.RWVariable.D.handler",
    parameters: [
        "RWV_READ_DEF_ATTR",
        "varGuid",
        "attributes",
        "variableNameSize",
        "intToUINT64 0",
        "[maxUINT16]",
        "varData"
    ],
    stateNumber: 39,
    toEntity: "World",
    fromEntity: "Env",
    id: "73696aa1-01ae-4508-ac75-a0eb841cdf4f",
    toPort: "(func, 1)",
    fromPort: "pt1",
    startLine: 783,
    outputTo: null,
    sentFrom: "environment"
}
```

>#15>
>
>sending from adversary
>
>message: ((adv, 2))@RWVariable.RWVariableAdv.A.doInit@((func, 1))
>;

```js
{
    type: "message",
    errorMessage: null,
    ucfilePosition: [],
    name: "RWVariable.RWVariableAdv.A.doInit",
    parameters: [],
    stateNumber: 15,
    toEntity: "World",
    fromEntity: "Adv",
    id: "1e546737-97c8-474f-b696-bf83d0b0fd9f",
    toPort: "(func, 1)",
    fromPort: "(adv, 2)",
    startLine: 202,
    outputTo: null,
    sentFrom: "adversary"
}
```

>#13>
>step.
>
>[error: KeyExchangeBlockTest.uci: from line 24 columns 1 to 5]
>
>blocking: cannot decide if condition

```js
{
    type: "error",
    errorMessage: "KeyExchangeBlockTest.uci: from line 24 columns 1 to 5",
    ucfilePosition: [],
    name: null,
    parameters: [],
    stateNumber: 13,
    toEntity: null,
    fromEntity: null,
    id: "b936f538-4e73-44f7-8fce-c8c8b311ca0b",
    toPort: null,
    fromPort: null,
    startLine: 236,
    outputTo: null,
    sentFrom: null
}
```

>#18>
>step.
>
>
>effect:
>note: "fail." was called.
>;

```js
{
    type: "fail",
    errorMessage: null,
    ucfilePosition: [],
    name: null,
    parameters: [],
    stateNumber: 18,
    toEntity: null,
    fromEntity: null,
    id: "3b0bc720-bbc4-433f-b179-c1d123d8e241",
    toPort: null,
    fromPort: null,
    startLine: 353,
    outputTo: null,
    sentFrom: null
}
```
