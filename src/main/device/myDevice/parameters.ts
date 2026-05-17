type ParamValue = string | number;

const Params = {
    SERIAL_NUMBER: 0,
    LED_DRIVE: 9,
    isValid(param: string, value: ParamValue): boolean {
        switch (param) {
            case 'SERIAL_NUMBER':
                return typeof value === 'string' && value.length < 32;
            case 'LED_DRIVE':
                return !isNaN(Number(value)) && Number(value) >= 0 && Number(value) <= 255;
            default:
                return false;
        }
    },
};

export default Params;
