Angular module for dynamic asynchronous validation inspired with Waterline ORM models.

## Installation

Install via git:

```
git clone https://github.com/rumkin/ng-validate.git
```

## Usage

To use validation you should to add 'ngValdiate' module and than to inject `$validate` service. Example:

```javascript
    angular.module('App', ['ngValidate'])
        .controller('exampleCtrl', ['$validate', function($validate){
            // Data model
            scope.model = {
                value : {
                    equals : true
                }
            };

            // Method to validate model
            scope.validate = function(data) {
                $validate(data, $scope.model).then(function(data){
                    // All right
                    scope.$report = null;
                }, function(report){
                    // Something goes wrong.
                    // Report could be used with angular-messages to show notification.
                    scope.$report = report;
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
            filter : function(accept, value) {
                return typeof value === 'undefined' ? accept : value
            }
        }
    });
```
