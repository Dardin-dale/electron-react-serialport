import React from 'react';
import {InputLabel, Select, MenuItem, Fab} from "@material-ui/core";
import {ipcRenderer} from 'electron';

//use index.css instead this is for demo only
const styles = {
    home: {
        display:'fixed',
        margin: '20px auto',
        maxWidth: '300px'
    }, 
    label: {marginTop: '20px'},
    select: {
        width:'100%',
        maxWidth:'300px',
        textAlign: 'center',
        marginBottom: '15px',
        marginLeft: 'auto'
    },
    text: {
        marginLeft: 'auto',
        marginBottom: '15px'
    },
    fab: {
        display: 'block',
        marginLeft: 'auto'
    }
}

class Home extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            //device: [{sn:"C1x203", com:"COM15",ledOn:false}, {sn:"B1002", com:"COM5",led:false}]
            pods: [],
            pod: {},

            msg_open: false,
            msg_variant: "info"
        }
    }

    componentDidMount = () => {
        //this.deviceManager = new DeviceManager;
        var self = this;

        self.getPods();
        //check device availability every 2 seconds
        // this.getPodLoop = setInterval(function() {
        //     self.getPods();
        // }, 2000);
    }

    getPods = () => {
        console.log("posting getPods to main...");
        ipcRenderer.invoke('get-devices').then(devices => {
            if(Array.isArray(devices) && JSON.stringify(this.state.pods) != JSON.stringify(devices)) {
                console.log("pods: ", devices);
                this.setState({pods:devices});
            }
        }).catch(error => {
            console.log("Error: ", error);
            this.setState({pods:[], pod: {}});
        });
    }

    //Submit button click, performs update and sends message accordingly,
    onClick = () => {
        if (this.state.pod.sn) {
            let selected_pod = this.state.pod
            ipcRenderer.invoke('led-toggle', selected_pod).then(result => {
                if (!result) {
                  alert("Device Manager failed. try again.");
                }
                selected_pod.
            }).catch (err => {
                alert("Error: ", err);
            });
        }
    }
   
    //generic change for events
    handleChange = (event) => {
        this.setState({
            [event.target.name]: event.target.value
        })
    }

    render() {
        return (
            <div className="home" style={styles.home}>

                <InputLabel htmlFor="pod-select">Select Device</InputLabel>
                <Select 
                    variant="outlined"
                    value={this.state.pod}
                    onChange={this.handleChange} 
                    inputProps={{
                        name: 'pod',
                        id: 'pod-select'
                    }}
                    style={styles.select}
                >
                    {this.state.pods.map(pod => {
                        return <MenuItem key={pod.sn} value={pod}>{pod.sn}</MenuItem>
                    })}
                </Select>

                <Fab
                    variant="extended"
                    color="secondary"
                    style={styles.button}
                    onClick={this.onClick}
                >
                    LED I/O
                </Fab>

            </div>
        );
    };
}

export default Home;