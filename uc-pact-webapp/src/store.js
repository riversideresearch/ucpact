import { configureStore } from '@reduxjs/toolkit'
import interfacesSlice from './features/interfaces/interfacesSlice'
import partiesSlice from './features/parties/partiesSlice'
import subfuncSlice from './features/subfunctionalities/subfuncSlice'
import realFuncSlice from './features/realFunctionalities/realFuncSlice'
import simulatorSlice from './features/simulators/simulatorSlice'
import idealFuncSlice from './features/idealFunctionalities/idealFuncSlice'
import stateMachineSlice from './features/stateMachines/stateMachineSlice'
import modelSlice from './features/model/modelSlice'


export default configureStore({
    reducer: {
        model: modelSlice,
        interfaces: interfacesSlice,
        parties: partiesSlice,
        subfunctionalities: subfuncSlice,
        realFunctionality: realFuncSlice,
        simulator: simulatorSlice,
        idealFunctionality: idealFuncSlice,
        stateMachines: stateMachineSlice,
    },
})