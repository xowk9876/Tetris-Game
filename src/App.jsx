import React from 'react'
import TetrisGame from './components/TetrisGame'
import Background from './components/Background'
import './styles/App.css'

function App() {
  return (
    <div className="app">
      <Background />
      <TetrisGame />
    </div>
  )
}

export default App

