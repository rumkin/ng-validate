;(function(angular){
    angular.module('ngValidate',[])
        .value('$validateOptions', {
            validatorPostfix : '?'
        })
        .factory('$validate', ['$q', '$injector', '$validateOptions', function($q, $injector, $validateOptions){
            return ngValidate;
            /**
             * Validate data with specified model. Model is an object contained properties as set of rules to validate.
             *
             * @param {Object} data Object to validate.
             * @param {Object} model Validation model.
             * @return {$q} Returns angular promise.
             * @example
             *
             * $validate({
             *  name : 'User'
             * }, {
             *  name : {
             *    required: true,
             *    minLength : 10
             *  }
             * }).then(function(){
             *  // No errors
             * }, function(report) {
             *  // Ooops...
             * });
             */
            function ngValidate(data, model, rules) {
                var queue;
                var hasErrors = false;
                var report = {};
                var getRule = function(rule) {
                    if (rules.hasOwnProperty(rule)) return rules[rule];

                    return $injector.get(rule + $validateOptions.validatorPostfix);
                };
                rules = rules||{};
                data = angular.extend({}, data);

                queue = Object.getOwnPropertyNames(model).map(function(name){
                    var rules = Object.getOwnPropertyNames(model[name]);
                    var value = data[name];
                    var initial = data[name];

                    var state = {
                        /**
                         * Get current field name
                         * @returns {string}
                         */
                        get $name() {
                            return name;
                        },
                        /**
                         * Get current field value
                         * @returns {*}
                         */
                        get $value() {
                            return value;
                        },
                        /**
                         * Get field rules
                         * @returns {*}
                         */
                        get $rules() {
                           return model[name];
                        },
                        /**
                         * Define state dynamic property getter
                         * @param {string} name property name
                         * @param {function} getter Getter method
                         * @returns {state}
                         */
                        $define : function(name, getter) {
                            if (typeof getter === 'function') {
                                Object.defineProperty(this, name, {
                                    get : getter
                                });
                            } else {
                                Object.defineProperty(this, name, {
                                    value : getter
                                });
                            }
                            return this;
                        },
                        /**
                         * Check if current value is
                         * @returns {boolean}
                         */
                        get isPristine() {
                            return this.$value === initial;
                        }
                    };

                    // Unwrap matches
                    rules.forEach(function(rule){
                        var service = getRule(rule);

                        if (typeof service.before === 'function') {
                            service.before.call(data, value, name, model, state);
                        }
                    });

                    report[name] = null;
                    return $q(function(resolve, reject){
                        var next = function() {
                            if (! rules.length) {
                                // TODO Destroy state object
                                value = null;
                                return resolve();
                            }

                            var rule, service, match, result, validator;

                            rule = rules.shift();
                            service = getRule(rule);
                            match = model[name][rule];

                            if (typeof match === 'function') {
                                match = match.call(data, value, name, model, state);
                            }

                            model[name][rule] = match;

                            if (typeof service.filter === 'function') {
                                value = service.filter.call(data, match, value, name, model, state);
                            }

                            data[name] = value;

                            if (typeof service === 'object') {
                                validator = service.validate;
                            } else {
                                validator = service;
                            }

                            if (typeof validator !== 'function') return setTimeout(next, 1);

                            result = validator.call(data, match, value, name, model, state);

                            if (isPromise(result)) {
                                result.then(next, function(result){
                                    hasErrors = true;
                                    report[name] = report[name]||{};
                                    report[name][rule] = result || true;
                                    resolve();
                                });
                            } else if (result === true) {
                                next();
                            } else {
                                hasErrors = true;
                                report[name] = report[name]||{};
                                report[name][rule] = result||true;
                                resolve();
                            }
                        };

                        next();
                    });
                });

                return $q.all(queue).then(function(){
                    if (hasErrors) $q.reject(report);
                    else $q.when(data);
                });
            }
        }]);

    /**
     *  Check if value is promise or promise-like object
     * @param {*} value
     * @returns {boolean}
     */
    function isPromise(value) {
        if (!value || typeof value !== 'object') return false;
        else if (typeof value.then !== 'function') return false;
        else if (typeof value.catch !== 'function') return false;

        return true;
    }
})(angular);
