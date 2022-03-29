const express = require('express');
const router = express.Router();
const { body, check, validationResult } = require('express-validator');
const { verifyAccessToken } = require('../helper/jwt');
const verifyAdmin = require('../middleware/admin');
const create = require('../services/product/create')
const update = require('../services/product/update')
const destroy = require('../services/product/delete')
const {get, getAll, getAndFindAll, getAndFindAllCustom} = require('../services/product/get')
const { textValidation, IDValidation } = require('../helper/validation');
const uuid4 = require('uuid4');
const fs = require('fs');
const path = require('path');
const { Sequeize, Op, QueryTypes } = require('sequelize');
const readXlsxFile = require('read-excel-file/node');


// home page second section edit route.
router.post('/create',
    verifyAccessToken,
    verifyAdmin,
    //custom validation for email
    body('name').custom(async (value) => textValidation(value, 'name')),
    body('price').custom(async (value) => textValidation(value, 'price')),
    body('description').custom(async (value) => textValidation(value, 'description')),
    body('productCategoryId').custom(async (value) => IDValidation(value, 'product category Id')),
    body('image').custom(async (value, { req }) => {
        if(!req.files || Object.keys(req.files).length === 0){
            return Promise.reject('Please select a file');
        }
        if (req.files.image.mimetype == 'image/png' || req.files.image.mimetype == 'image/jpg' || req.files.image.mimetype == 'image/jpeg' || req.files.image.mimetype == 'image/webp') {
            return true
        }
        return Promise.reject('Invalid image type');
    }),

    
    async function (req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                errors: errors.mapped(),
            });
        } else {

            try {
                let { name, price, description, productCategoryId } = req.body;
                let sampleFile = req.files.image;
                let newFileName = `${uuid4()}-${sampleFile.name}`;
                let uploadPath = 'public/products/' + newFileName;

                sampleFile.mv(uploadPath, async function (err) {
                    if (err){}

                    let updateData = await create({ name, price, description, productCategoryId, image:newFileName, userId: req.payload.id })
                    
                    return res.status(updateData.status).json({
                        message: updateData.message,
                    });
                });
                
            } catch (error) {
                console.log(error);
                return res.status(400).json({
                    message: 'Oops!! Something went wrong please try again.',
                });
            }
            
        }

    })


    // home page second section edit route.
router.post('/edit/:id',
verifyAccessToken,
verifyAdmin,
check('id').custom(async (value) => IDValidation(value, 'ticket id')),
check('id').custom(async (value, { req }) => {
    let ticket = await getAll({
        id: value,
    })
    if (ticket.data.length == 0) {
        return Promise.reject('Invalid id');
    }
}),
body('name').custom(async (value) => textValidation(value, 'name')),
body('price').custom(async (value) => textValidation(value, 'price')),
body('description').custom(async (value) => textValidation(value, 'description')),
body('productCategoryId').custom(async (value) => IDValidation(value, 'product category Id')),
body('image').custom(async (value, { req }) => {
    if(req.files){
        if (req.files.image.mimetype == 'image/png' || req.files.image.mimetype == 'image/jpg' || req.files.image.mimetype == 'image/jpeg' || req.files.image.mimetype == 'image/webp') {
            return true
        }
        return Promise.reject('Invalid image type');
    }
    
}),


async function (req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            errors: errors.mapped(),
        });
    } else {

        try {
            let { name, price, description, productCategoryId } = req.body;
            if(!req.files){
                let updateData = await update({id:req.params.id},{ name, price, description, productCategoryId, userId: req.payload.id })

                return res.status(updateData.status).json({
                    message: updateData.message,
                });
            }

            let ticket = await get({
                id: req.params.id
            })

            if(ticket.data!=null){
                const dirPath = path.join(__dirname, '../public/products/');
                fs.unlink(`${dirPath}${ticket.data.image}`, async (err) => {
                    if (err) { console.log(err); }
                });
            }

            let sampleFile = req.files.image;
            let newFileName = `${uuid4()}-${sampleFile.name}`;
            let uploadPath = 'public/products/' + newFileName;

            sampleFile.mv(uploadPath, async function (err) {
                if (err){}

                let updateData = await update({id:req.params.id},{ name, price, description, image:newFileName, userId: req.payload.id })

                return res.status(updateData.status).json({
                    message: updateData.message,
                });
            });
            
        } catch (error) {
            console.log(error);
            return res.status(400).json({
                message: 'Oops!! Something went wrong please try again.',
            });
        }
        
    }

})


// home page second section view route.
router.get('/view-custom',
async function (req, res) {
    const { page, size, search, price, category, sort, sortType } = req.query;
    
    let where = {}
    let includeWhere = {}

    if(search!=undefined && search!=null && search!=""){
        where = {...where,
            [Op.or]: [
                { name: {[Op.like]: `%${search}%`} },
                { price: {[Op.like]: `%${search}%`} },
                { description: {[Op.like]: `%${search}%`} },
            ],
        }
    }
    if(price!=undefined && price!=null && price!=""){
        const priceList = req.query.price.split(';');
        priceList.pop()
        let newPriceList = priceList.map((item)=>{
            return parseInt(item);
        })
        let list = newPriceList.sort(function(a, b){return a - b});
        where = {...where,
            // [Op.and]: [
            //     { price: {[Op.between]: list,} },
            // ],
            price: {[Op.between]: list,}
        }
    }


    if(category!=undefined && category!=null && category!=""){
        const categoryList = req.query.category.split(';');
        where = {...where,
            // [Op.and]: [
            //     { productCategoryId: {[Op.in]: categoryList} },
            // ],
            productCategoryId: {[Op.in]: categoryList}
        }
    }

    let ticket = await getAndFindAllCustom(where, includeWhere, sort, sortType, page, size)

    return res.status(ticket.status).json({
        message: ticket.message,
        data: ticket.data
    });

})

router.get('/view',
async function (req, res) {
    const { page, size } = req.query;
    let ticket = await getAndFindAll({}, page, size)

    return res.status(ticket.status).json({
        message: ticket.message,
        data: ticket.data
    });

})

// home page second section view route.
router.get('/view/:id',
check('id').custom(async (value) => IDValidation(value, 'ticket id')),
check('id').custom(async (value, { req }) => {
    let ticket = await getAll({
        id: value,
    })
    if (ticket.data.length == 0) {
        return Promise.reject('Invalid id');
    }
}),
async function (req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            errors: errors.mapped(),
        });
    }

    let ticket = await get({
        id:req.params.id
    })

    return res.status(ticket.status).json({
        message: ticket.message,
        data: ticket.data
    });

})

// home page second section view route.
router.delete('/delete/:id',
verifyAccessToken,
verifyAdmin,
check('id').custom(async (value) => IDValidation(value, 'ticket id')),
check('id').custom(async (value, { req }) => {
    let ticket = await getAll({
        id: value,
    })
    if (ticket.data.length == 0) {
        return Promise.reject('Invalid id');
    }
}),
async function (req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            errors: errors.mapped(),
        });
    }

    let ticket = await get({
        id: req.params.id
    })

    if(ticket.data!=null){
        const dirPath = path.join(__dirname, '../public/products/');
        fs.unlink(`${dirPath}${ticket.data.image}`, async (err) => {
            if (err) { console.log(err); }
        });
    }

    let mainData = await destroy(req.params.id)

    return res.status(mainData.status).json({
        message: mainData.message,
    });

})

// router.post('/create-via-excel/',
//     verifyAccessToken,
//     //custom validations
//     body('upload').custom(async (value, { req }) => {
//         if (!req.files || Object.keys(req.files).length === 0) {
//             return Promise.reject('Please select a file');
//         }
//         if (req.files.upload.mimetype == 'text/csv' || req.files.upload.mimetype == 'text/comma-separated-values' || req.files.upload.mimetype == 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || req.files.upload.mimetype == 'application/vnd.ms-excel') {
//             return true;
//         }
//         return Promise.reject('Invalid file type');
//     }),

//     async function (req, res) {
//         const errors = validationResult(req);
//         if (!errors.isEmpty()) {
//             return res.status(200).json({
//                 errors: errors.mapped(),
//             });
//         } else {

//             if (!req.files || Object.keys(req.files).length === 0) {
//                 return res.status(200).json({ error: 'No files were uploaded.' });
//             }
//             // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
//             try {
//                 let sampleFile = req.files.upload;
//                 let newFileName = `${uuid4()}-${sampleFile.name}`;
//                 const dirPath = path.join(__dirname, '../public/uploads/');
//                 let uploadPath = dirPath + newFileName;

//                 // Use the mv() method to place the file somewhere on your server
//                 sampleFile.mv(uploadPath, async function (err) {
//                     if (err) {
//                         return res.status(200).json({ err });
//                     }
//                 });

//                     readXlsxFile(uploadPath).then((rows) => {
//                         // skip header
//                         rows.shift();

//                         let data = [];

//                         rows.forEach(async (row) => {
//                             let excelData = {
//                                 name: row[0],
//                                 description: row[1],
//                                 price: row[2],
//                                 productCategoryId: row[3],
//                                 image: row[4],
//                             };
//                             data.push(excelData);
//                         });

//                         data.forEach(async (lead) => {
//                             // await Leads.create({ ...lead, userId: req.payload.id })
//                             await create({ ...lead, userId: req.payload.id })
//                         })
//                         // console.log(data)
//                         return res.status(200).json({
//                             message: 'lead stored successfully',
//                         });
//                     })
//                     .catch((err) => {
//                         console.log(err);
//                         return res.status(200).json({
//                             message: 'Oops!! Something went wrong please try again.',
//                         });
//                     })



//             } catch (error) {
//                 console.log(error);
//                 return res.status(200).json({
//                     message: 'Oops!! Something went wrong please try again.',
//                 });
//             }
//         }

//     })



    module.exports = router;