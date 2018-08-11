var express = require("express");
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var exphbs = require("express-handlebars");
var cheerio = require("cheerio");
var axios = require("axios");
var app = express();
var db = require("./models");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// TODO: MIGRATE TO HANDLEBARS AND MAKE A NICE LOOKING SPLASH PAGE WITH BUTTONS FOR SCRAPING

// app.engine("handlebars", exphbs({defaultLayout: "main"}));
// app.set("view engine", "handlebars");

mongoose.connect("mongodb://localhost/article");
var MONGODB_URI = process.env.PORT || 3000;

app.get("/scrape", function(req, res) {
    axios.get("https://www.npr.org/").then(function(response) {
      var $ = cheerio.load(response.data);
  
      $("article div.story-text").each(function(i, element) {
        var result = {};
  
        result.title = $(this)
          .children("a")
          .text();
        result.link = $(this)
          .children("a")
          .attr("href");
        result.summary = $(this)
          .children("a p")
          .text();
        console.log(result);

        // TODO: FIX UNHANDLED PROMISE REJECTION ERROR THAT BEGINS HERE
        db.Article.create(result)
          .then(function(dbArticle) {
            console.log(dbArticle);
          })
          .catch(function(err) {
            return res.json(err);
          });
      });
  
      res.send("Scrape Complete");
    });
  });
  
  app.get("/articles", function(req, res) {
    db.Article.find({})
      .then(function(dbArticle) {
        res.json(dbArticle);
      })
      .catch(function(err) {
        res.json(err);
      });
  });
  
  app.get("/articles/:id", function(req, res) {
    db.Article.findOne({ _id: req.params.id })
      .populate("comment")
      .then(function(dbArticle) {
        res.json(dbArticle);
      })
      .catch(function(err) {
        res.json(err);
      });
  });
  
  app.post("/articles/:id", function(req, res) {
    db.Comment.create(req.body)
      .then(function(dbComment) {
        return db.Article.findOneAndUpdate({ _id: req.params.id }, { comment: dbComment._id }, { new: true });
      })
      .then(function(dbArticle) {
        res.json(dbArticle);
      })
      .catch(function(err) {
        res.json(err);
      });
  });
  
  app.listen(MONGODB_URI, function() {
    console.log("App running on port " + MONGODB_URI + "!");
  });
  