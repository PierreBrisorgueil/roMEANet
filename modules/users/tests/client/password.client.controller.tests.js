'use strict';

(function() {
  // Password controller Spec
  describe('PasswordController', function() {
    // Initialize global variables
    var PasswordController,
      scope,
      Authentication,
      $httpBackend,
      $stateParams,
      $location,
      $window;

    beforeEach(function() {
      jasmine.addMatchers({
        toEqualData: function(util, customEqualityTesters) {
          return {
            compare: function(actual, expected) {
              return {
                pass: angular.equals(actual, expected)
              };
            }
          };
        }
      });
    });

    // Load the main application module
    beforeEach(module(ApplicationConfiguration.applicationModuleName));

    describe('Logged in user', function() {
      beforeEach(inject(function($controller, $rootScope, _Authentication_, _$stateParams_, _$httpBackend_, _$location_) {
        // Set a new global scope
        scope = $rootScope.$new();

        // Point global variables to injected services
        Authentication = _Authentication_;
        $stateParams = _$stateParams_;
        $httpBackend = _$httpBackend_;
        $location = _$location_;
        $location.path = jasmine.createSpy().and.returnValue(true);

        $httpBackend.whenGET('/api/users/me').respond({ user: { username: 'test', roles: ['user'] } });

        // Ignore parent template gets on state transition
        $httpBackend.whenGET('/modules/core/client/views/404.client.view.html').respond(200);

        // Mock logged in user
        Authentication.user = {
          username: 'test',
          roles: ['user']
        };

        // Initialize the Authentication controller
        PasswordController = $controller('PasswordController as vm', {
          $scope: scope
        });
      }));

      afterEach(inject(function (Authentication) {
        Authentication.signout();
      }));

      it('should redirect logged in user to home', function() {
        expect($location.path).toHaveBeenCalledWith('/');
      });
    });

    describe('Logged out user', function() {
      beforeEach(inject(function($controller, $rootScope, _Authentication_, _$stateParams_, _$httpBackend_, _$location_) {
        // Set a new global scope
        scope = $rootScope.$new();

        // Point global variables to injected services
        Authentication = _Authentication_;
        $stateParams = _$stateParams_;
        $httpBackend = _$httpBackend_;
        $location = _$location_;
        $location.path = jasmine.createSpy().and.returnValue(true);
        Authentication.user = null;

        $httpBackend.whenGET('/api/users/me').respond({ user: null });

        // Ignore parent template gets on state transition
        $httpBackend.whenGET('/modules/core/client/views/404.client.view.html').respond(200);
        $httpBackend.whenGET('/modules/core/client/views/400.client.view.html').respond(200);

        // Initialize the Authentication controller
        PasswordController = $controller('PasswordController as vm', {
          $scope: scope
        });
      }));

      afterEach(inject(function (Authentication) {
        Authentication.signout();
      }));

      it('should not redirect to home', function() {
        expect($location.path).not.toHaveBeenCalledWith('/');
      });

      describe('askForPasswordReset', function() {
        var credentials = {
          username: 'test',
          password: 'P@ssw0rd!!'
        };
        beforeEach(function() {
          scope.vm.credentials = credentials;
        });

        it('should clear scope.success and scope.error', function() {
          scope.vm.success = 'test';
          scope.vm.error = 'test';
          scope.vm.askForPasswordReset(true);

          expect(scope.vm.success).toBeNull();
          expect(scope.vm.error).toBeNull();
        });

        describe('POST error', function() {
          var errorMessage = 'No account with that username has been found';
          beforeEach(function() {
            $httpBackend.when('POST', '/api/auth/forgot', credentials).respond(400, {
              'message': errorMessage
            });

            scope.vm.askForPasswordReset(true);
            $httpBackend.flush();
          });

          it('should clear form', function() {
            expect(scope.vm.credentials).toBe(null);
          });

          it('should set error to response message', function() {
            expect(scope.vm.error).toBe(errorMessage);
          });
        });

        describe('POST success', function() {
          var successMessage = 'An email has been sent to the provided email with further instructions.';
          beforeEach(function() {
            $httpBackend.when('POST', '/api/auth/forgot', credentials).respond({
              'message': successMessage
            });

            scope.vm.askForPasswordReset(true);
            $httpBackend.flush();
          });

          it('should clear form', function() {
            expect(scope.vm.credentials).toBe(null);
          });

          it('should set success to response message', function() {
            expect(scope.vm.success).toBe(successMessage);
          });
        });
      });

      describe('resetUserPassword', function() {
        var token = 'testToken';
        var passwordDetails = {
          password: 'test'
        };
        beforeEach(function() {
          $stateParams.token = token;
          scope.vm.passwordDetails = passwordDetails;
        });

        it('should clear scope.success and scope.vm.error', function() {
          scope.vm.success = 'test';
          scope.vm.error = 'test';
          scope.vm.resetUserPassword(true);

          expect(scope.vm.success).toBeNull();
          expect(scope.vm.error).toBeNull();
        });

        it('POST error should set scope.error to response message', function() {
          var errorMessage = 'Passwords do not match';
          $httpBackend.when('POST', '/api/auth/reset/' + token, passwordDetails).respond(400, {
            'message': errorMessage
          });

          scope.vm.resetUserPassword(true);
          $httpBackend.flush();

          expect(scope.vm.error).toBe(errorMessage);
        });

        describe('POST success', function() {
          var user = {
            username: 'test'
          };
          beforeEach(function() {
            $httpBackend.when('POST', '/api/auth/reset/' + token, passwordDetails).respond({ user: user });

            scope.vm.resetUserPassword(true);
            $httpBackend.flush();
          });

          it('should clear password form', function() {
            expect(scope.vm.passwordDetails).toBe(null);
          });

          it('should attach user profile', function() {
            expect(scope.vm.authentication.user).toEqual(user);
          });

          it('should redirect to password reset success view', function() {
            expect($location.path).toHaveBeenCalledWith('/password/reset/success');
          });
        });
      });
    });
  });
}());
