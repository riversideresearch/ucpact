# Component Schema

---

## Model

```js
{
    id: <uuid>,
    name: <string>,
    modelVersion: <string "1.1">, // Model version for compatibility; do a major increment each time the schema is changed (i.e 1.0 -> 2.0).
    readOnly: <string>, // "<username>/<sessionID>/<tabID>" if in readOnly mode, otherwise ""
}
```

## Real Functionality

```js
{
    parties: [<id of party>, ...],
    subfunctionalities: [<id of subfunctionality>*],
    id: <uuid>,
    name: <string>,
    compositeDirectInterface: <id of composite interface with type="direct">,
    compositeAdversarialInterface: <id of composite interface with type="adversarial">,
    parameterInterfaces: [{name:<string>, idOfInterface: <id of composite interface with type="direct">, modelName:<string>, compInterName:<string>, left:<int>, top:<int>, color:<string>}*]
}
```

## Interfaces

```js
{
    compInters: [{
        type: <"adversarial" | "direct">,
        id: <uuid>,
        name: <string>,
        basicInterfaces: [{name:<string>, idOfBasic:<id of basic interface>, idOfInstance:<id of basic instance>}, ...],
    }, ...],
    basicInters: [{
        type: <"adversarial" | "direct">,
        messages: [<id of message>, ...],
        id: <uuid>,
        name: <string>,
    }, ...],
    messages: [{
        type: <"in" | "out">,
        port: <string>,
        id: <uuid>,
        name: <string>,
        parameters: [{name: <string>, type: <string>, id:<uuid string>}*],
    }, ...],
}
```

## Ideal Functionality

```js
{
    basicAdversarialInterface: <id of basic interface with type="adversarial">,
    compositeDirectInterface: <id of composite interface with type="direct">,
    stateMachine: <id of state machine>,
    id: <uuid>,
    name: <string>,
    left: <int>, // Number of pixels from the left of the screen where the component belongs
    top: <int>, // Number of pixels from the top of the screen where the component belongs
    color: <string> // A css color string in the form #ffffff to apply to the component
}
```

## Subfunctionalities

```js
{
    subfunctionalities: [{
        idealFunctionalityId: <id of ideal functionality>, // This is the id of some other ideal functionality that exists in the system
        idealFuncModel: <id of state machine>,
        idealFunctionalityName: <string>,
        id: <uuid>,
        name: <string>,
        left: <int>, // Number of pixels from the left of the screen where the component belongs
        top: <int>, // Number of pixels from the top of the screen where the component belongs
        color: <string> // A css color string in the form #ffffff to apply to the component
    }, ...],
}
```

## Simulator

```js
{
    basicAdversarialInterface: <id of basic interface with type="adversarial">,
    realFunctionality: <id of real functionality being simulated>,
    stateMachine: <id of state machine>,
    id: <uuid>,
    name: <string>,
    left: <int>, // Number of pixels from the left of the screen where the component belongs
    top: <int>, // Number of pixels from the top of the screen where the component belongs
    color: <string> // A css color string in the form #ffffff to apply to the component
}
```

## Parties

```js
{
    parties: [{
        basicDirectInterface: <id of basic interface with type="direct">,
        basicAdversarialInterface: <id of basic interface with type="adversarial">,
        stateMachine: <id of state machine>,
        id: <uuid>,
        name: <string>,
        left: <int>, // Number of pixels from the left of the screen where the component belongs
        top: <int>, // Number of pixels from the top of the screen where the component belongs
        color: <string> // A css color string in the form #ffffff to apply to the component
    }, ...],
}
```

## State Machines

```js
{
    stateMachines: [{
        id: <uuid>,
        states: [<id of state>, ...],
        transitions: [<id of transition>, ...],
        initState: <id of starting state>,
    }, ...],
    states: [{
        id: <uuid>,
        name: <string>,
        left: <int>, // Number of pixels from the left of the screen where the component belongs
        top: <int>, // Number of pixels from the top of the screen where the component belongs
        color: <string>, // A css color string in the form #ffffff to apply to the component
        parameters: [{name: <string>, type: <string>, id: <uuid>}*],
    }, ...],
    transitions: [{
        id: <uuid>,
        fromState: <id of state>,
        toState: <id of state>,
        toStateArguments: [{paraID: <id of parameter>, <string>}*, ...],
        outMessageArguments: [{paraID: <id of parameter>, <string>}*, ...],
        guard: <string>,
        outMessage: <id of message>,
        inMessage: <id of message>,
        targetPort: <string>
    }, ...],
}
```
