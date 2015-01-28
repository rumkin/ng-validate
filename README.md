Angular module for dynamic asynchronous validation inspired with Waterline ORM models.

## Installation

Install via bower:
```
bower install ng-validate
```

... or via git:

```
git clone https://github.com/rumkin/ng-validate.git
```


## Usage

Add 'ngValidate' module and inject `$validate` service in your controller. Example:

```javascript
angular.module('App', ['ngValidate'])
    .controller('exampleCtrl', ['$validate', function($validate, $scope){
        // Data model
        $scope.model = {
            value : {
                equals : true
            },
            answer : {
                is: 42
            }
        };

        // Define custom types
        $scope.types = {
            is : function(accept, value) {
                return value === accept;
            }
        };

        // Method to validate model
        $scope.validate = function(data) {
            $validate(data, $scope.model, $scope.types).then(function(data){
                // All right
                scope.$errors = null;
            }, function(report){
                // Something goes wrong.
                // Report could be used with angular-messages to show notification like usual form $error object.
                scope.$errors = report;
            });
        }
    }]);
```

## Create custom validator

To create custom validator you should create a factory with question mark in end of name. For example: `required?` or `string?`.
Validators could return angular promised object produced with $q function call.

```javascript
someModule.factory('equals?', function(){
    return function equalsValidator(accept, value){
        return accept === value;
    }
});
```

Validator could be an object either and could contain filter method to softly update values:

```javascript
someModule.factory('default?', function(){
    return {
        filter : function(accept, value, name, model, state) {
            if (typeof value === 'undefined') {
                value = accept;
                state.$define('isDefault', function() { return true });
                state.isDefault = true;
            }
            return value;
        },
        validate : function(accept, value) {
            // Actually default rule has no validation logic so we return true anyway
            return true;
        }
    }
});

someModule.factory('required?', function(){
    return {
        before : function(value, name, model, state) {
            state.isUndefined = function() {
                return typeof this.$value === 'undefined';
            };
        },
        validate : function(accept, value, model, state) {
            return accept && !state.isUndefined();
        }
    }
});

someModule.factory('date?', function(){
    return {
        before : function(value, name, model, state) {
            state.isDate = function() {
                return value instanceOf Date;
            }
        },
        filter : function(accept, value, name, model, state) {
            if (! model[name].required && typeof value === 'undefined') return value;
            if (state.isDefault) return value;

            return typeof value === 'undefined' ? accept : value
        },
        validate : function(accept, value) {
            // Actually 'default' rule has no validation logic
            return true;
        }
    }
});
```

## TODO v0.2.0

- [ ] Error handling and reporting
- [ ] Angular directive for form and input

# TODO v.0.3.0

- [ ] Add built in validators:
    - [ ] Default value.
    - [ ] Type.
    - [ ] Enum.
    - [ ] String: minLength, maxLength, regex, charset.
    - [ ] Date: before, after, range.
    - [ ] Number: min, max, range, greater then, less then and so.
    - [ ] Array: item model, length.