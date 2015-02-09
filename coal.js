var coal = (function () {

        function Scope() {
            this.$$watchers = [];
            this.$$asyncQueue = [];
        }

        Scope.prototype.$apply = function (expr) {
            try {
                return this.$eval(expr);
            } finally {
                this.$digest();
            }
        };

        Scope.prototype.$eval = function (expr, locals) {
            return expr(this, locals);
        };

        Scope.prototype.$evalAsync = function (expr) {
            this.$$asyncQueue.push({scope: this, expression: expr});
        };

        Scope.prototype.$watch = function (watchFn, listenerFn) {
            var watcher = {
                watchFn: watchFn,
                listenerFn: listenerFn || function () {
                }
            };
            this.$$watchers.push(watcher);
        };

        Scope.prototype.$$digestOnce = function () {
            var self = this;
            var dirty;
            for (var i = 0; i < this.$$watchers.length; i++) {
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

        Scope.prototype.$digest = function () {
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

        function App(element, scope) {
            this.scope = scope;
            this.element = element;

        }

        App.prototype.controller = function (handler) {
            this.handler = handler || function () {
            };
            this.$$compile(this.element, this.scope);
        }

        App.prototype.$$compile = function (element, scope) {

            if (typeof element === 'undefined') {
                var elems = document.getElementsByTagName('*');
            } else {
                var elems = document.querySelectorAll(element + ' *');
            }
            var events = {
                INPUT: 'keyup',
                SELECT: 'change'
            }
            var values = {};
            for (var i = 0; i < elems.length; i++) {
                if (elems[i].getAttribute("data-co-value") != null) {
                    var name = elems[i].getAttribute("data-co-value");
                    values[name] = elems[i];
                }
                if (elems[i].getAttribute("data-co-model") != null) {
                    (function (el, handler) {
                        var model = el.getAttribute("data-co-model");
                        scope[model] = el.value;
                        scope.$watch(
                                function (scope) {
                                    return scope[model];
                                },
                                function (newValue, oldValue, scope) {
                                    if (typeof values[model] !== 'undefined') {
                                        values[model].innerHTML = newValue;
                                    }
                                    handler(scope, model);
                                }
                        );

                        var event = events[el.tagName];

                        el['on' + event] = function () {
                            scope[model] = this.value;
                            scope.$digest();
                        }

                    }(elems[i], this.handler));
                }
            }
        }


        function init(element) {
            if (typeof element === 'undefined') {
                element = document;
            }

            return new App(element, new Scope());
        }

        return {
            init: init
        }
    }());
