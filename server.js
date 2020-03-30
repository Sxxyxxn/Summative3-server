const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const myconn = require("./connection");

// every single collection will need a model
const Car = require("./models/cars-model");
const Comment = require("./models/comments-model");

// init express, bodyparser now built in to express...
const app = express();
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// added to allow us to upload images to public folder
app.use(fileUpload());
app.use("images", express.static("public"));
// end init express

// my functions
function updateAfterFileUpload(req, res, objFromDB, fileName) {
  // form data from frontend is stored in the request body , req.body
  var data = req.body;
  Object.assign(objFromDB, data);

  objFromDB.profile_image = fileName;

  objFromDB.save().then(
    response => {
      res.json({
        result: true
      });
    },
    error => {
      res.json({
        result: false
      });
    }
  );
}
// end  my functions

// init database stuff
mongoose.connect(myconn.atlas, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;

db.on("connected", e => {
  console.log("+++ Mongoose connected ");
});

db.on("error", () => console.log("Database error"));
// end database stuff

// start of routes
const router = express.Router();
// add api to beginning of all 'router' routes
app.use("/api", router);

// CRUD
// CREATE Cars ,with one optional image max
router.post("/cars", (req, res) => {
  var carModel = new Car();

  if (req.files) {
    var files = Object.values(req.files);
    var uploadedFileObject = files[0];
    var uploadedFileName = uploadedFileObject.name;
    var nowTime = Date.now();
    var newFileName = `${nowTime}_${uploadedFileName}`;

    uploadedFileObject.mv(`public/${newFileName}`).then(
      params => {
        updateAfterFileUpload(req, res, carModel, newFileName);
      },
      params => {
        updateAfterFileUpload(req, res, carModel);
      }
    );
  } else {
    updateAfterFileUpload(req, res, carModel);
  }
});

// READ all cars
router.get("/cars", (req, res) => {
  Car.find().then(
    data => {
      res.json(data);
    },
    error => {
      res.json(error);
    }
  );
});

// DELETE A car - Will probably never need this
// send this endpoint the mongo _id and it it'll delete the car
router.delete("/cars/:id", (req, res) => {
  Car.deleteOne({ _id: req.params.id }).then(
    () => {
      res.json({ result: true });
    },
    () => {
      res.json({ result: false });
    }
  );
});

// READ ONE car only
// comments to most recent first.
router.get("/cars/:id", (req, res) => {
  Car.findOne({ _id: req.params.id })
    .populate({ path: "comments", options: { sort: { updatedAt: -1 } } })
    .then(data => {
      res.json([data]);
    });
});

// POST a comment - every new comment is tied to a car name
// car name is stored in a hidden input field inside our create comment form
router.post("/comments", (req, res) => {
  var newComment = new Comment();
  var data = req.body;
  Object.assign(newComment, data);
  console.log(">>> ", data);

  newComment.save().then(
    result => {
      return res.json(result);
    },
    () => {
      return res.send("problem adding new comment");
    }
  );
});

// READ all comments
router.get("/comment", (req, res) => {
  Comment.find().then(
    data => {
      res.json(data);
    },
    error => {
      res.json(error);
    }
  );
});

//////////////////////////////////////////////////////////////////////
// THE rest of this is dealing with unhandled routes in a nice way //
router.get("/*", (req, res) => {
  res.json({ result: "invalid endpoint, please choose another" });
});

app.get("/*", (req, res) => {
  res.json({ result: "invalid endpoint, please choose another" });
});

// grab a port and start listening
const port = 4000;
app.listen(process.env.PORT || port, () => {
  console.log(`Example app listening on port ${port}!`);
});
