(function (window, angular) {

  'use strict';

  var ngP2PModule = angular.module('ngP2PLendingUtils', []);

  function un (val) {
    return angular.isUndefined(val);
  }

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

  /**
   * repaymentPlanCalc
   * 
   * @date      2015-06-26
   * @author    Peach<scdzwyxst@gmail.com>
   * @params    amount, rate(unit: year), time limit(unit: month)
   *            , lending way
   * @return    interest
   */
  ngP2PModule.factory('repaymentPlanCalc', function () {

    /**
     * repayment plan strategies
     *
     * @date      2015-06-26
     * @author    Peach<scdzwyxst@gmail.com>
     * @params    amount, rate(unit: year), time limit(unit: month)
     * @note
     * provide 4 way to calculate repayment plan:
     *   1. averageCaptialPlusInterest - equal loan payment
     *   2. oneOnly - one-time repayment
     *   3. interestFirst - payment interest first and repayment principal in the end
     *   4. capitalFinal - payment interest by the month and repayment principal in the end
     */
    
    var planStrategies = {
      averageCaptialPlusInterest: function (amount, rate, time) {
        rate /= 12;

        var plans = [],
            pow = Math.pow((1 + rate), time*1),
            monthAmount = amount * rate *  pow / (pow-1);

        for (var i=0; i<time; i++){
          var interest = amount * rate;
          amount = amount - monthAmount + interest;

          plans.push({
            term: i+1,
            sum: monthAmount,
            principal: monthAmount - interest,
            interest: interest,
            balance: monthAmount * (time - i -1)
          });
        }

        return plans;
      },
      oneOnly: function (amount, rate, time) {
        var interest = rate * amount * time;

        return [{
          term: time,
          sum: interest*1 + amount*1,
          principal: amount,
          interest: interest,
          balance: 0
        }];
      },
      interestFirst: function (amount, rate, time) {
        var interest = rate * amount * time;

        return [{
            time: 1,
            sum: interest,
            principal: 0,
            interest: interest,
            balance: amount
        },{
            time: time,
            sum: amount,
            principal: amount,
            interest: 0,
            balance: 0
        }];
      },
      capitalFinal: function (amount, rate, time) {
        var plans = [],
            interest = rate * amount * time,
            mInterest = rate * amount;

        for(var i=1; i<=time; i++){
          plans.push({
            term: i,
            sum: i==time?mInterest*1 + amount*1: mInterest,
            principal: i==time?amount: 0,
            interest: mInterest,
            balance: i==time?0: amount*1 + mInterest*(time-i)
          });
        }

        return plans;
      }
    }

    return function (amount, rate, time, way) {
      if(un(amount) || un(rate) || un(time) || un(way)){
        return console.error('Missing params: ', amount, rate, time, way);
      }

      var handler = planStrategies[namingConvert(way)];

      if(!handler)
        return console.error('Error lending way: ' + way);

      // fix the rate, reward
      rate /= 100;
      
      return handler(amount, rate, time);
    }
  });
    
})(window, window.angular);