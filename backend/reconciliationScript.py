#!/usr/bin/env python

# import os
import json
from pathlib import Path

def convert_files(filenames: list[Path]):
    for fileName in filenames:
        with open(fileName, 'r') as fp:
            full_data = json.load(fp)
        if 'modelVersion' in full_data and full_data['modelVersion'] == '1.2':
            # skip this model
            continue
        # Update parameter interface object
        if 'modelVersion' not in full_data or full_data['modelVersion'] != '1.1':
            paramInters = full_data['model']['realFunctionality']['parameterInterfaces']
            for paramInter in paramInters:
                paramInter['left'] = ''
                paramInter['top'] = ''
                paramInter['color'] = '#de8989'

        # Update transitions
        transitions = full_data['model']['stateMachines']['transitions']

        # Add transition name
        for transition in transitions:
            if 'name' not in transition:
                transition['name'] = ''

        stateMachines = full_data['model']['stateMachines']['stateMachines']
        for stateMachine in stateMachines:
            stateMachineTransitionsId = stateMachine['transitions']
            stateMachineTransitions = []
            for transitionA in stateMachineTransitionsId:
                for transitionB in transitions:
                    if transitionA == transitionB['id']:
                        stateMachineTransitions.append(transitionB)

            # Add transition handles
            count = 0
            for transitionA in stateMachineTransitions:
                for transitionB in stateMachineTransitions:
                    if (transitionA['fromState'] == transitionB['fromState']) and (transitionA['toState'] == transitionB['toState']):
                        if 'sourceHandle' not in transitionA:
                            sourceHandle = 13 - count
                            transitionA['sourceHandle'] = str(sourceHandle)

                        if 'targetHandle' not in transitionA:
                            targetHandle = 1 + count
                            transitionA['targetHandle'] = str(targetHandle)

                        count += 1
                    else:
                        transitionA['sourceHandle'] = '13'
                        transitionA['targetHandle'] = '1'

        # Update state positioning
        states = full_data['model']['stateMachines']['states']
        for state in states:
            state['left'] = state['left'] - 245
            state['top'] = state['top'] - 100
        
        # Change model version
        full_data['modelVersion'] = '1.2'

        with open(fileName, 'w') as fp:
            json.dump(full_data, fp, indent=2)

            print(fileName.stem + " updated")

if __name__ == "__main__":
    model_folder = Path('./models')
    filenames = [
        filepath for filepath in model_folder.iterdir()
        if filepath.suffix == '.json'
    ]
    convert_files(filenames)
