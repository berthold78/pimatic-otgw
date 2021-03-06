var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

module.exports = function(env) {
  var M, OTGWConnection, OTGWHeatingThermostat, OTGWMainThermostat, OTGWThermostat, OTGWThermostatPlugin, Promise, assert, plugin, settled, _;
  Promise = env.require('bluebird');
  assert = env.require('cassert');
  _ = env.require('lodash');
  OTGWConnection = require('OTGW-Control');
  Promise.promisifyAll(OTGWConnection.prototype);
  M = env.matcher;
  settled = function(promise) {
    return Promise.settle([promise]);
  };
  OTGWThermostatPlugin = (function(_super) {
    __extends(OTGWThermostatPlugin, _super);

    function OTGWThermostatPlugin() {
      this.init = __bind(this.init, this);
      return OTGWThermostatPlugin.__super__.constructor.apply(this, arguments);
    }

    OTGWThermostatPlugin.prototype.init = function(app, framework, config) {
      var deviceConfigDef;
      this.framework = framework;
      this.config = config;
      this._lastAction = new Promise((function(_this) {
        return function(resolve, reject) {
          _this.otgw = new OTGWConnection(_this.config.host, _this.config.port);
          _this.otgw.once("connected", resolve);
          _this.otgw.once('error', reject);
        };
      })(this)).timeout(60000)["catch"](function(error) {
        env.logger.error("Error on connecting to OTGW relay: " + error.message);
        env.logger.debug(error.stack);
      });
      this.otgw.on('error', (function(_this) {
        return function(error) {
          env.logger.error("connection error: " + error);
          return env.logger.debug(error.stack);
        };
      })(this));
      this.otgw.on("room_temperature", (function(_this) {
        return function(data) {
          return env.logger.debug("got room_temperature: ", data);
        };
      })(this));
      this.otgw.on("remote_override_setpoint", (function(_this) {
        return function(data) {
          return env.logger.debug("got remote_override_setpoint: ", data);
        };
      })(this));
      this.otgw.on("flame_status", (function(_this) {
        return function(data) {
          return env.logger.debug("Flame status: ", data);
        };
      })(this));
      deviceConfigDef = require("./device-config-schema");
      this.framework.deviceManager.registerDeviceClass("OTGWHeatingThermostat", {
        configDef: deviceConfigDef.OTGWHeatingThermostat,
        createCallback: function(config, lastState) {
          return new OTGWHeatingThermostat(config, lastState);
        }
      });
      this.framework.deviceManager.registerDeviceClass("OTGWMainThermostat", {
        configDef: deviceConfigDef.OTGWMainThermostat,
        createCallback: function(config, lastState) {
          return new OTGWMainThermostat(config, lastState);
        }
      });
      return this.framework.deviceManager.registerDeviceClass("OTGWThermostat", {
        configDef: deviceConfigDef.OTGWThermostat,
        createCallback: function(config) {
          return new OTGWThermostat(config);
        }
      });
    };

    OTGWThermostatPlugin.prototype.setTemperatureSetpoint = function(mode, value) {
      this._lastAction = settled(this._lastAction).then((function(_this) {
        return function() {
          return _this.otgw.setTemperatureAsync(mode, value);
        };
      })(this));
      return this._lastAction;
    };

    return OTGWThermostatPlugin;

  })(env.plugins.Plugin);
  plugin = new OTGWThermostatPlugin;
  OTGWThermostat = (function(_super) {
    var _ch2enable, _ch2mode, _chenable, _chmode, _coolingenable, _coolingstatus, _dhwenable, _dhwmode, _diag, _fault, _flame, _otcstate;

    __extends(OTGWThermostat, _super);

    _fault = false;

    _chmode = false;

    _dhwmode = false;

    _flame = false;

    _coolingstatus = false;

    _ch2mode = false;

    _diag = false;

    _chenable = false;

    _dhwenable = false;

    _coolingenable = false;

    _otcstate = false;

    _ch2enable = false;

    OTGWThermostat.prototype.attributes = {
      Flame: {
        description: "Flame status",
        type: "boolean"
      }
    };

    function OTGWThermostat(config) {
      this.config = config;
      this.id = this.config.id;
      this.name = this.config.name;
      plugin.otgw.on("flame_status", (function(_this) {
        return function(data) {
          if (data.length = 16) {
            _this._fault = _this._bitToBool(data.slice(15, 16));
            _this._chmode = _this._bitToBool(data.slice(14, 15));
            _this._dhwmode = _this._bitToBool(data.slice(13, 14));
            _this._setFlame(_this._bitToBool(data.slice(12, 13)));
            _this._coolingstatus = _this._bitToBool(data.slice(11, 12));
            _this._ch2mode = _this._bitToBool(data.slice(10, 11));
            _this._diag = _this._bitToBool(data.slice(9, 10));
            _this._chenable = _this._bitToBool(data.slice(8, 9));
            _this._dhwenable = _this._bitToBool(data.slice(7, 8));
            _this._coolingenable = _this._bitToBool(data.slice(6, 7));
            _this._otcstate = _this._bitToBool(data.slice(5, 6));
            return _this._ch2enable = _this._bitToBool(data.slice(4, 5));
          }
        };
      })(this));
      OTGWThermostat.__super__.constructor.call(this);
    }

    OTGWThermostat.prototype.getFlame = function() {
      return Promise.resolve(this._flame);
    };

    OTGWThermostat.prototype._bitToBool = function(value) {
      return value === "1";
    };

    OTGWThermostat.prototype._setFlame = function(state) {
      if (this._state !== state) {
        this._state = state;
        return this.emit('Flame', state);
      }
    };

    return OTGWThermostat;

  })(env.devices.Device);
  OTGWHeatingThermostat = (function(_super) {
    __extends(OTGWHeatingThermostat, _super);

    function OTGWHeatingThermostat(config, lastState) {
      var _ref, _ref1, _ref2;
      this.config = config;
      this.id = this.config.id;
      this.name = this.config.name;
      this._temperatureSetpoint = lastState != null ? (_ref = lastState.temperatureSetpoint) != null ? _ref.value : void 0 : void 0;
      this._mode = (lastState != null ? (_ref1 = lastState.mode) != null ? _ref1.value : void 0 : void 0) || "auto";
      this._battery = (lastState != null ? (_ref2 = lastState.battery) != null ? _ref2.value : void 0 : void 0) || "ok";
      this._lastSendTime = 0;
      plugin.otgw.on("room_setpoint", (function(_this) {
        return function(data) {
          var now;
          if (data != null) {
            data = Number(data);
            now = new Date().getTime();

            /*
            Give the gateway some time to handle the changes. If we send new values to the cube
            we set _lastSendTime to the current time. We consider the values as succesfull set, when
            the command was not rejected. 
            
            In the case that the gateway did not react to our the send commands, the values will be 
            overwritten with the internal state (old ones) of the gateway after 30 seconds.
             */
            if (_this._mode === "auto") {
              _this._setSetpoint(data);
              _this._setSynced(true);

              /*
              if now - @_lastSendTime < 30*1000
                 * only if values match, we are synced
                if data is @_temperatureSetpoint
                  @_setSynced(true)
              else
                 * more then 30 seconds passed, set the values anyway
                @_setSetpoint(data)  #override from gateway
                
                @_setSynced(true)
               */
            }
          }
        };
      })(this));
      plugin.otgw.on("remote_override_setpoint", (function(_this) {
        return function(data) {
          var now;
          if (data != null) {
            data = Number(data);
            now = new Date().getTime();

            /*
            Give the gateway some time to handle the changes. If we send new values to the cube
            we set _lastSendTime to the current time. We consider the values as succesfull set, when
            the command was not rejected. 
            
            In the case that the gateway did not react to our the send commands, the values will be 
            overwritten with the internal state (old ones) of the gateway after 30 seconds.
             */
            if (_this._mode === "manu") {
              if (data < 1) {
                env.logger.debug("setting to auto");
                _this._setMode("auto");
              } else {
                if (now - _this._lastSendTime < 30 * 1000) {
                  if (data === _this._temperatureSetpoint) {
                    _this._setSynced(true);
                  }
                } else {
                  _this._setSetpoint(data);
                  _this._setSynced(true);
                }
              }
            }
            if (_this._mode === "auto" && data > 0.00) {
              _this._setMode("manu");
            }
          }
        };
      })(this));
      OTGWHeatingThermostat.__super__.constructor.call(this);
    }

    OTGWHeatingThermostat.prototype.changeModeTo = function(mode) {
      var temp;
      temp = this._temperatureSetpoint;
      if (mode === "auto") {
        temp = null;
      }
      return plugin.setTemperatureSetpoint(mode, temp).then((function(_this) {
        return function() {
          _this._lastSendTime = new Date().getTime();
          _this._setSynced(false);
          return _this._setMode(mode);
        };
      })(this));
    };

    OTGWHeatingThermostat.prototype.changeTemperatureTo = function(temperatureSetpoint) {
      if (this.temperatureSetpoint === temperatureSetpoint) {
        return;
      }
      return plugin.setTemperatureSetpoint(this._mode, temperatureSetpoint).then((function(_this) {
        return function() {
          _this._lastSendTime = new Date().getTime();
          _this._setSynced(false);
          return _this._setSetpoint(temperatureSetpoint);
        };
      })(this));
    };

    return OTGWHeatingThermostat;

  })(env.devices.HeatingThermostat);
  OTGWMainThermostat = (function(_super) {
    __extends(OTGWMainThermostat, _super);

    OTGWMainThermostat.prototype._temperature = null;

    function OTGWMainThermostat(config, lastState) {
      var _ref;
      this.config = config;
      this.id = this.config.id;
      this.name = this.config.name;
      this._temperature = lastState != null ? (_ref = lastState.temperature) != null ? _ref.value : void 0 : void 0;
      OTGWMainThermostat.__super__.constructor.call(this);
      plugin.otgw.on("room_temperature", (function(_this) {
        return function(data) {
          if (data != null) {
            _this._temperature = Number(data);
            return _this.emit('temperature', _this._temperature);
          }
        };
      })(this));
    }

    OTGWMainThermostat.prototype.getTemperature = function() {
      return Promise.resolve(this._temperature);
    };

    return OTGWMainThermostat;

  })(env.devices.TemperatureSensor);
  return plugin;
};
