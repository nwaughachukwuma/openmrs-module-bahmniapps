'use strict';

angular.module('bahmni.common.uiHelper')
    .directive('focusOnInputErrors', function ($timeout) {
        return function (scope, elem) {
            var cleanUpListenerErrorsOnForm = scope.$on("event:errorsOnForm", function () {
                var isTopElement = true;
                $timeout(function() {
                    $("*", elem).each(function(){
                        if($(this).hasClass('illegalValue') && isTopElement) {
                            $(this).focus();
                            var scrollPosition = $(this).offset().top - window.innerHeight/2;
                            $(window).scrollTop(scrollPosition);
                            isTopElement = false;
                        }
                    });
                }, 1, false);
            });

            scope.$on("$destroy", cleanUpListenerErrorsOnForm);
        };
    });
