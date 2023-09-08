module.exports {
    SERIAL_NUMBER: 0,
    isValid: function(param, value) {
        switch(param){
            case "SERIAL_NUMBER":
                return typeof value === "string" && value.length < 32;
            default:
                //invalid parameter
                return false;
        }
        

    }
}
