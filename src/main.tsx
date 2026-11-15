import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router'
import '@xyflow/react/dist/style.css'
import './index.css'
import Shell from './components/Shell'
import Home from './pages/Home'
import CanvasPage from './pages/Canvas'
import Kanban from './pages/Kanban'
import TaskDetail from './pages/TaskDetail'
import DataPage from './pages/Data'
import GraphPage from './pages/Graph'
import People from './pages/People'
import Agents from './pages/Agents'
import Routines from './pages/Routines'
import TargetMode from './components/target-mode/TargetMode'
import { loadPersistedState, startPersisting } from './persistence'

loadPersistedState().finally(() => {
  startPersisting()
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <BrowserRouter>
        <Routes>
          <Route element={<Shell />}>
            <Route index element={<Home />} />
            <Route path="canvas" element={<CanvasPage />} />
            <Route path="tarefas" element={<Kanban />} />
            <Route path="tarefas/:id" element={<TaskDetail />} />
            <Route path="dados" element={<DataPage />} />
            <Route path="grafo" element={<GraphPage />} />
            <Route path="pessoas" element={<People />} />
            <Route path="agentes" element={<Agents />} />
            <Route path="rotinas" element={<Routines />} />
            <Route path="*" element={<Home />} />
          </Route>
        </Routes>
        <TargetMode />
      </BrowserRouter>
    </StrictMode>,
  )
})
