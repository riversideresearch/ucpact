#!/usr/bin/env python

import os
import json

for file in os.listdir('../models'):
    if file.endswith('.json'):
        fileName = os.path.join('../models', file)

        with open(fileName, 'r') as fp:
            full_data = json.load(fp)

        # Update parameter interface object
        paramInters = full_data['model']['realFunctionality']['parameterInterfaces']
        for paramInter in paramInters:
            paramInter['left'] = ''
            paramInter['top'] = ''
            paramInter['color'] = '#de8989'

        # Change model version
        if 'modelVersion' in full_data:
            full_data['modelVersion'] = '1.1'

        with open(fileName, 'w') as fp:
            json.dump(full_data, fp, indent=2)

            print(file + " updated")