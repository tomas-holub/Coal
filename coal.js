    Scope.prototype.$apply = function(expr) {
        try {
            return this.$eval(expr);
        } finally {
            this.$digest();
        }
    };

    Scope.prototype.$eval = function(expr, locals) {
        return expr(this, locals);
    };

    Scope.prototype.$evalAsync = function(expr) {
        this.$$asyncQueue.push({scope: this, expression: expr});
    };

    Scope.prototype.$watch = function(watchFn, listenerFn) {
        var watcher = {
            watchFn: watchFn,
            listenerFn: listenerFn || function() { }
        };
        this.$$watchers.push(watcher);
    };

    Scope.prototype.$$digestOnce = function() {
        var self = this;
        var dirty;
        for(var i=0;i<this.$$watchers.length; i++) {
            var watch = this.$$watchers[i];

            var newValue = watch.watchFn(self);
            var oldValue = watch.last;

            if (newValue !== oldValue) {
              watch.listenerFn(newValue, oldValue, self);
              dirty = true;
              watch.last = newValue;
            }
        }
        return dirty;
    };

    Scope.prototype.$digest = function() {
        var ttl = 10;
        var dirty;
        do {
            while (this.$$asyncQueue.length) {
                var asyncTask = this.$$asyncQueue.shift();
                this.$eval(asyncTask.expression);
            }
            dirty = this.$$digestOnce();
            if (dirty && !(ttl--)) {
                throw "Coal Error: 10 digest iterations reached";
            }
        } while (dirty);
    }

    var scope  = new Scope();
    var elems  = document.getElementsByTagName('*');
    var events = {
        INPUT:'keyup',
        SELECT:'change'
    }

    for (var i=0;i<elems.length;i++) {
        if (elems[i].getAttribute("data-model")!=null) {
            (function(el) {
                var model    = el.getAttribute("data-model");
                scope[model] = el.value;
                scope.$watch(
                    function(scope) {
                        return scope[model];
                    },
                    function(newValue, oldValue, scope) {
                        console.log('newValue ' + newValue);
                        Controller(scope);
                    }
                );

                var event = events[el.tagName];

                el.addEventListener(event, function(e){
                    scope[model] = e.target.value
                    scope.$digest();
                });
            }(elems[i]));
        }
    }


    var validator = (function() {
        var isSet = function (val) {
            if (typeof val === 'undefined' || val === null || val === '') {
                return false;
            }
            return true;
        }

        var isNumeric = function(val) {
            return typeof(val) != "boolean" && !isNaN(val);
        }

        var isString = function(val) {
            var matches = val.match(/\d+/g);
            if (matches == null) {
                return true;
            }
            return false;
        }

        var isEmail = function(val) {
            var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            return re.test(val);
        }

        return {
            isSet:isSet,
            isNumeric:isNumeric,
            isString:isString,
            isEmail:isEmail
        }
    }());

    scope.$digest();
    function Controller($scope) {
        // working with variables on scope
    }
