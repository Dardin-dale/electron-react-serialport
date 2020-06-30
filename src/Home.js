import React from 'react';
import fs from 'fs';
import {InputLabel, Select, MenuItem, Fab} from "@material-ui/core";
import DeviceManager from "./device/DeviceManager";
import test from "./test.json";


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
            //device: [{sn:"C1x203", com:"COM15"}, {sn:"B1002", com:"COM5"}]
            pods: [],
            pod: {},

            msg_open: false,
            msg_variant: "info"
        }
    }

    componentDidMount = () => {
        this.deviceManager = new DeviceManager;
        var self = this;

        //check device availability every 2 seconds
        this.getPodLoop = setInterval(function() {
            self.getPods();
        }, 2000);
    }

    getPods = () => {
        // console.log("posting getPods to manager...");
        this.deviceManager.getdevices().then(pods => {
            if(Array.isArray(pods) && JSON.stringify(this.state.pods) != JSON.stringify(pods)) {
                console.log("pods: ", pods);
                this.setState({pods:pods});
            }
        }).catch(error => {
            // console.log("Error: ", error);
            this.setState({pods:[], pod: {}});
        });
    }

    //Submit button click, performs update and sends message accordingly,
    onClick = () => {
        if (this.state.pod.sn) {
            this.podManager.updatePod(this.state.pod).then(update => {
                alert("LED ON");
            }).catch(error => {
                alert("Error: ", error);
            })  
        } else if (!this.state.pod.sn) {
            alert("please select a device")
        } else {
            alert("Error updating pod");
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
                    LED On
                </Fab>

            </div>
        );
    };
}

export default Home;