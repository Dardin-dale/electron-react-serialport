"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _react = _interopRequireDefault(require("react"));

var _fs = _interopRequireDefault(require("fs"));

var _core = require("@material-ui/core");

var _DeviceManager = _interopRequireDefault(require("./device/DeviceManager"));

var _test = _interopRequireDefault(require("./test.json"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) {
  function isNativeReflectConstruct() {
    if (typeof Reflect === "undefined" || !Reflect.construct) return false;
    if (Reflect.construct.sham) return false;
    if (typeof Proxy === "function") return true;

    try {
      Date.prototype.toString.call(Reflect.construct(Date, [], function () {}));
      return true;
    } catch (e) {
      return false;
    }
  }

  return function () {
    var Super = _getPrototypeOf(Derived),
        result;

    if (isNativeReflectConstruct()) {
      var NewTarget = _getPrototypeOf(this).constructor;

      result = Reflect.construct(Super, arguments, NewTarget);
    } else {
      result = Super.apply(this, arguments);
    }

    return _possibleConstructorReturn(this, result);
  };
}

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var styles = {
  home: {
    display: 'fixed',
    margin: '20px auto',
    maxWidth: '300px'
  },
  label: {
    marginTop: '20px'
  },
  select: {
    width: '100%',
    maxWidth: '300px',
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
};

var Home =
/*#__PURE__*/
function (_React$Component) {
  _inherits(Home, _React$Component);

  var _super = _createSuper(Home);

  function Home(props) {
    var _this;

    _classCallCheck(this, Home);

    _this = _super.call(this, props);

    _defineProperty(_assertThisInitialized(_this), "componentDidMount", function () {
      _this.deviceManager = new _DeviceManager["default"](); //this.getPods();

      var self = _assertThisInitialized(_this); //check device availability every 2 seconds


      _this.getPodLoop = setInterval(function () {
        self.getPods();
      }, 2000);
    });

    _defineProperty(_assertThisInitialized(_this), "getPods", function () {
      // console.log("posting getPods to manager...");
      _this.deviceManager.getdevices().then(function (pods) {
        if (Array.isArray(pods) && JSON.stringify(_this.state.pods) != JSON.stringify(pods)) {
          console.log("pods: ", pods);

          _this.setState({
            pods: pods
          });
        }
      })["catch"](function (error) {
        // console.log("Error: ", error);
        _this.setState({
          pods: [],
          pod: {}
        });
      });
    });

    _defineProperty(_assertThisInitialized(_this), "onClick", function () {
      if (_this.state.pod.sn) {
        _this.podManager.updatePod(_this.state.pod).then(function (update) {
          alert("LED ON");
        })["catch"](function (error) {
          alert("Error: ", error);
        });
      } else if (!_this.state.pod.sn) {
        alert("please select a device");
      } else {
        alert("Error updating pod");
      }
    });

    _defineProperty(_assertThisInitialized(_this), "handleChange", function (event) {
      _this.setState(_defineProperty({}, event.target.name, event.target.value));
    });

    _this.state = {
      //device: [{sn:"C1x203", com:"COM15"}, {sn:"B1002", com:"COM5"}]
      pods: [],
      pod: {},
      msg_open: false,
      msg_variant: "info"
    };
    return _this;
  }

  _createClass(Home, [{
    key: "render",
    value: function render() {
      return _react["default"].createElement("div", {
        className: "home",
        style: styles.home
      }, _react["default"].createElement(_core.InputLabel, {
        htmlFor: "pod-select"
      }, "Select Device"), _react["default"].createElement(_core.Select, {
        variant: "outlined",
        value: this.state.pod,
        onChange: this.handleChange,
        inputProps: {
          name: 'pod',
          id: 'pod-select'
        },
        style: styles.select
      }, this.state.pods.map(function (pod) {
        return _react["default"].createElement(_core.MenuItem, {
          key: pod.sn,
          value: pod
        }, pod.sn);
      })), _react["default"].createElement(_core.Fab, {
        variant: "extended",
        color: "secondary",
        style: styles.button,
        onClick: this.onClick
      }, "LED On"));
    }
  }]);

  return Home;
}(_react["default"].Component);

var _default = Home;
exports["default"] = _default;