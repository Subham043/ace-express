const express = require('express');
const router = express.Router();
const { body, check, validationResult } = require('express-validator');
const { verifyAccessToken } = require('../../helper/jwt');
const verifyAdmin = require('../../middleware/admin');
const create = require('../../services/thirdSectionContent/create')
const update = require('../../services/thirdSectionContent/update')
const destroy = require('../../services/thirdSectionContent/delete')
const {get, getAll} = require('../../services/thirdSectionContent/get')
const { textValidation, IDValidation } = require('../../helper/validation');
const uuid4 = require('uuid4');
const fs = require('fs');
const path = require('path');


// home page second section edit route.
router.post('/create',
    verifyAccessToken,
    verifyAdmin,
    //custom validation for email
    body('heading').custom(async (value) => textValidation(value, 'heading')),
    body('paragraph').custom(async (value) => textValidation(value, 'paragraph')),
    body('image').custom(async (value, { req }) => {
        if(!req.files || Object.keys(req.files).length === 0){
            return Promise.reject('Please select a file');
        }
        if (req.files.image.mimetype == 'image/png' || req.files.image.mimetype == 'image/jpg' || req.files.image.mimetype == 'image/jpeg') {
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
                let { heading, paragraph } = req.body;
                let sampleFile = req.files.image;
                let newFileName = `${uuid4()}-${sampleFile.name}`;
                let uploadPath = 'public/api/uploads/' + newFileName;

                sampleFile.mv(uploadPath, async function (err) {
                    if (err){}

                    let updateData = await create({ heading, paragraph, image:newFileName, userId: req.payload.id })

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
body('heading').custom(async (value) => textValidation(value, 'heading')),
body('paragraph').custom(async (value) => textValidation(value, 'paragraph')),
body('image').custom(async (value, { req }) => {
    if(req.files){
        if (req.files.image.mimetype == 'image/png' || req.files.image.mimetype == 'image/jpg' || req.files.image.mimetype == 'image/jpeg') {
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
            let { heading, paragraph } = req.body;
            if(!req.files){
                let updateData = await update({id:req.params.id},{ heading, paragraph, userId: req.payload.id })

                return res.status(updateData.status).json({
                    message: updateData.message,
                });
            }

            let ticket = await get({
                id: req.params.id
            })

            if(ticket.data!=null){
                const dirPath = path.join(__dirname, '../../public/api/uploads/');
                fs.unlink(`${dirPath}${ticket.data.image}`, async (err) => {
                    if (err) { console.log(err); }
                });
            }

            let sampleFile = req.files.image;
            let newFileName = `${uuid4()}-${sampleFile.name}`;
            let uploadPath = 'public/api/uploads/' + newFileName;

            sampleFile.mv(uploadPath, async function (err) {
                if (err){}

                let updateData = await update({id:req.params.id},{ heading, paragraph, image:newFileName, userId: req.payload.id })

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
router.get('/view',
async function (req, res) {
    let ticket = await getAll({})

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
        const dirPath = path.join(__dirname, '../../public/api/uploads/');
        fs.unlink(`${dirPath}${ticket.data.image}`, async (err) => {
            if (err) { console.log(err); }
        });
    }

    let mainData = await destroy(req.params.id)

    return res.status(mainData.status).json({
        message: mainData.message,
    });

})



    module.exports = router;