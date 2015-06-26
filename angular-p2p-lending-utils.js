(function (window, angular) {

  'use strict';

  var ngP2PModule = angular.module('ngP2PLendingUtils', []);

  /**
   * naming style convert
   *
   * @date      2015-06-26
   * @author    Peach<scdzwyxst@gmail.com>
   * @params    name(string)
   */

  function namingConvert (name) {
    name = name + '';
    return name.replace(/_([a-z])/g, function ($0, $1) {
      return $1.toUpperCase();
    })
  }

  /**
   * interest strategies
   *
   * @date      2015-06-26
   * @author    Peach<scdzwyxst@gmail.com>
   * @params    amount, rate(unit: year), time limit(unit: month)
   * @note
   * provide 2 way to calculate interest:
   *   1. averageCaptialPlusInterest - equal loan payment
   *   2. normal - normal way
   */
  
  var interestStrategiesMapping = {
    averageCaptialPlusInterest: 'averageCaptialPlusInterest',
    oneOnly: 'normal', // one-time repayment
    interestFirst: 'normal', // payment interest first and repayment principal in the end
    capitalFinal: 'normal' // payment interest by the month and repayment principal in the end
  }
  
  var interestStrategies = {
    averageCaptialPlusInterest: function (amount, rate, time) {
      rate /= 12;
      return amount * rate * Math.pow(1 + rate, time) / (Math.pow(1 + rate, time) - 1) * time - amount;
    },
    normal: function (amount, rate, time) {
      time /= 12;
      return amount * rate * time;
    }
  }

  /**
   * Service part
   */

  /**
   * interestCalc
   * 
   * @date      2015-06-26
   * @author    Peach<scdzwyxst@gmail.com>
   * @params    amount, rate(unit: year), time limit(unit: month)
   *            , lending way, reward(unit: year)
   * @return    interest
   */
  ngP2PModule.factory('interestCalc', function () {
    function un (val) {
      return angular.isUndefined(val);
    }
    return function (amount, rate, time, way, reward) {
      if(un(amount) || un(rate) || un(time) || un(way)){
        return console.error('Missing params: ', amount, rate, time, way);
      }
      // fix the rate, reward
      rate /= 100;
      reward && (reward /= 100);

      var type = interestStrategiesMapping[namingConvert(way)];

      if(!type)
        return console.error('Error lending way: ' + way);

      var interest = interestStrategies[type].call(null, amount, rate, time);

      // add reward if exist
      if(reward)
          interest += amount * reward;

      return interest;
    }
  });
    
})(window, window.angular)