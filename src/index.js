// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.
import * as React from 'react';
import ReactDOM from 'react-dom';
import Home from './Home';
import './style.css';

window.onload = () => {
    ReactDOM.render(<Home/>, document.getElementById('app'));
};

module.hot.accept();