import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/global.css'

// 不使用 React.StrictMode：node-pty 的 spawn/kill 是有副作用的原生操作，
// StrictMode 的 dev 双调用会让每个终端产生多余的 kill→spawn 序列，
// 叠加会话切换会偶发触发 ConPTY 原生段错误。
ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
