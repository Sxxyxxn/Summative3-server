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
app.use("/assets", express.static("public"));
// end init express

// my functions
function updateAfterFileUpload(req, res, objFromDB, fileName) {
  // form data from frontend is stored in the request body , req.body
  var data = req.body;
  Object.assign(objFromDB, data);

  if (typeof fileName === "string") {
    objFromDB.car_image = fileName;
  }

  objFromDB.save().then(
    (response) => {
      res.json(response);
    },
    (error) => {
      res.json({
        result: false,
      });
    }
  );
}
// end  my functions

// init database stuff
mongoose.connect(myconn.atlas, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on("connected", (e) => {
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

  console.log("++++ ", req.body);

  if (req.files) {
    var files = Object.values(req.files);
    var uploadedFileObject = files[0];
    var uploadedFileName = uploadedFileObject.name;
    var nowTime = Date.now();
    var newFileName = `${nowTime}_${uploadedFileName}`;

    uploadedFileObject.mv(`public/${newFileName}`).then(
      (params) => {
        updateAfterFileUpload(req, res, carModel, newFileName);
      },
      (params) => {
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
    (data) => {
      res.json(data);
    },
    (error) => {
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
    .then((data) => {
      res.json([data]);
    });
});

//UPDATE ONE car
//new changes
router.put("/cars/:id", (req, res) => {
  Car.findOne({ _id: req.params.id }, function (err, objFromDB) {
    if (err)
      return res.json({
        result: false,
      });

    if (req.files) {
      var files = Object.values(req.files);
      var uploadedFileObject = files[0];
      var uploadedFileName = uploadedFileObject.name;
      var nowTime = Date.now();
      var newFileName = `${nowTime}_${uploadedFileName}`;

      uploadedFileObject.mv(`public/${newFileName}`).then(
        (params) => {
          updateAfterFileUpload(req, res, objFromDB, newFileName);
        },
        (params) => {
          updateAfterFileUpload(req, res, objFromDB);
        }
      );
    } else {
      updateAfterFileUpload(req, res, objFromDB);
    }
    /////////
  });
});

// added route to help with debug only, _id followed by img name
// http://localhost:4000/api/cars/updateimage/5e97822121b8b303fae3aae1/1586222939259_mazda_6.png
router.put("/cars/updateimage/:id/:imgpath", (req, res) => {
  Car.findOne({ _id: req.params.id }, function (err, objFromDB) {
    updateAfterFileUpload(req, res, objFromDB, req.params.imgpath);
  });
});

// router.put("/cars/:id", (req, res) => {
//   car.findOne({ _id: req.params.id }, function (err, objFromDB) {
//     console.log(">>> ", req.body);
//     console.log("+++ ", objFromDB);
//   });
// });

// old version
// router.put("/cars/:id", (req, res) => {
//   Car.findOne({ _id: req.params.id }, function (err, objFromDB) {
//     if (err) return res.json({ result: false });
//     var data = req.body;
//     Object.assign(objFromDB, data);
//     objFromDB.save();
//     return res.json({ result: true });
//     //OR
//     // return res.send(objFromDB);
//   });
// });

// POST a comment - every new comment  must be tied to a car name
// car name is stored in a hidden input field inside our create new comment form
router.post("/comments", (req, res) => {
  var newComment = new Comment();
  var data = req.body;
  Object.assign(newComment, data);
  console.log("+++ ", newComment);

  newComment.save().then(
    (result) => {
      return res.json(result);
    },
    () => {
      return res.send("problem adding new comment");
    }
  );
});

// READ all comments
router.get("/comments", (req, res) => {
  Comment.find().then(
    (data) => {
      res.json(data);
    },
    (error) => {
      res.json(error);
    }
  );
});

// delete a comment
router.delete("/comments/:id", (req, res) => {
  Comment.deleteOne({ _id: req.params.id }).then(
    () => {
      res.json({ result: true });
    },
    () => {
      res.json({ result: false });
    }
  );
});

router.get("/comments/delete-all", (req, res) => {
  //CAREFUL with this it works.....
  // Comment.find()
  //   .remove({})
  //   .then(
  //     () => {
  //       res.json({ result: true });
  //     },
  //     () => {
  //       res.json({ result: false });
  //     }
  //   );
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
