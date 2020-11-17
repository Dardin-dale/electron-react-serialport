import React from 'react';
import {InputLabel, Select, MenuItem, Fab,Typography} from "@material-ui/core";
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
            returnMsg: "",

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

    //Gets list of devices
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
                } else {
                    selected_pod.ledOn = !selected_pod.ledOn;
                    this.setState({pod:selected_pod});
                }
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

    //Tells device to collect a piece of data with a longer turn around.
    takeData = () => {
        if (this.state.pod.sn) {
            let selected_pod = this.state.pod
            ipcRenderer.invoke('collect-data', selected_pod).then(result => {
                if (!result) {
                    alert("Result, " + result);
                } else {
                    this.setState({returnMsg:result});
                }
            }).catch (err => {
                alert("Error: ", err);
            });
        }
    }

    //multiple valid data responses are given by the device.
    special = () => {
        if (this.state.pod.sn) {
            let selected_pod = this.state.pod
            ipcRenderer.invoke('special-data', selected_pod).then(result => {
                if (!result) {
                    alert("Device Manager failed. try again.");
                } else {
                    this.setState({returnMsg:result[result.length - 1]});
                }
            }).catch (err => {
                alert("Error: ", err);
            });
        }
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

                <Fab
                    variant="extended"
                    color="secondary"
                    style={styles.button}
                    onClick={this.takeData}
                >
                    Collect Data
                </Fab>

                <Fab
                    variant="extended"
                    color="default"
                    style={styles.button}
                    onClick={this.special}
                >
                    Multi-Data Command
                </Fab>

                <Typography>
                    {this.state.returnMsg}
                </Typography>

            </div>
        );
    };
}

export default Home;