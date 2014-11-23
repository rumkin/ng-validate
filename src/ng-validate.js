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
            function ngValidate(data, model) {
                var queue;
                var hasErrors = false;
                var report = {};

                data = angular.extend({}, data);

                queue = Object.getOwnPropertyNames(model).map(function(name){
                    var rules = Object.getOwnPropertyNames(model[name]);
                    var value = data[name];

                    report[name] = null;
                    return $q(function(resolve, reject){
                        var next = function() {
                            if (! rules.length) return resolve();

                            var rule, service, match, result, validator;

                            rule = rules.shift();
                            service = $injector.get(rule + $validateOptions.validatorPostfix);
                            match = model[name][rule];


                            if (typeof match === 'function') {
                                match = match.call(data, value, name, model);
                            }

                            if (typeof service.filter === 'function') {
                                value = service.filter.call(data, match, value, name, model);
                            }

                            data[name] = value;

                            if (typeof service == 'object') {
                                validator = service.validate;
                            } else {
                                validator = service;
                            }

                            if (typeof validator !== 'function') return setTimeout(next, 1);

                            result = validator.call(data, match, value, name, model);
                            // TODO Create full check fro promises
                            if (result && typeof result === 'object' && typeof result.then === 'function') {
                                result.then(next, function(result){
                                    hasErrors = true;
                                    report[name] = report[name]||{};
                                    report[name][rule] = result || true;
                                    resolve();
                                });
                            } else if (result === true) {
                                setTimeout(next, 1);
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
                    if (hasErrors) return $q.reject(report);
                    else return $q.when(data);
                });
            }
        }]);
})(angular);
