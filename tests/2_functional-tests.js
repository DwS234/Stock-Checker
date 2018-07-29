/*
*
*
*       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]-----
*       (if additional are added, keep them at the very end!)
*/

var chaiHttp = require('chai-http');
var chai = require('chai');
var assert = chai.assert;
var server = require('../server');
var Stock = require('../models/Stock');

chai.use(chaiHttp);

suite('Functional Tests', function() {

    suite('GET /api/stock-prices => stockData object', function() {
      this.beforeEach(function(done) {
        Stock.remove({stock: 'msft'}, function(err) {
          if(err)
            console.log('Could not remove items: ' + err);
          Stock.remove({stock: 'aa'}, function(err) {
            if(err)
              console.log('Could not remove items: ' + err);
            done();  
          });
        });
      });
      
      test('1 stock', function(done) {
       chai.request(server)
        .get('/api/stock-prices')
        .query({stock: 'msft'})
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.isObject(res.body.stockData);
          assert.isNotNull(res.body.stockData.stock);
          assert.isNotNull(res.body.stockData.price);
          assert.isNotNull(res.body.stockData.likes);
          assert.equal(res.body.stockData.stock, "msft");
          
          done();
        });
      });
      
      test('1 stock with like', function(done) {
        chai.request(server)
        .get('/api/stock-prices')
        .query({stock: 'goog', like: 'true'})
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.isObject(res.body.stockData);
          assert.isNotNull(res.body.stockData.stock);
          assert.isNotNull(res.body.stockData.price);
          assert.isNotNull(res.body.stockData.likes);
          assert.equal(res.body.stockData.stock, "goog");
          assert.equal(res.body.stockData.likes, 1);
          
          done();
        });
      });
      
      test('1 stock with like again (ensure likes arent double counted)', function(done) {
        chai.request(server)
        .get('/api/stock-prices')
        .query({stock: 'goog', like: 'true'})
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.isObject(res.body.stockData);
          assert.isNotNull(res.body.stockData.stock);
          assert.isNotNull(res.body.stockData.price);
          assert.isNotNull(res.body.stockData.likes);
          assert.equal(res.body.stockData.stock, "goog");
          assert.equal(res.body.stockData.likes, 1);
          
          done();
        });

      });
      
      test('2 stocks', function(done) {
        chai.request(server)
        .get('/api/stock-prices')
        .query('?stock=msft&stock=aa')
        .end(function(err, res){
          console.log(res.status);
          console.log(res.body);
          assert.equal(res.status, 200);
          assert.isArray(res.body.stockData);
          assert.isNotNull(res.body.stockData[0].stock);
          assert.isNotNull(res.body.stockData[0].price);
          assert.isNotNull(res.body.stockData[0].likes);
          assert.equal(res.body.stockData.stock[0], "msft");
          assert.isNotNull(res.body.stockData[1].stock);
          assert.isNotNull(res.body.stockData[1].price);
          assert.isNotNull(res.body.stockData[1].likes);
          assert.equal(res.body.stockData.stock[1], "aa");
          
          done();
        });
      });
      
      test('2 stocks with like', function(done) {
        
      });
      
    });

});
