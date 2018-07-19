/*
 *
 *
 *       Complete the API routing below
 *
 *
 */

'use strict';

var expect = require('chai').expect;
var MongoClient = require('mongodb');
var mongoose = require('mongoose');
var axios = require('axios');

var Stock = require('../models/Stock');

const CONNECTION_STRING = process.env.DB; //MongoClient.connect(CONNECTION_STRING, function(err, db) {});
mongoose.connect(CONNECTION_STRING, err => {
  if (err)
    console.log("Could'nt connect to db: " + err);
});

module.exports = function (app) {

  app.route('/api/stock-prices')
    .get(function (req, res) {
      var stock = req.query.stock;
      var like = req.query.like;

      if(typeof stock === 'object' && stock.length > 2)
        return res.status(400).send("You can't specify more than two stocks");
      
      if (typeof stock === 'string') {
        let temp = stock;
        stock = [];
        stock.push(temp);
      }

      let toReturnStocks = [];
      
      var promise = new Promise((resolve, reject) => {
        var checked = 0; 
        for (let i = 0; i < stock.length; i++) {
          if(stock[i] === '')
            return reject("Invalid stock name");
          Stock.findOne({
            stock: stock[i]
          }, (err, foundStock) => {
  
            if (err)
              return reject(err);
  
            if (!foundStock) {
              console.log("Creating new stock");
              axios.get(`https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${stock[i]}&apikey=${process.env.API_KEY}`).then(response => {
                if (response.data["Error Message"])
                  return reject("Didn't found stock with name: " + stock[i]);
  
                var today = formatDate(new Date());
  
                var stockPrice = response.data["Time Series (Daily)"][today] ? response.data["Time Series (Daily)"][today]["1. open"] : null;
  
                if (!stockPrice)
                  return reject("Didn't found stock today's price for " + stock[i])

                Stock.create({
                  stock: stock[i],
                  price: stockPrice,
                  updated_at: new Date()
                }, (err, createdStock) => {
                  console.log("HGFGHFG");
                  if (err)
                    return reject(err);
                  
                  if(like === "true") {
                    createdStock.likes = 1;
                    var request_ip = req.ip 
                    || req.connection.remoteAddress 
                    || req.socket.remoteAddress 
                    || req.connection.socket.remoteAddress;

              
                    createdStock.who_liked = [];
                    createdStock.who_liked.push(request_ip);
                    createdStock.save();
                  }  
  
                  toReturnStocks.push({
                      stock: createdStock.stock,
                      price: createdStock.price,
                      likes: createdStock.likes
                  });
                  ++checked;
                  if(checked === stock.length)
                    resolve();
                });
  
              });
            } else {
              
              var stockUpdateDate = formatDate(new Date(foundStock.updated_at));
              var todayDate = formatDate(new Date());
  
              if (like === "true") {
                var request_ip = req.ip 
                || req.connection.remoteAddress 
                || req.socket.remoteAddress 
                || req.connection.socket.remoteAddress;

                request_ip = 'fsdfsdf';
                

                let canGiveLike = true;
                if(foundStock.who_liked !== null && foundStock.who_liked.length > 0) {
                  
                  for(let i = 0; i < foundStock.who_liked.length; i++) {
                    if(foundStock.who_liked[i] == request_ip)
                    {
                      console.log(foundStock.who_liked[i]);
                      canGiveLike = false;
                      break;
                    }
                  }
                }
               
                if(canGiveLike) {
                  foundStock.likes = ++foundStock.likes;
                  if(foundStock.who_liked === null)
                    foundStock.who_liked = [];
                  
                  foundStock.who_liked.push(request_ip);  

                  foundStock.save();
                }
              }
  
              if (todayDate === stockUpdateDate) {
                console.log("Not updating stock price");
                toReturnStocks.push({
                  
                    stock: foundStock.stock,
                    price: foundStock.price,
                    likes: foundStock.likes
                });
                ++checked;
                if(checked === stock.length)
                    resolve();
              } else {
                console.log("Updating stock price");
                axios.get(`https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${stock[i]}&apikey=${process.env.API_KEY}`).then(response => {
                  if (response.data["Error Message"])
                    return reject("Didn't found stock with name: " + stock);
  
                  var today = formatDate(new Date());
  
                  if(!response.data["Time Series (Daily)"] || !response.data["Time Series (Daily)"][today])
                  {
                    toReturnStocks.push({
                        stock: foundStock.stock,
                        price: foundStock.price,
                        likes: foundStock.likes
                    });
                  } else {
                    var stockPrice = response.data["Time Series (Daily)"][today]["1. open"];
                  
                  foundStock.price = stockPrice;
                  foundStock.updated_at = new Date();
                  foundStock.save();
  
                  toReturnStocks.push({
                      stock: foundStock.stock,
                      price: foundStock.price,
                      likes: foundStock.likes
                  });
                  }
                  
                  ++checked;
                  if(checked === stock.length)
                    resolve();
                });
              }
            }
          });
          
        }
      });

      promise.then(() => {

        if(toReturnStocks.length === 1)
          return res.send({stockData: toReturnStocks[0]});
        else {
          var stocks = [];

          for(let i = 0; i < 2; i++) {
            if(i === 1) 
            {
              stocks.push({
                stock: toReturnStocks[i].stock,
                price: toReturnStocks[i].price ,
                rel_likes: toReturnStocks[i].likes - toReturnStocks[i - 1].likes
              })
            } else {
              stocks.push({
                stock: toReturnStocks[i].stock,
                price: toReturnStocks[i].price ,
                rel_likes: toReturnStocks[i].likes - toReturnStocks[i + 1].likes
              })
            }
          }

          res.send({stockData: stocks});
        }
          
      }).catch(((message) => res.status(400).send(message)));
      

      // axios.get(`https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${stock}&apikey=${process.env.API_KEY}`).then(response => {
      //   if (response.data["Error Message"])
      //     return res.status(200).send("Didn't found stock with name: " + stock);

      //   //getCurrentDate()  
      //   var today = getCurrentDate();

      //   var stockPrice = response.data["Time Series (Daily)"][today] ? response.data["Time Series (Daily)"][today]["1. open"] : null;

      //   if (!stockPrice)
      //     return res.send("Didn't found stock price for today")

      //   Stock.findOne({
      //     stock
      //   }, (err, foundStock) => {
      //     if (err)
      //       return res.status(400).send(err);

      //     if (!foundStock) {
      //       console.log("Creating new stock");
      //       Stock.create({
      //         stock,
      //         price: stockPrice
      //       }, (err, createdStock) => {
      //         console.log("HGFGHFG");
      //         if (err)
      //           return res.status(400).send(err);

      //         return res.send({
      //           stockPrice: {
      //             stock: createdStock.stock,
      //             price: createdStock.price,
      //             likes: createdStock.likes
      //           }
      //         });
      //       });
      //       console.log("fdsafas");
      //     } else {
      //       console.log("Stock already exists");
      //       if (like === "true") {
      //         foundStock.likes = ++foundStock.likes;
      //         foundStock.save();
      //       }

      //       res.send({
      //         stockPrice: {
      //           stock: foundStock.stock,
      //           price: foundStock.price,
      //           likes: foundStock.likes
      //         }
      //       });
      //     }
      //   });
      // }).catch(err => console.log(err));
    });
};


//Date Help functions

/* 
  Returns formatted date: YYYY-MM-DD
*/
function formatDate(date) {

  var year = date.getFullYear();
  var month = (date.getMonth() + 1) < 10 ? "0" + (date.getMonth() + 1) : date.getMonth() + 1;
  var day = date.getDate();

  var today = year + "-" + month + "-" + day;

  return today;
}