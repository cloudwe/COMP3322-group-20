import { useState } from "react"; 
import "./App.css"; 
  
function App() { 
  const [todos, setTodos] = useState([]); 
  const [input, setInput] = useState(""); 
  const [priority, setPriority] = useState("medium"); 
  
  function handleSubmit(e) { 
    e.preventDefault(); 
    if (input.trim() === "") return; 
    const newTodo = { 
      id: Date.now(), 
      text: input.trim(), 
      done: false, 
      priority: priority, 
    }; 
    setTodos([...todos, newTodo]); 
    setInput(""); 
  } 
  
  function toggleDone(id) { 
    setTodos(todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t))); 
  } 
  
  function deleteTodo(id) { 
    setTodos(todos.filter((t) => t.id !== id)); 
  } 
  
  const doneCount = todos.filter((t) => t.done).length; 
  const percent = 
    todos.length === 0 ? 0 : Math.round((doneCount / todos.length) * 100); 
  
  return ( 
    <div className="app"> 
      <h1>My Todo List</h1> 
      <p className="subtitle"> 
        {doneCount}/{todos.length} done · {percent}% 
      </p> 
  
      <div className="progress"> 
        <div className="progress-bar" style={{ width: percent + "%" }}></div>
      </div> 
  
      <form className="add-form" onSubmit={handleSubmit}> 
        <input 
          type="text" 
          placeholder="What needs to be done?" 
          value={input} 
          onChange={(e) => setInput(e.target.value)} 
        /> 
        <select value={priority} onChange={(e) => setPriority(e.target.value)}> 
          <option value="low">Low</option> 
          <option value="medium">Medium</option> 
          <option value="high">High</option> 
        </select> 
        <button type="submit">Add</button> 
      </form> 
  
      <ul className="todo-list"> 
        {todos.map((todo) => ( 
          <li key={todo.id} className={todo.done ? "done" : ""}> 
            <span className="todo-text" onClick={() => toggleDone(todo.id)}> 
              {todo.text} 
            </span> 
            <span className={"chip " + todo.priority}>{todo.priority}</span> 
            <button className="delete-btn" onClick={() => deleteTodo(todo.id)}> 
              ✕ 
            </button> 
          </li> 
        ))} 
      </ul> 
  
      {todos.length === 0 && ( 
        <p className="empty">Nothing here yet — add your first task above!</p> 
      )} 
    </div> 
  ); 
} 
  
export default App; 