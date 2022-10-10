const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.SECRET_KEY; // private key for jsonWebToken
const Space = require('../models/space');
const Building = require('../models/building');
const { isValidObjectId, Types } = require('mongoose');

//## to do:
// the spaces represents zooms in building (i was to be: zoom, pool, every place u want a share)

//get a space
// get a specific building
const getSpace = (req, res) => {
  const { id } = req.params;

  jwt.verify(req.token, SECRET_KEY, async (err, userData) => {
    if (err) {
      return res.status(501).json({
        message: 'TOKEN_ERROR',
        error: err,
      });
    }

    let space = await Space.findById(id);
    if (!space) {
      return res.status(501).json({
        message: 'SPACE_NOT_FOUND',
        space,
      });
    }

    if (space) {
      return res.status(200).json({
        message: 'SPACE_FOUND',
        space,
      });
    }
  });
};

//create a space for building
const createSpace = (req, res) => {
  const { fromBuilding } = req.body;

  const spaces = req.body.spaces;

  if (!fromBuilding) {
    return res.status(500).json({
      message: 'BUILDING_ID_IS_REQUIRED',
    });
  }

  if (!isValidObjectId(fromBuilding)) {
    return res.status(500).json({
      message: 'BUILDING_ID_IS_INVALID',
    });
  }

  // ## JWT

  jwt.verify(req.token, SECRET_KEY, async (err, userData) => {
    if (err) {
      return res.status(501).json({
        message: 'TOKEN_ERROR',
        error: err,
      });
    }

    let buildingToEdit = await Building.findById(fromBuilding).populate(
      'spaces'
    );
    if (!buildingToEdit) {
      return res.status(501).json({
        message: 'BUILDING_NOT_FOUND',
      });
    }

    console.log(buildingToEdit);
    // -- if user decides create a space in same action on the building
    let arrOfSpaces = []; //arrayOfObjects
    let arrSpaceId = []; //Arra Of Ids

    if (req.body.spaces) {
      for (let i = 0; i < spaces.length; i++) {
        if (!spaces[i].space_name) {
          return res.status(500).json({
            message: 'NAME_IS_REQUIRED',
          });
        }
        if (arrOfSpaces?.find((sp) => sp.name === spaces[i].space_name)) {
          return res.status(500).json({
            message: 'NAMES_CANNOT_BE_REPEATED',
            A: spaces[i].space_name,
          });
        }

        //verify name is alredy exists
        if (
          buildingToEdit.spaces.find((s) => s.name === spaces[i].space_name)
        ) {
          return res.status(501).json({
            message: 'NAME_ALREDY_TAKEN',
          });
        }

        if (!spaces[i].timeSlotsFormat) {
          return res.status(500).json({
            message: 'TIME_CONFIG_IS_REQUIRED',
          });
        }

        if (
          (spaces[i].needConfirmation !== Boolean ||
            spaces[i].needConfirmation) === null ||
          spaces[i].needConfirmation === undefined
        ) {
          return res.status(500).json({
            message: 'PERMISSION_CONFIG_IS_REQUIRED',
          });
        }

        // ## CREATING A SPACE IN SAME ACTION

        const spaceId = Types.ObjectId();
        const space = {
          _id: spaceId,
          name: spaces[i].space_name,
          fromBuilding: fromBuilding,
          timeSlotsFormat: spaces[i].timeSlotsFormat,
          needConfirmation: spaces[i].needConfirmation,
          bookings: [],
        };
        arrSpaceId.push(spaceId);
        arrOfSpaces.push(space);
      }

      // saving multiple spaces

      Space.insertMany(arrOfSpaces, async function (err, result) {
        if (err) {
          return res.status(501).json({
            message: 'ERROR_SAVING_SPACE',
            error: err?.errors,
          });
        } else {
          //In this step add ids of spacec in "building"

          let building = await Building.findByIdAndUpdate(
            fromBuilding,
            {
              $push: { spaces: arrSpaceId },
            },
            { returnOriginal: false }
          );
          if (!building) {
            return res.status(501).json({
              message: 'ERROR_SAVING_BUILDING',
            });
          } else {
            console.log(building);
            return res.status(200).json({
              message: 'CREADO',
              data: building,
            });
          }
        }
      });
    }
  });

  // if (!fromBuilding) {
  //   return res.status(500).json({
  //     message: 'BUILDING_ID_IS_REQUIRED',
  //   });
  // }

  // if (!isValidObjectId(fromBuilding)) {
  //   return res.status(500).json({
  //     message: 'BUILDING_ID_IS_INVALID',
  //   });
  // }

  // if (!timeSlotsFormat) {
  //   return res.status(500).json({
  //     message: 'TIME_CONFIG_IS_REQUIRED',
  //   });
  // }

  // if (
  //   (needConfirmation !== Boolean || needConfirmation) === null ||
  //   needConfirmation === undefined
  // ) {
  //   return res.status(500).json({
  //     message: 'PERMISSION_CONFIG_IS_REQUIRED',
  //   });
  // }

  // jwt.verify(req.token, SECRET_KEY, async (err, userData) => {
  //   if (err) {
  //     return res.status(501).json({
  //       message: 'TOKEN_ERROR',
  //       error: err,
  //     });
  //   }

  //   let building = Building.findById(fromBuilding, function (err, building) {
  //     Space.populate(building, { path: 'spaces' }, function (err, building) {
  //       // building have in "spaces":all data from specific space
  //       if (err) {
  //         return res.status(501).json({
  //           message: 'DATA_ERROR',
  //           err,
  //         });
  //       }

  //       if (!building) {
  //         return res.status(501).json({
  //           message: 'BUILDING_NOT_FOUND',
  //           building,
  //         });
  //       }
  //       //verify name is taked
  //       if (building.spaces.find((s) => s.name === name)) {
  //         return res.status(501).json({
  //           message: 'NAME_ALREDY_TAKEN',
  //         });
  //       }

  //       const newId = Types.ObjectId();
  //       const space = new Space({
  //         _id: newId,
  //         name: name,
  //         fromBuilding,
  //         timeSlotsFormat,
  //         needConfirmation,
  //         bookings: [],
  //       });

  //       space.save(async (err, result) => {
  //         if (err) {
  //           return res.status(501).json({
  //             message: 'ERROR_SAVING_SPACE',
  //             error: err?.errors,
  //           });
  //         } else {
  //           await Building.findByIdAndUpdate(
  //             fromBuilding,
  //             {
  //               $push: {
  //                 spaces: newId,
  //               },
  //             },
  //             {
  //               returnOriginal: false,
  //             }
  //           );

  //           return res.status(200).json({
  //             message: 'CREADO',
  //             data: space,
  //           });
  //         }
  //       });
  //     });
  //   });
  // });
};

module.exports = {
  createSpace,
  getSpace,
};
