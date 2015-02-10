        /**
         * Coal.js
         * Version: 0.1
         * Author: Tomas Holub
         */
        var coal = (function () {

            function Scope() {
                this.$$watchers = [];
                this.$$asyncQueue = [];
            }

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
                this.scope.$digest();
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
                    SELECT: 'change',
                    CHECKBOX: 'change'
                }
                var values = {};

                var watchHandler = function(scope,model,handler) {
                    scope.$watch(
                        function (scope) {
                            return scope[model];
                        },
                        function (newValue, oldValue, scope) {
                            if (typeof values[model] !== 'undefined') {
                                values[model].innerHTML = newValue;
                            }
                            handler(scope, model, newValue, oldValue);
                        }
                    );
                }

                for (var i = 0; i < elems.length; i++) {

                    if (elems[i].getAttribute("data-co-value") != null) {
                        var name = elems[i].getAttribute("data-co-value");
                        values[name] = elems[i];
                    }
                    if (elems[i].getAttribute("data-co-model") != null) {
                        (function (el, handler) {
                            var model = el.getAttribute("data-co-model");

                            if (el.tagName === 'INPUT' && el.type === 'checkbox') {
                                scope[model] = el.checked;
                            } else {
                                scope[model] = el.value;
                            }

                            watchHandler(scope,model,handler);

                            var event = events[el.tagName];
                            if (el.tagName === 'INPUT' && el.type === 'checkbox') {
                                event = events['CHECKBOX'];
                            }

                            el['on' + event] = function () {
                                if (el.tagName === 'INPUT' && el.type === 'checkbox') {
                                    scope[model] = this.checked;
                                } else {
                                    scope[model] = this.value;
                                }
                                scope.$digest();
                            }



                        }(elems[i], this.handler));
                    }

                    if (elems[i].getAttribute("data-co-click") != null) {
                        (function(el, handler){
                            var method = el.getAttribute("data-co-click");
                            var FN_ARGS = /^\s*[^\(]*\(\s*([^\)]*)\)/m;
                            var methodName = method.match(/[^(]*/i)[0];
                            var args = method.match(FN_ARGS)[1].replace(/\s+/g,'').split(',');

                            el['onclick'] = function () {
                                if (typeof scope[methodName] === 'function') {
                                    scope[methodName].apply(scope[methodName], args);
                                }
                            }

                        }(elems[i], this.handler))
                    }

                }

                // init scope values
                this.scope.$digest();

            }

            function init(element) {
                var scope = new Scope();
                scope.$digest();
                var app   =  new App(element, scope);

                return app;
            }

            return {
                init: init
            }
        }());
