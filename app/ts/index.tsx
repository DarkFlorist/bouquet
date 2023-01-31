import { render } from 'preact'
import { App } from './components/App.js'

render(<App />, document.body, document.querySelector('main') as HTMLElement)
