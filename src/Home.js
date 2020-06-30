import React from 'react';
import fs from 'fs';
import DeviceManager from "./device/DeviceManager";


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
    button: {
        display: 'block',
        margin: 'auto'
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
        this.deviceManager.getPods().then(pods => {
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
        if (this.state.pod.sn && this.state.desired_oem && this.state.licenses.length > 0) {
            this.podManager.updatePod(this.state.pod, this.state.desired_oem, this.state.licenses).then(update => {
                alert("TrakPod Updated!");
            }).catch(error => {
                alert("Error: no valid licenses", error);
            })  
        } else if (!this.state.pod.sn) {
            alert("please select a TrakPod to update")
        } else if (!this.state.desired_oem) {
            alert("Not possible?");
        } else if (this.state.licenses.length === 0) {
            alert("please upload a TrakPod license")
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
                <text>Hello World!</text>
                {/* <Typography style={styles.text}>
                    {(this.state.licenses.length > 0) ? "Upload Succesful, Licenses available" : "No active licenses"}
                </Typography>

                <InputLabel htmlFor="pod-select">Select TrakPod</InputLabel>
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

                <Typography style={styles.text}>
                    {(this.state.pod.dist) ? "Current Distributor: " + this.state.pod.dist : "No Pod Selected"}
                </Typography>

                <InputLabel htmlFor="oem-select">Change Distributor</InputLabel>
                <Select
                    variant="filled"
                    value={this.state.desired_oem}
                    onChange={this.handleChange}
                    inputProps={{
                        name: 'desired_oem',
                        id: 'oem-select'
                    }}
                    style={styles.select}
                >
                    {this.state.disti.map(oem => {
                        return <MenuItem key={oem.name} value={oem.name}>{oem.name}</MenuItem>
                    })}
                </Select>

                <Fab
                    variant="extended"
                    color="secondary"
                    style={styles.button}
                    onClick={this.onClick}
                >
                    Submit
                </Fab> */}

            </div>
        );
    };
}

export default Home;