const express = require('express');
const router = express.Router();
const { body, check, validationResult } = require('express-validator');
const { verifyAccessToken } = require('../helper/jwt');
const verifyAdmin = require('../middleware/admin');
const create = require('../services/orderRequest/create')
const bulkCreated = require('../services/orderRequestProduct/bulkCreated')
const destroy = require('../services/orderRequest/delete')
const {get, getAll, getAndFindAll} = require('../services/orderRequest/get')
const { textValidation, nameValidation, phoneValidation, emailValidation, IDValidation } = require('../helper/validation');
const { userMail , adminMail} = require('../helper/mailTemplate')
const { syncMail} = require('../helper/mail')
const ejs = require("ejs");
const pdf = require("html-pdf");
const path = require("path");


// home page second section edit route.
router.post('/create',
    //custom validation for email
    body('name').custom(async (value) => nameValidation(value)),
    body('phone').custom(async (value) => phoneValidation(value)),
    body('email').custom(async (value) => emailValidation(value)),
    body('message').custom(async (value) => textValidation(value, 'message')),
    body('product').custom(async (value) => {
        if(value==undefined || value==null){
            return Promise.reject('product is required');
        }
        if (!Array.isArray(value)) {
            return Promise.reject('product needs to be an array');
        }
        if(value.length==0){
            return Promise.reject('product is required');
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
                let { name, phone, email, message, product } = req.body;
                let updateData = await create({ name, phone, email, message })

                if(updateData.error==false){
                    var mainProd = []
                    product.forEach(element => {
                        mainProd.push({
                            orderRequestId:updateData.data.id,
                            productId:element
                        })
                    });
                    
                    mainProd.length>0 && await bulkCreated(mainProd)
                }

                if(updateData.error==false){
                    let sendData = await get({
                        id:updateData.data.id
                    })
                    // console.log(sendData.data);
                    let msg = await userMail(sendData.data)

                    ejs.renderFile(path.join(__dirname, '../email/', "catalogue-template.ejs"), {data: sendData.data}, (err, data) => {
                        if (err) {
                            //   res.send(err);
                              console.log(err);
                        } else {
                            let options = {
                                "height": "11.25in",
                                "width": "8.5in",
                                "header": {
                                    "height": "20mm",
                                    "contents": '<div style="width: 100%; height:20px;background-color:#02b8f4;position: fixed; top: 0;left: 0;"></div>'
                                },
                                "footer": {
                                    "height": "20mm",
                                    "contents": '<div style="width: 100%; height:20px;background-color:#02b8f4;position: fixed; bottom: 0;left: 0;"></div>'
                                },
                            };
                            pdf.create(data, options).toFile(path.join(__dirname, '../public/api/pdf/', "catalogue_"+sendData.data.id+".pdf"), function (err, data) {
                                if (err) {
                                    // res.send(err);
                                    console.log(err);
                                    syncMail(sendData.data.email,"ACE GIFTING - Catalogue Request #"+sendData.data.id,msg)
                                } else {
                                    console.log('done');
                                    attachments= [
                                        {   // file on disk as an attachment
                                            filename: 'catalogue.pdf',
                                            path: path.join(__dirname, '../public/api/pdf/', "catalogue_"+sendData.data.id+".pdf") // stream this file
                                        },
                                    ]
                                    syncMail(sendData.data.email,"ACE GIFTING - Catalogue Request #"+sendData.data.id,msg,attachments)
                                    // res.send("File created successfully");
                                }
                            });
                        }
                    });

                    let msgAdmin = await adminMail(sendData.data)
                    syncMail('info@acegiftingsolutions.com',"ACE GIFTING - Catalogue Request #"+sendData.data.id,msgAdmin)
                }

                return res.status(updateData.status).json({
                    message: updateData.message,
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
router.get('/view',
verifyAccessToken,
verifyAdmin,
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

    let mainData = await destroy(req.params.id)

    return res.status(mainData.status).json({
        message: mainData.message,
    });

})



    module.exports = router;